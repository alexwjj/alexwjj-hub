import { useState } from "react";

export function GithubAvatar({ id, login }: { id: string; login: string }) {
  const [failed, setFailed] = useState("");
  return (
    <span className="account-avatar github-avatar" aria-hidden="true">
      {login.slice(0, 1).toLowerCase()}
      {failed !== id && (
        <img
          src={`https://avatars.githubusercontent.com/u/${encodeURIComponent(id)}?s=96`}
          alt=""
          loading="lazy"
          referrerPolicy="no-referrer"
          onError={() => setFailed(id)}
        />
      )}
    </span>
  );
}
