import {
  createHash,
  createHmac,
  randomBytes,
  timingSafeEqual,
} from "node:crypto";

export function configuration(env = process.env) {
  const origin = new URL(env.APP_ORIGIN || "http://127.0.0.1:5173").origin;
  if (env.VERCEL && !origin.startsWith("https://"))
    throw new Error("APP_ORIGIN must use HTTPS");
  return {
    origin,
    secret: env.SESSION_SECRET || "",
    clientId: env.GITHUB_CLIENT_ID || "",
    clientSecret: env.GITHUB_CLIENT_SECRET || "",
    ownerId: env.OWNER_GITHUB_ID || "29943063",
    googleClientId: env.GOOGLE_CLIENT_ID || "",
    googleClientSecret: env.GOOGLE_CLIENT_SECRET || "",
  };
}

export function seal(value, secret) {
  if (secret.length < 32)
    throw new Error("SESSION_SECRET must contain at least 32 characters");
  const data = Buffer.from(JSON.stringify(value)).toString("base64url");
  return `${data}.${createHmac("sha256", secret).update(data).digest("base64url")}`;
}

export function unseal(token, secret, now = Date.now()) {
  try {
    if (!token || token.length > 4096 || secret.length < 32) return null;
    const [data, signature, extra] = token.split(".");
    if (!data || !signature || extra) return null;
    const expected = createHmac("sha256", secret).update(data).digest();
    const actual = Buffer.from(signature, "base64url");
    if (actual.length !== expected.length || !timingSafeEqual(expected, actual))
      return null;
    const value = JSON.parse(Buffer.from(data, "base64url").toString());
    return Number.isFinite(value.exp) && value.exp > now ? value : null;
  } catch {
    return null;
  }
}

function cookieName(config, kind) {
  return `${config.origin.startsWith("https://") ? "__Host-" : ""}hub_${kind}`;
}
export function cookie(config, kind, value, seconds) {
  return `${cookieName(config, kind)}=${encodeURIComponent(value)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${seconds}${config.origin.startsWith("https://") ? "; Secure" : ""}`;
}
function readCookie(request, name) {
  const part = request.headers
    .get("cookie")
    ?.split(";")
    .find((p) => p.trim().startsWith(name + "="));
  try {
    return part ? decodeURIComponent(part.trim().slice(name.length + 1)) : null;
  } catch {
    return null;
  }
}
export function googleAvatar(value) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" &&
      !url.username &&
      !url.password &&
      !url.port &&
      (url.hostname === "googleusercontent.com" ||
        url.hostname.endsWith(".googleusercontent.com")) &&
      url.href.length <= 1024
      ? url.href
      : "";
  } catch {
    return "";
  }
}
export function session(request, config) {
  const value = unseal(
    readCookie(request, cookieName(config, "session")),
    config.secret,
  );
  if (
    !value ||
    typeof value.id !== "string" ||
    typeof value.login !== "string" ||
    typeof value.name !== "string"
  )
    return null;
  const google = /^google:[0-9]{1,255}$/.test(value.id);
  if (!google && !/^[0-9]+$/.test(value.id)) return null;
  return {
    id: value.id,
    login: value.login,
    name: value.name,
    provider: google ? "google" : "github",
    avatar_url: google ? googleAvatar(value.avatar_url) : "",
    isOwner: !google && value.id === config.ownerId,
  };
}
const hubOrigins = new Set([
  "https://alexwjj-hub.vercel.app",
  "https://alexwjj-hub.weightbook.icu",
]);
export function sameOrigin(request, config) {
  const target = new URL(request.url).origin;
  return (
    request.headers.get("origin") === target &&
    (target === config.origin || hubOrigins.has(target))
  );
}

export async function authRoute(request, config, fetcher = fetch) {
  const url = new URL(request.url);
  const path = url.pathname;
  const signed = config.secret.length >= 32;
  const providers = {
    github: signed && !!config.clientId && !!config.clientSecret,
    google: signed && !!config.googleClientId && !!config.googleClientSecret,
  };
  if (path === "/api/auth/session")
    return Response.json({
      user: session(request, config),
      loginEnabled: providers.github || providers.google,
      providers,
    });
  if (path === "/api/auth/logout") {
    if (request.method !== "POST" || !sameOrigin(request, config))
      return Response.json({ error: "请求来源无效" }, { status: 403 });
    return Response.json(
      { ok: true },
      { headers: { "set-cookie": cookie(config, "session", "", 0) } },
    );
  }
  const google =
    path === "/api/auth/google/login" || path === "/api/auth/google/callback";
  const provider = google ? "google" : "github";
  const loginPath = google ? "/api/auth/google/login" : "/api/auth/login";
  const callbackPath = google
    ? "/api/auth/google/callback"
    : "/api/auth/callback";
  if (request.method !== "GET" || ![loginPath, callbackPath].includes(path))
    return Response.json({ error: "接口不存在" }, { status: 404 });
  if (!providers[provider])
    return Response.json({ error: "此登录方式尚未开放" }, { status: 503 });
  const clientId = google ? config.googleClientId : config.clientId;
  const clientSecret = google ? config.googleClientSecret : config.clientSecret;
  const oauthCookie = google ? "oauth_google" : "oauth";
  const redirectUri = config.origin + callbackPath;
  if (path === loginPath) {
    if (url.origin !== config.origin)
      return new Response(null, {
        status: 302,
        headers: { location: config.origin + loginPath },
      });
    const state = randomBytes(32).toString("base64url");
    const verifier = randomBytes(32).toString("base64url");
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      state,
      scope: google ? "openid profile" : "read:user",
      code_challenge: createHash("sha256").update(verifier).digest("base64url"),
      code_challenge_method: "S256",
      ...(google ? { response_type: "code", prompt: "select_account" } : {}),
    });
    return new Response(null, {
      status: 302,
      headers: {
        location:
          (google
            ? "https://accounts.google.com/o/oauth2/v2/auth?"
            : "https://github.com/login/oauth/authorize?") + params,
        "set-cookie": cookie(
          config,
          oauthCookie,
          seal(
            { state, verifier, provider, exp: Date.now() + 600_000 },
            config.secret,
          ),
          600,
        ),
      },
    });
  }
  const state = unseal(
    readCookie(request, cookieName(config, oauthCookie)),
    config.secret,
  );
  const fail = () =>
    new Response(null, {
      status: 302,
      headers: {
        location: config.origin + "/#/guestbook?login=failed",
        "set-cookie": cookie(config, oauthCookie, "", 0),
      },
    });
  if (
    !state ||
    (state.provider || "github") !== provider ||
    url.origin !== config.origin ||
    url.searchParams.get("state") !== state.state ||
    !url.searchParams.get("code") ||
    url.searchParams.has("error")
  )
    return fail();
  try {
    const tokenResponse = await fetcher(
      google
        ? "https://oauth2.googleapis.com/token"
        : "https://github.com/login/oauth/access_token",
      {
        method: "POST",
        headers: {
          accept: "application/json",
          "content-type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
          code: url.searchParams.get("code"),
          code_verifier: state.verifier,
          redirect_uri: redirectUri,
          ...(google ? { grant_type: "authorization_code" } : {}),
        }),
        signal: AbortSignal.timeout(10_000),
      },
    );
    if (!tokenResponse.ok) return fail();
    const token = await tokenResponse.json();
    if (typeof token.access_token !== "string" || !token.access_token)
      return fail();
    // Read the authenticated identity directly from the provider over HTTPS.
    const response = await fetcher(
      google
        ? "https://openidconnect.googleapis.com/v1/userinfo"
        : "https://api.github.com/user",
      {
        headers: {
          Authorization: "Bearer " + token.access_token,
          Accept: "application/json",
          "User-Agent": "alexwjj-hub",
        },
        signal: AbortSignal.timeout(10_000),
      },
    );
    if (!response.ok) return fail();
    const user = await response.json();
    let identity;
    if (google) {
      if (typeof user.sub !== "string" || !/^[0-9]{1,255}$/.test(user.sub))
        return fail();
      identity = {
        id: "google:" + user.sub,
        login: "google",
        name: String(user.name || "Google 用户").slice(0, 100),
        avatar_url: googleAvatar(user.picture),
      };
    } else {
      if (
        !Number.isSafeInteger(user.id) ||
        user.id <= 0 ||
        !/^[a-z\d-]{1,39}$/i.test(user.login)
      )
        return fail();
      identity = {
        id: String(user.id),
        login: user.login,
        name: String(user.name || user.login).slice(0, 100),
      };
    }
    const headers = new Headers({ location: config.origin + "/#/guestbook" });
    headers.append(
      "set-cookie",
      cookie(
        config,
        "session",
        seal({ ...identity, exp: Date.now() + 7 * 86_400_000 }, config.secret),
        7 * 86400,
      ),
    );
    headers.append("set-cookie", cookie(config, oauthCookie, "", 0));
    return new Response(null, { status: 302, headers });
  } catch {
    return fail();
  }
}
