import { useState } from "react";

export function UserAvatar({
  id,
  login,
  avatar_url,
}: {
  id: string;
  login: string;
  avatar_url?: string;
}) {
  const [failed, setFailed] = useState("");
  const google = id.startsWith("google:");
  let avatar = google
    ? ""
    : `https://avatars.githubusercontent.com/u/${encodeURIComponent(id)}?s=96`;
  if (google && avatar_url) {
    try {
      const url = new URL(avatar_url);
      if (
        url.protocol === "https:" &&
        url.hostname.endsWith(".googleusercontent.com")
      )
        avatar = url.href;
    } catch {
      /* Fall back to the initial. */
    }
  }
  return (
    <span className="account-avatar github-avatar" aria-hidden="true">
      {login.slice(0, 1).toLowerCase()}
      {avatar && failed !== avatar && (
        <img
          src={avatar}
          alt=""
          loading="lazy"
          referrerPolicy="no-referrer"
          onError={() => setFailed(avatar)}
        />
      )}
    </span>
  );
}

export function AccountIdentity({
  id,
  login,
  name,
}: {
  id: string;
  login: string;
  name: string;
}) {
  const content = (
    <>
      <strong>{name}</strong>
      <small>{id.startsWith("google:") ? "Google 用户" : "@" + login}</small>
    </>
  );
  return id.startsWith("google:") ? (
    <span className="account-identity">{content}</span>
  ) : (
    <a
      className="account-identity"
      href={`https://github.com/${encodeURIComponent(login)}`}
      target="_blank"
      rel="noreferrer"
    >
      {content}
    </a>
  );
}
