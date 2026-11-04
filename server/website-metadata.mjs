import { lookup } from "node:dns/promises";
import { request } from "node:https";

export function publicIPv4(address) {
  const p = address.split(".").map(Number);
  if (p.length !== 4 || p.some((n) => !Number.isInteger(n) || n < 0 || n > 255))
    return false;
  const [a, b] = p;
  return !(
    a === 0 ||
    a === 10 ||
    a === 127 ||
    a >= 224 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && [0, 168].includes(b)) ||
    (a === 198 && [18, 19, 51].includes(b)) ||
    (a === 203 && b === 0)
  );
}
export function websiteURL(value) {
  const url = new URL(value);
  if (
    url.protocol !== "https:" ||
    url.username ||
    url.password ||
    (url.port && url.port !== "443") ||
    !/^[a-z\d.-]+$/i.test(url.hostname) ||
    !url.hostname.includes(".") ||
    /(?:^|\.)(?:localhost|local|internal|invalid|test)$/.test(url.hostname)
  )
    throw new Error("请输入公开网站的 HTTPS 链接");
  if (/^[\d.]+$/.test(url.hostname) && !publicIPv4(url.hostname))
    throw new Error("不支持本地或私有网络地址");
  return url;
}
const plain = (value) =>
  value
    .replace(/<[^>]*>/g, "")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/\s+/g, " ")
    .trim();
export async function websiteMetadata(value, redirects = 0) {
  const url = websiteURL(value);
  let timer;
  let address;
  try {
    address = await Promise.race([
      lookup(url.hostname, { family: 4 }),
      new Promise((_, reject) => {
        timer = setTimeout(
          () => reject(new Error("读取超时，请手动填写")),
          4000,
        );
      }),
    ]);
  } finally {
    clearTimeout(timer);
  }
  if (!publicIPv4(address.address))
    throw new Error("不支持读取本地或私有网络地址");
  const response = await new Promise((resolve, reject) => {
    const req = request(
      url,
      {
        method: "GET",
        family: 4,
        autoSelectFamily: false,
        lookup: (_host, _options, callback) =>
          callback(null, address.address, 4),
        headers: {
          "User-Agent": "AlexHub-LinkPreview/1.0",
          accept: "text/html",
        },
      },
      (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400) {
          res.resume();
          resolve({ redirect: res.headers.location });
          return;
        }
        if (
          res.statusCode !== 200 ||
          !String(res.headers["content-type"]).includes("text/html")
        ) {
          res.resume();
          reject(new Error("无法读取网页信息，请手动填写"));
          return;
        }
        let length = 0;
        const chunks = [];
        res.on("data", (chunk) => {
          length += chunk.length;
          if (length > 512_000) {
            req.destroy(new Error("网页过大，请手动填写"));
            return;
          }
          chunks.push(chunk);
        });
        res.on("end", () =>
          resolve({ html: Buffer.concat(chunks).toString("utf8") }),
        );
        res.on("error", reject);
      },
    );
    req.setTimeout(5000, () => req.destroy(new Error("读取超时，请手动填写")));
    req.on("error", reject);
    req.end();
  });
  if (response.redirect) {
    if (redirects >= 2) throw new Error("网页跳转过多，请手动填写");
    return websiteMetadata(new URL(response.redirect, url).href, redirects + 1);
  }
  const title = plain(
    response.html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] ||
      url.hostname,
  ).slice(0, 100);
  let description = "";
  for (const tag of response.html.match(/<meta\b[^>]*>/gi) || []) {
    if (
      !/(?:name|property)\s*=\s*["'](?:description|og:description)["']/i.test(
        tag,
      )
    )
      continue;
    description = plain(
      tag.match(/\bcontent\s*=\s*(["'])([\s\S]*?)\1/i)?.[2] || "",
    ).slice(0, 500);
    if (description) break;
  }
  return { title, description, url: url.href };
}
