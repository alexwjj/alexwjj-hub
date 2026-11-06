import { rateLimit } from "./db.mjs";

// Each attachment is re-encoded by the editor before posting. Keep four images
// plus JSON/base64 overhead comfortably within the existing function transport.
const maxImageBytes = 480 * 1024;
export const messageBodyLimit = 4 * Math.ceil(maxImageBytes / 3) * 4 + 16_384;
const fail = (error, status) => Response.json({ error }, { status });
function validId(value) {
  return (
    typeof value === "string" &&
    /^[1-9]\d{0,18}$/.test(value) &&
    BigInt(value) <= 9223372036854775807n
  );
}
function imageType(bytes) {
  if (bytes.length < 16) return null;
  if (
    bytes.toString("ascii", 0, 4) === "RIFF" &&
    bytes.readUInt32LE(4) === bytes.length - 8 &&
    bytes.toString("ascii", 8, 12) === "WEBP" &&
    ["VP8 ", "VP8L", "VP8X"].includes(bytes.toString("ascii", 12, 16))
  )
    return "image/webp";
  if (
    bytes[0] === 255 &&
    bytes[1] === 216 &&
    bytes[2] === 255 &&
    bytes.at(-2) === 255 &&
    bytes.at(-1) === 217
  )
    return "image/jpeg";
  return null;
}
function validImage(value) {
  if (
    typeof value !== "string" ||
    value.length > Math.ceil(maxImageBytes / 3) * 4 ||
    !/^[A-Za-z0-9+/]+={0,2}$/.test(value)
  )
    return false;
  const bytes = Buffer.from(value, "base64");
  return (
    bytes.length <= maxImageBytes &&
    bytes.toString("base64") === value &&
    !!imageType(bytes)
  );
}
const fields = `m.id::text, m.user_id, m.login, m.name, m.avatar_url, coalesce(m.content,'') AS content,
  m.created_at, m.parent_id::text, m.root_id::text, m.deleted, cardinality(m.images) AS image_count`;

export function getMessages(db) {
  return db.query(`WITH roots AS (
    SELECT r.id FROM hub_messages r WHERE r.root_id IS NULL
      AND (NOT r.deleted OR EXISTS (SELECT 1 FROM hub_messages c WHERE c.root_id=r.id AND NOT c.deleted))
    ORDER BY r.created_at DESC, r.id DESC LIMIT 100
  ) SELECT ${fields}, CASE WHEN p.deleted THEN '已删除的留言' ELSE p.name END AS reply_to_name
    FROM roots JOIN hub_messages m ON m.id=roots.id OR (m.root_id=roots.id AND NOT m.deleted)
    LEFT JOIN hub_messages p ON p.id=m.parent_id
    ORDER BY roots.id DESC, m.id ASC`);
}

export async function getMessageImage(db, path) {
  const match = /^\/api\/message-images\/(\d+)\/([0-3])$/.exec(path);
  if (!match || !validId(match[1])) return fail("图片不存在", 404);
  const [row] = await db.query(
    "SELECT encode(images[$2::int],'base64') AS data FROM hub_messages WHERE id=$1 AND NOT deleted",
    [match[1], Number(match[2]) + 1],
  );
  if (!row?.data) return fail("图片不存在", 404);
  const bytes = Buffer.from(row.data, "base64");
  return new Response(bytes, {
    headers: {
      "content-type": imageType(bytes),
      "content-security-policy": "default-src 'none'; sandbox",
    },
  });
}

export async function writeMessage(db, method, user, body) {
  if (method === "DELETE") {
    if (!validId(String(body.id))) return fail("留言编号无效", 400);
    const rows = await db.query(
      "UPDATE hub_messages SET deleted=true,content=NULL,images='{}' WHERE id=$1 AND NOT deleted AND (user_id=$2 OR $3::boolean) RETURNING id",
      [body.id, user.id, user.isOwner],
    );
    return rows.length
      ? Response.json({ ok: true })
      : fail("留言不存在或无权删除", 403);
  }
  const { content, images = [], parent_id = null } = body.entry ?? body;
  if (!Array.isArray(images) || images.length > 4 || !images.every(validImage))
    return fail("图片格式无效或超过大小限制", 400);
  if (
    typeof content !== "string" ||
    content.trim().length > 1000 ||
    (!content.trim() && !images.length)
  )
    return fail("请写下内容或添加图片，文字最多 1000 字", 400);
  if (parent_id !== null && !validId(parent_id))
    return fail("回复对象无效", 400);
  if (!(await rateLimit(db, "message:" + user.id, 1, 30)))
    return fail("请等待 30 秒后再留言", 429);
  const [row] = await db.query(
    `WITH target AS (
    SELECT id,root_id,name FROM hub_messages WHERE id=$5::bigint AND NOT deleted FOR SHARE
  ), inserted AS (
    INSERT INTO hub_messages(user_id,login,name,content,parent_id,root_id,images,avatar_url)
    SELECT $1,$2,$3,nullif($4,''),$5::bigint,(SELECT coalesce(root_id,id) FROM target),
      ARRAY(SELECT decode(value,'base64') FROM jsonb_array_elements_text($6::jsonb)), $7
    WHERE $5::bigint IS NULL OR EXISTS (SELECT 1 FROM target)
    RETURNING *
  ) SELECT ${fields},(SELECT name FROM target) AS reply_to_name FROM inserted m`,
    [
      user.id,
      user.login,
      user.name,
      content.trim(),
      parent_id,
      JSON.stringify(images),
      user.avatar_url || "",
    ],
  );
  return row
    ? Response.json({ message: row }, { status: 201 })
    : fail("这条留言已删除，请刷新后再回复", 409);
}
