import { useEffect, useRef, useState, type ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { api, useAuth } from "./account";
import { GithubAvatar } from "./components/GithubAvatar";
import { Icon, PageHeading } from "./components/hub-ui";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "./components/ui/dialog";
import { prepareImage } from "./lib/guestbook-image";

type Message = {
  id: string;
  user_id: string;
  login: string;
  name: string;
  content: string;
  created_at: string;
  root_id: string | null;
  parent_id: string | null;
  reply_to_name: string | null;
  image_count: number;
  deleted: boolean;
};
type EditorProps = {
  target?: Message;
  text: string;
  setText: (text: string) => void;
  onPublished: (message: Message) => void;
  onCancel?: () => void;
};
function MessageEditor({
  target,
  text,
  setText,
  onPublished,
  onCancel,
}: EditorProps) {
  const { user, loginEnabled, loading } = useAuth();
  const [images, setImages] = useState<string[]>([]),
    [error, setError] = useState(""),
    [busy, setBusy] = useState<"" | "images" | "publish">("");
  const picker = useRef<HTMLInputElement>(null),
    locked = useRef(false);
  async function attach(files: File[]) {
    if (!files.length || locked.current || !user) return;
    if (images.length + files.length > 4) {
      setError("每条最多 4 张图片，请减少后重试");
      return;
    }
    locked.current = true;
    setBusy("images");
    setError("");
    try {
      const prepared: string[] = [];
      for (const file of files) prepared.push(await prepareImage(file));
      setImages((old) => [...old, ...prepared]);
    } catch (e) {
      setError(
        e instanceof Error && e.name !== "EncodingError"
          ? e.message
          : "无法读取这张图片，请重新选择",
      );
    } finally {
      locked.current = false;
      setBusy("");
    }
  }
  return (
    <form
      className={target ? "guestbook-form reply-form" : "guestbook-form"}
      onSubmit={async (e) => {
        e.preventDefault();
        if (!user || locked.current || (!text.trim() && !images.length)) return;
        locked.current = true;
        setBusy("publish");
        setError("");
        try {
          // A text-only server must reject a rich post, never silently drop its images or reply target.
          const payload =
            target || images.length
              ? {
                  entry: {
                    content: text,
                    parent_id: target?.id ?? null,
                    images: images.map((data) =>
                      data.slice(data.indexOf(",") + 1),
                    ),
                  },
                }
              : { content: text };
          const result = await api<{ message: Message }>("/api/messages", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
          setImages([]);
          setText("");
          onPublished(result.message);
        } catch (e) {
          setError((e as Error).message);
        } finally {
          locked.current = false;
          setBusy("");
        }
      }}
    >
      {target && (
        <div className="reply-form-heading">
          <span>
            回复 <strong>{target.name}</strong>
          </span>
          <button
            disabled={!!busy}
            type="button"
            className="text-link"
            onClick={onCancel}
          >
            取消回复
          </button>
        </div>
      )}
      <textarea
        id={target ? undefined : "message"}
        aria-label={target ? "回复内容" : "写下留言"}
        autoFocus={!!target}
        placeholder={
          target
            ? "写下你的回复，或直接粘贴截图…"
            : "写下想交流的事，或直接粘贴截图…"
        }
        disabled={!user || busy === "publish"}
        value={text}
        onChange={(e) => setText(e.target.value)}
        maxLength={1000}
        onPaste={(e) => {
          const files = Array.from(e.clipboardData.files);
          if (files.length) {
            e.preventDefault();
            void attach(files);
          }
        }}
      />
      {!!images.length && (
        <div className="message-attachments">
          {images.map((src, i) => (
            <span className="draft-image" key={i}>
              <img src={src} alt={`待发布图片 ${i + 1}`} />
              <button
                type="button"
                disabled={!!busy}
                aria-label={`移除图片 ${i + 1}`}
                onClick={() =>
                  setImages((old) => old.filter((_, j) => i !== j))
                }
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}
      <div className="compose-bottom">
        <div className="attachment-controls">
          {user && (
            <>
              <input
                ref={picker}
                hidden
                type="file"
                multiple
                accept="image/png,image/jpeg,image/webp"
                onChange={(e) => {
                  const files = Array.from(e.target.files ?? []);
                  e.target.value = "";
                  void attach(files);
                }}
              />
              <button
                type="button"
                className="pill"
                disabled={!!busy || images.length >= 4}
                title="支持粘贴或选择 PNG、JPEG、WebP，每张最多 8 MB"
                onClick={() => picker.current?.click()}
              >
                <Icon name="image" size={15} />
                添加图片
              </button>
            </>
          )}
          <small className="mono">
            {text.length}/1000 · {images.length}/4 图
          </small>
        </div>
        {user ? (
          <button
            className="pill primary"
            disabled={!!busy || (!text.trim() && !images.length)}
          >
            {busy === "images"
              ? "处理图片中…"
              : busy === "publish"
                ? "发布中…"
                : target
                  ? "发布回复"
                  : "发布留言"}
            <Icon name="arrow" size={13} />
          </button>
        ) : (
          <a
            className="pill primary"
            href={loginEnabled ? "/api/auth/login" : undefined}
            aria-disabled={loading || !loginEnabled}
          >
            GitHub 登录后留言
            <Icon name="github" size={14} />
          </a>
        )}
      </div>
      {error && (
        <p className="inline-error" role="alert">
          {error}
        </p>
      )}
    </form>
  );
}

const formatTime = new Intl.DateTimeFormat("zh-CN", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Asia/Shanghai",
});
type RowProps = {
  message: Message;
  onPublished: (message: Message) => void;
  onDelete: (id: string) => void;
  onPreview: (src: string) => void;
  children?: ReactNode;
};
function MessageRow({
  message: m,
  onPublished,
  onDelete,
  onPreview,
  children,
}: RowProps) {
  const { user, loginEnabled } = useAuth();
  const [reply, setReply] = useState(false),
    [text, setText] = useState(""),
    [error, setError] = useState(""),
    [removing, setRemoving] = useState(false);
  return (
    <article className={m.root_id ? "reply-card" : "glass message-card"}>
      {!m.deleted && <GithubAvatar id={m.user_id} login={m.login} />}
      <div className="message-main">
        {m.deleted ? (
          <p className="muted">这条留言已删除。</p>
        ) : (
          <>
            <div className="message-meta">
              <a
                href={`https://github.com/${m.login}`}
                target="_blank"
                rel="noreferrer"
              >
                {m.name}
                <span>@{m.login}</span>
              </a>
              {m.parent_id && (
                <span className="reply-recipient">回复 {m.reply_to_name}</span>
              )}
              <time dateTime={m.created_at}>
                {formatTime.format(new Date(m.created_at))}
              </time>
              {user && (user.isOwner || user.id === m.user_id) && (
                <button
                  disabled={removing}
                  className="icon-button ml-auto"
                  aria-label={`删除 ${m.login} 的留言`}
                  onClick={async () => {
                    if (
                      !window.confirm(
                        "删除这条发言及配图？其他人的回复会保留。",
                      )
                    )
                      return;
                    setRemoving(true);
                    setError("");
                    try {
                      await api("/api/messages", {
                        method: "DELETE",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ id: m.id }),
                      });
                      onDelete(m.id);
                    } catch (e) {
                      setError((e as Error).message);
                    } finally {
                      setRemoving(false);
                    }
                  }}
                >
                  <Icon name="x" size={13} />
                </button>
              )}
            </div>
            {m.content && <p>{m.content}</p>}
            {!!m.image_count && (
              <div className="message-attachments">
                {Array.from({ length: m.image_count }, (_, i) => {
                  const src = `/api/message-images/${m.id}/${i}`;
                  return (
                    <button
                      key={src}
                      className="posted-image"
                      aria-label={`放大第 ${i + 1} 张图片`}
                      onClick={() => onPreview(src)}
                    >
                      <img src={src} loading="lazy" alt={`留言配图 ${i + 1}`} />
                    </button>
                  );
                })}
              </div>
            )}
            {!reply &&
              (user ? (
                <button
                  className="text-link message-reply"
                  onClick={() => setReply(true)}
                >
                  回复
                </button>
              ) : (
                <a
                  className="text-link message-reply"
                  href={loginEnabled ? "/api/auth/login" : undefined}
                  aria-disabled={!loginEnabled}
                >
                  登录后回复
                </a>
              ))}
            {reply && user && (
              <MessageEditor
                target={m}
                text={text}
                setText={setText}
                onCancel={() => setReply(false)}
                onPublished={(message) => {
                  onPublished(message);
                  setReply(false);
                }}
              />
            )}
            {error && (
              <p className="inline-error" role="alert">
                {error}
              </p>
            )}
          </>
        )}
        {children}
      </div>
    </article>
  );
}
export function Guestbook() {
  const { user, loginEnabled } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]),
    [text, setText] = useState(""),
    [listError, setListError] = useState(""),
    [fetching, setFetching] = useState(true);
  const [preview, setPreview] = useState(""),
    [previewOpen, setPreviewOpen] = useState(false);
  const [revision, setRevision] = useState(0);
  const location = useLocation();
  function refresh() {
    setFetching(true);
    setListError("");
    setRevision((v) => v + 1);
  }
  useEffect(() => {
    const controller = new AbortController();
    api<{ messages: Message[] }>("/api/messages", { signal: controller.signal })
      .then((result) => {
        if (!controller.signal.aborted) setMessages(result.messages);
      })
      .catch((e) => {
        if (!controller.signal.aborted) setListError(e.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setFetching(false);
      });
    return () => controller.abort();
  }, [revision]);
  function published(message: Message) {
    setMessages((old) =>
      message.root_id ? [...old, message] : [message, ...old],
    );
    refresh();
  }
  function removed(id: string) {
    setMessages((old) =>
      old.map((m) =>
        m.id === id
          ? { ...m, deleted: true, content: "", image_count: 0 }
          : m.parent_id === id
            ? { ...m, reply_to_name: "已删除的留言" }
            : m,
      ),
    );
    refresh();
  }
  const replies = new Map<string, Message[]>();
  for (const m of messages)
    if (m.root_id && !m.deleted) {
      const group = replies.get(m.root_id);
      if (group) group.push(m);
      else replies.set(m.root_id, [m]);
    }
  const roots = messages.filter(
    (m) => !m.root_id && (!m.deleted || replies.has(m.id)),
  );
  const handlers = {
    onPublished: published,
    onDelete: removed,
    onPreview: (src: string) => {
      setPreview(src);
      setPreviewOpen(true);
    },
  };
  return (
    <>
      <PageHeading
        eyebrow="GUESTBOOK / SAY HELLO"
        title="留个想法，让交流发生。"
        description="聊聊作品，推荐一个好工具，或分享你最近在做的事。"
      />
      <div className="guestbook-layout">
        <section className="glass guestbook-compose">
          <div className="flex items-center gap-3">
            {user ? (
              <GithubAvatar id={user.id} login={user.login} />
            ) : (
              <span className="account-avatar">
                <Icon name="user" size={17} />
              </span>
            )}
            <div>
              <strong className="text-[13px] font-medium">
                {user?.name || "访客"}
              </strong>
              <small className="block text-[10px] muted mt-1">
                {user ? "以当前账号发布" : "使用 GitHub 账号参与交流"}
              </small>
            </div>
            <span className="ml-auto text-[10px] muted flex items-center gap-1.5">
              <Icon name="shield" size={12} />
              {user ? "已登录" : "未登录"}
            </span>
          </div>
          <MessageEditor
            key={user?.id ?? "guest"}
            text={text}
            setText={setText}
            onPublished={published}
          />
          {new URLSearchParams(location.search).get("login") === "failed" && (
            <p className="inline-error" role="alert">
              GitHub 登录未完成，请重新登录。
            </p>
          )}
        </section>
        <aside className="glass guestbook-note">
          <Icon name="messages" size={27} />
          <h2>
            每一次交流，
            <br />
            都是新的连接。
          </h2>
          <p>
            关于作品的反馈、好用的工具，
            <br />
            或一个还没成形的想法，都值得聊聊。
          </p>
          <div className="guestbook-topics mt-5">
            {["作品反馈", "工具推荐", "合作交流", "打个招呼"].map((t) => (
              <button
                key={t}
                className="tag"
                onClick={() => {
                  if (user) setText((value) => (value ? value : t + "："));
                  document.getElementById("message")?.focus();
                }}
              >
                {t}
              </button>
            ))}
          </div>
        </aside>
      </div>
      <div className="guestbook-list-title">
        <h2>
          交流记录{" "}
          <span>
            {roots.length} 条留言 ·{" "}
            {messages.filter((m) => m.root_id && !m.deleted).length} 条回复
          </span>
        </h2>
        <button className="text-link" disabled={fetching} onClick={refresh}>
          <Icon name="refresh" size={12} />
          刷新
        </button>
      </div>
      {listError && (
        <p className="inline-error" role="alert">
          {listError}
        </p>
      )}
      {fetching && !roots.length ? (
        <p className="data-placeholder">正在读取留言…</p>
      ) : !roots.length && !listError ? (
        <div className="glass guestbook-empty">
          <span className="round-button !w-[58px] !h-[58px]">
            <Icon name="message-circle" size={27} />
          </span>
          <h2>第一条留言，留给你。</h2>
          <p>这里还很安静。分享一个想法，或先打个招呼。</p>
          <button
            className="text-link mt-5"
            onClick={() => {
              if (!user) {
                if (!loginEnabled) return;
                window.location.assign("/api/auth/login");
                return;
              }
              document.getElementById("message")?.focus();
            }}
          >
            写下第一条留言
            <Icon name="arrow" size={13} />
          </button>
        </div>
      ) : (
        <div className="messages-list">
          {roots.map((root) => (
            <MessageRow key={root.id} message={root} {...handlers}>
              {replies.has(root.id) && (
                <div className="thread-replies">
                  {replies.get(root.id)!.map((m) => (
                    <MessageRow key={m.id} message={m} {...handlers} />
                  ))}
                </div>
              )}
            </MessageRow>
          ))}
        </div>
      )}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="message-image-dialog">
          <DialogHeader className="sr-only">
            <DialogTitle>留言图片</DialogTitle>
            <DialogDescription>图片大图预览</DialogDescription>
          </DialogHeader>
          {preview && <img src={preview} alt="留言配图大图" />}
        </DialogContent>
      </Dialog>
    </>
  );
}
