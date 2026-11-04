import { Icon, PageHeading } from "./components/hub-ui";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { projectUrlForHost } from "./lib/project-links";
import { analyticsSnippet } from "./lib/analytics";
import { createContext, useContext, useEffect, useId, useState } from "react";
import type { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  ArrowRight,
  ChevronsUpDown,
  Check,
  Code2,
  Loader2,
  LogOut,
  ShieldCheck,
} from "lucide-react";
import { Combobox } from "@base-ui/react/combobox";
import { Button } from "@/components/ui/button";
import "./account.css";

export type User = {
  id: string;
  login: string;
  name: string;
  isOwner: boolean;
};
type AuthState = {
  user: User | null;
  loading: boolean;
  loginEnabled: boolean;
  logout: () => Promise<void>;
};
const AuthContext = createContext<AuthState>({
  user: null,
  loading: true,
  loginEnabled: false,
  logout: async () => {},
});
export const useAuth = () => useContext(AuthContext);

export async function api<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const response = await fetch(path, {
    credentials: "same-origin",
    cache: "no-store",
    ...options,
  });
  const body = await response.json();
  if (!response.ok) throw new Error(body.error || "请求失败，请稍后重试");
  return body;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState({
    user: null as User | null,
    loading: true,
    loginEnabled: false,
  });
  useEffect(() => {
    const controller = new AbortController();
    api<{ user: User | null; loginEnabled: boolean }>("/api/auth/session", {
      signal: controller.signal,
    })
      .then((value) => setState({ ...value, loading: false }))
      .catch(() => {
        if (!controller.signal.aborted)
          setState({ user: null, loading: false, loginEnabled: false });
      });
    return () => controller.abort();
  }, []);
  const logout = async () => {
    await api("/api/auth/logout", { method: "POST" });
    setState((s) => ({ ...s, user: null }));
  };
  return (
    <AuthContext.Provider value={{ ...state, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function AccountButton() {
  const { user, loading, loginEnabled, logout } = useAuth();
  const [error, setError] = useState("");
  if (loading)
    return (
      <span className="account-loading" aria-label="正在检查登录">
        <Loader2 size={14} />
      </span>
    );
  if (!user)
    return (
      <Button
        className="account-login"
        size="sm"
        variant="outline"
        nativeButton={false}
        render={<a href="/api/auth/login" />}
        disabled={!loginEnabled}
        title={loginEnabled ? "使用 GitHub 登录" : "GitHub 登录暂未开放"}
      >
        <Code2 size={14} />
        <span>GitHub 登录</span>
      </Button>
    );
  return (
    <div className="account-control">
      <Link
        className="account-name"
        to={user.isOwner ? "/admin" : "/guestbook"}
      >
        {user.isOwner && <ShieldCheck size={14} />}
        <span>@{user.login}</span>
      </Link>
      <button
        aria-label="退出登录"
        title={error || "退出登录"}
        onClick={() => {
          logout().catch(() => setError("退出失败，请重试"));
        }}
      >
        <LogOut size={14} />
      </button>
    </div>
  );
}

function Header({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <PageHeading
      eyebrow={eyebrow}
      title={title}
      description={String(children)}
    />
  );
}

type Message = {
  id: string;
  user_id: string;
  login: string;
  name: string;
  content: string;
  created_at: string;
};
export function Guestbook() {
  const { user, loginEnabled, loading } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState(""),
    [error, setError] = useState(""),
    [listError, setListError] = useState("");
  const [busy, setBusy] = useState(false),
    [fetching, setFetching] = useState(true);
  const location = useLocation();
  async function refresh() {
    setFetching(true);
    setListError("");
    try {
      const data = await api<{ messages: Message[] }>("/api/messages");
      setMessages(data.messages);
    } catch (e) {
      setListError((e as Error).message);
    } finally {
      setFetching(false);
    }
  }
  useEffect(() => {
    void refresh();
  }, []);
  return (
    <>
      <Header eyebrow="GUESTBOOK / SAY HELLO" title="留个想法，让交流发生。">
        聊聊作品，推荐一个好工具，或分享你最近在做的事。
      </Header>
      <div className="guestbook-layout">
        <section className="glass guestbook-compose">
          <div className="flex items-center gap-3">
            <span className="account-avatar !w-[42px] !h-[42px] !text-[21px]">
              {user?.login.slice(0, 1).toLowerCase() || "a"}
            </span>
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
          <form
            className="guestbook-form"
            onSubmit={async (e) => {
              e.preventDefault();
              if (busy || !user) return;
              setBusy(true);
              setError("");
              try {
                const result = await api<{ message: Message }>(
                  "/api/messages",
                  {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ content: text }),
                  },
                );
                setMessages((old) => [result.message, ...old]);
                setText("");
              } catch (e) {
                setError((e as Error).message);
              } finally {
                setBusy(false);
              }
            }}
          >
            <label htmlFor="message" className="sr-only">
              写下留言
            </label>
            <textarea
              id="message"
              aria-label="写下留言"
              placeholder={"写下想交流的事…\n\n想法、建议、问题都欢迎。"}
              disabled={!user}
              value={text}
              onChange={(e) => setText(e.target.value)}
              maxLength={1000}
              required
            />
            <div className="compose-bottom">
              <span>
                留言会公开显示。
                <small className="mono block mt-1">{text.length} / 1000</small>
              </span>
              {user ? (
                <button
                  className="pill primary"
                  disabled={busy || !text.trim()}
                  type="submit"
                >
                  {busy ? "发布中…" : "发布留言"}
                  <Icon name="arrow" size={13} />
                </button>
              ) : (
                <a
                  className="pill primary"
                  href="/api/auth/login"
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
            {new URLSearchParams(location.search).get("login") === "failed" && (
              <p className="inline-error" role="alert">
                GitHub 登录未完成，请重新登录。
              </p>
            )}
          </form>
        </section>
        <aside className="glass guestbook-note">
          <Icon name="message" size={25} />
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
          <div className="flex flex-wrap gap-2 mt-5">
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
          交流记录 <span>{messages.length} 条</span>
        </h2>
        <button
          className="text-link"
          disabled={fetching}
          onClick={() => void refresh()}
        >
          <Icon name="refresh" size={12} />
          刷新
        </button>
      </div>
      {fetching && !messages.length ? (
        <p className="data-placeholder">正在读取留言…</p>
      ) : listError ? (
        <p className="inline-error" role="alert">
          {listError}
        </p>
      ) : !messages.length ? (
        <div className="glass guestbook-empty">
          <span className="round-button !w-[48px] !h-[48px]">
            <Icon name="message" size={22} />
          </span>
          <h2>第一条留言，留给你。</h2>
          <p>这里还很安静。分享一个想法，或先打个招呼。</p>
          <button
            className="text-link mt-5"
            onClick={() => {
              if (!user) {
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
          {messages.map((message) => (
            <article className="glass message-card" key={message.id}>
              <div className="message-avatar">
                {message.login.slice(0, 1).toLowerCase()}
              </div>
              <div className="message-main">
                <div className="message-meta">
                  <a
                    href={`https://github.com/${message.login}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {message.name}
                    <span>@{message.login}</span>
                  </a>
                  <time dateTime={message.created_at}>
                    {new Intl.DateTimeFormat("zh-CN", {
                      dateStyle: "medium",
                      timeStyle: "short",
                      timeZone: "Asia/Shanghai",
                    }).format(new Date(message.created_at))}
                  </time>
                  {user && (user.isOwner || user.id === message.user_id) && (
                    <button
                      className="icon-button ml-auto"
                      aria-label={`删除 ${message.login} 的留言`}
                      onClick={async () => {
                        if (!window.confirm("删除这条留言？")) return;
                        try {
                          await api("/api/messages", {
                            method: "DELETE",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ id: message.id }),
                          });
                          setMessages((old) =>
                            old.filter((m) => m.id !== message.id),
                          );
                        } catch (e) {
                          setError((e as Error).message);
                        }
                      }}
                    >
                      <Icon name="x" size={13} />
                    </button>
                  )}
                </div>
                <p>{message.content}</p>
              </div>
            </article>
          ))}
        </div>
      )}
    </>
  );
}

type RegistryProject = {
  id: string;
  name: string;
  url: string | null;
  repo: string | null;
  visibility: string;
  origins: string[];
};
type CountRow = { name?: string; path?: string; count: number };
type Analytics = {
  errors?: CountRow[];
  summary: {
    views: number;
    visitors: number;
    sessions: number;
    errors: number;
    engagement: number;
  };
  daily: { day: string; views: number; visitors: number }[];
  pages: CountRow[];
  events: CountRow[];
  referrers: CountRow[];
  devices: CountRow[];
  metrics: { name: string; value: number }[];
  perProject: {
    project_id: string;
    views: number;
    visitors: number;
    errors: number;
  }[];
};

function ProjectPicker({
  projects,
  value,
  onChange,
}: {
  projects: RegistryProject[];
  value: string;
  onChange: (id: string) => void;
}) {
  const labelId = useId();
  const choices = [{ id: "", name: "全部作品" }, ...projects];
  return (
    <div className="analytics-project-field">
      <span id={labelId}>项目</span>
      <Combobox.Root
        items={choices}
        value={choices.find((p) => p.id === value) || choices[0]}
        onValueChange={(item) => onChange(item?.id || "")}
        itemToStringLabel={(item) => item.name}
        isItemEqualToValue={(a, b) => a.id === b.id}
        filter={(item, query) =>
          `${item.name} ${item.id}`
            .toLowerCase()
            .includes(query.trim().toLowerCase())
        }
      >
        <Combobox.Trigger
          className="project-picker-trigger"
          aria-labelledby={labelId}
        >
          <Combobox.Value />
          <ChevronsUpDown size={16} />
        </Combobox.Trigger>
        <Combobox.Portal>
          <Combobox.Positioner
            sideOffset={6}
            className="project-picker-positioner"
          >
            <Combobox.Popup className="project-picker-popup">
              <Combobox.Input
                className="project-picker-search"
                aria-label="搜索作品项目"
                placeholder="搜索作品名称或项目 ID…"
              />
              <Combobox.Empty className="project-picker-empty">
                没有找到匹配的作品
              </Combobox.Empty>
              <Combobox.List className="project-picker-list">
                {(item: { id: string; name: string }) => (
                  <Combobox.Item
                    key={item.id}
                    value={item}
                    className="project-picker-option"
                  >
                    <span>{item.name}</span>
                    <Combobox.ItemIndicator>
                      <Check size={16} />
                    </Combobox.ItemIndicator>
                  </Combobox.Item>
                )}
              </Combobox.List>
            </Combobox.Popup>
          </Combobox.Positioner>
        </Combobox.Portal>
      </Combobox.Root>
    </div>
  );
}

export function OwnerDashboard() {
  const { user, loading } = useAuth();
  const [days, setDays] = useState("30"),
    [projectId, setProjectId] = useState("");
  const [projects, setProjects] = useState<RegistryProject[]>([]),
    [data, setData] = useState<Analytics | null>(null);
  const [error, setError] = useState(""),
    [busy, setBusy] = useState(true),
    [version, setVersion] = useState(0);
  const [copied, setCopied] = useState(false);
  const location = useLocation();
  const [detailsOpen, setDetailsOpen] = useState(false),
    [setupOpen, setSetupOpen] = useState(false),
    [chartMetric, setChartMetric] = useState("PV");
  useEffect(() => {
    setSetupOpen(new URLSearchParams(location.search).get("setup") === "1");
  }, [location.search]);
  useEffect(() => {
    if (!user?.isOwner) return;
    const controller = new AbortController();
    setBusy(true);
    setError("");
    Promise.all([
      api<{ projects: RegistryProject[] }>("/api/admin/projects", {
        signal: controller.signal,
      }),
      api<Analytics>(
        `/api/admin/analytics?days=${days}${projectId ? "&project=" + encodeURIComponent(projectId) : ""}`,
        { signal: controller.signal },
      ),
    ])
      .then(([registry, report]) => {
        setProjects(
          registry.projects.map((project) => ({
            ...project,
            url: projectUrlForHost(project, window.location.hostname),
          })),
        );
        setData(report);
      })
      .catch((e) => {
        if (!controller.signal.aborted) setError(e.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setBusy(false);
      });
    return () => controller.abort();
  }, [user?.isOwner, days, projectId, version]);
  if (loading) return <p className="data-placeholder">正在检查身份…</p>;
  if (!user?.isOwner)
    return (
      <div className="empty-state">
        <ShieldCheck size={32} />
        <h1>这是站长的工作区</h1>
        <p>只有站点所有者可以查看作品数据。</p>
        <Button nativeButton={false} render={<Link to="/" />}>
          回到总览
          <ArrowRight size={14} />
        </Button>
      </div>
    );
  const selected = projects.find((p) => p.id === projectId);
  const chartDays = Array.from({ length: Number(days) }, (_, i) => {
    const day = new Date(
      Date.now() + 8 * 3600_000 - (Number(days) - i - 1) * 86400_000,
    )
      .toISOString()
      .slice(0, 10);
    return (
      data?.daily.find((d) => d.day === day) || { day, views: 0, visitors: 0 }
    );
  });
  const snippet = analyticsSnippet(selected?.id || "");
  const chartMax = Math.max(
    3,
    Math.ceil(
      Math.max(
        1,
        ...chartDays.map((day) =>
          chartMetric === "PV" ? day.views : day.visitors,
        ),
      ) / 30,
    ) * 30,
  );
  const totalViews = data?.summary.views || 0;
  const averageSeconds = Math.round(
    (data?.summary.engagement || 0) /
      Math.max(1, data?.summary.sessions || 0) /
      1000,
  );
  const formatDuration =
    averageSeconds >= 60
      ? `${Math.floor(averageSeconds / 60)}分${averageSeconds % 60}秒`
      : `${averageSeconds}秒`;
  const pageNames: Record<string, string> = {
    "/": "首页",
    "/projects": "作品",
    "/workflows": "工作流",
    "/tools": "AI 工具箱",
    "/resources": "能力库",
    "/capabilities": "能力库",
    "/discover": "发现",
    "/about": "关于我",
    "/guestbook": "留言板",
    "/desktop": "Mac 客户端",
  };
  return (
    <>
      <Header eyebrow="ANALYTICS / PRIVATE" title="看见作品的真实反馈。">
        从访问趋势到运行异常，找到下一次改进的方向。数据仅自己可见。
      </Header>
      <div className="analytics-controls">
        <ProjectPicker
          projects={projects}
          value={projectId}
          onChange={(id) => {
            setProjectId(id);
            setCopied(false);
          }}
        />
        <label>
          <Icon name="image" size={14} />
          <span className="sr-only">时间</span>
          <select
            aria-label="统计时间范围"
            value={days}
            onChange={(e) => setDays(e.target.value)}
          >
            <option value="7">最近 7 天</option>
            <option value="30">最近 30 天</option>
            <option value="90">最近 90 天</option>
          </select>
        </label>
        <button
          className="pill"
          disabled={busy}
          onClick={() => setVersion((v) => v + 1)}
        >
          刷新数据
          <Icon name="refresh" size={12} />
        </button>
        <span className="private-indicator">
          <Icon name="shield" size={13} />
          仅自己可见
        </span>
      </div>
      {error && (
        <p className="inline-error" role="alert">
          {error}
        </p>
      )}
      {busy && (
        <p className="data-loading" role="status">
          正在读取作品数据…
        </p>
      )}
      {data && (
        <>
          <div className="stats-grid">
            {[
              {
                name: "浏览量 PV",
                value: data.summary.views,
                description: "页面累计访问次数",
                icon: "panels",
              },
              {
                name: "独立访客 UV",
                value: data.summary.visitors,
                description: "按访客去重",
                icon: "user",
              },
              {
                name: "访问会话",
                value: data.summary.sessions,
                description: "连续访问的会话数",
                icon: "compass",
              },
              {
                name: "平均停留",
                value: formatDuration,
                description: "页面前台平均停留",
                icon: "refresh",
              },
              {
                name: "JavaScript 错误",
                value: data.summary.errors,
                description: "查看异常，改善体验",
                icon: "briefcase",
              },
            ].map((stat) => (
              <section className="glass stat-card" key={stat.name}>
                <span>
                  {stat.name}
                  <Icon name={stat.icon} size={13} />
                </span>
                <strong>
                  {typeof stat.value === "number"
                    ? stat.value.toLocaleString()
                    : stat.value}
                </strong>
                <small>{stat.description}</small>
              </section>
            ))}
          </div>
          <section className="glass traffic-chart">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <h2>访问趋势</h2>
                <div className="segment">
                  <button
                    className={chartMetric === "PV" ? "selected" : ""}
                    onClick={() => setChartMetric("PV")}
                  >
                    PV
                  </button>
                  <button
                    className={chartMetric === "UV" ? "selected" : ""}
                    onClick={() => setChartMetric("UV")}
                  >
                    UV
                  </button>
                </div>
              </div>
              <span className="mono muted text-[10px]">
                {chartDays[0].day.slice(5).replace("-", ".")} —{" "}
                {chartDays.at(-1)?.day.slice(5).replace("-", ".")}　总浏览量{" "}
                {totalViews}
              </span>
            </div>
            <div className="chart-plot">
              <div className="chart-y-axis">
                {[
                  chartMax,
                  Math.round((chartMax * 2) / 3),
                  Math.round(chartMax / 3),
                  0,
                ].map((v, i) => (
                  <span key={i}>{v}</span>
                ))}
              </div>
              <div
                className="traffic-bars"
                role="img"
                aria-label={`最近 ${days} 天${chartMetric}趋势`}
              >
                {chartDays.map((day) => (
                  <div
                    key={day.day}
                    className="traffic-day"
                    title={`${day.day}：${day.views} PV / ${day.visitors} UV`}
                  >
                    <span
                      data-bar="true"
                      ref={(element) => {
                        if (element)
                          element.style.height = `${((chartMetric === "PV" ? day.views : day.visitors) / chartMax) * 100}%`;
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>
            <div className="chart-axis">
              {chartDays
                .filter(
                  (_, i) =>
                    i === 0 || i === chartDays.length - 1 || i % 7 === 0,
                )
                .map((d) => (
                  <span key={d.day}>{d.day.slice(5).replace("-", "/")}</span>
                ))}
            </div>
            <p className="chart-note">
              {!totalViews
                ? "接入 SDK 后，真实访问会出现在这里。"
                : chartDays.slice(-2).reduce((sum, d) => sum + d.views, 0) /
                      totalViews >
                    0.8
                  ? "访问集中在最近两天，更多趋势将在持续使用后显现。"
                  : "持续记录真实访问，让趋势逐渐清晰。"}
            </p>
          </section>
          <div className="analytics-bottom">
            <section className="glass pages-panel">
              <div className="section-heading">
                <h2>访问页面</h2>
                <span>按浏览量排序</span>
              </div>
              <table>
                <thead>
                  <tr>
                    <th>页面</th>
                    <th>内容</th>
                    <th>浏览量</th>
                    <th>占比</th>
                  </tr>
                </thead>
                <tbody>
                  {data.pages.slice(0, 3).map((row) => (
                    <tr key={row.path}>
                      <td>{row.path}</td>
                      <td>{pageNames[row.path || ""] || "页面"}</td>
                      <td>{row.count}</td>
                      <td>
                        {totalViews
                          ? ((row.count / totalViews) * 100).toFixed(1)
                          : 0}
                        %
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!data.pages.length && (
                <p className="data-placeholder !py-6">暂无访问页面数据。</p>
              )}
            </section>
            <aside className="glass attention-panel">
              <h2>需要关注</h2>
              <div className="attention-error">
                <Icon name="code" size={18} />
                <div>
                  <strong>JavaScript 错误</strong>
                  <p>
                    最近 {days} 天累计 {data.summary.errors} 次
                  </p>
                </div>
                <button className="pill" onClick={() => setDetailsOpen(true)}>
                  查看明细
                  <Icon name="arrow" size={12} />
                </button>
              </div>
              <div className="mt-6">
                <strong className="text-[13px] font-medium">自定义事件</strong>
                {data.events.length ? (
                  <div className="mt-3 space-y-2">
                    {data.events.slice(0, 3).map((row) => (
                      <div
                        key={row.name}
                        className="flex justify-between text-[11px] muted"
                      >
                        <span>{row.name}</span>
                        <span>{row.count}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="muted text-[11px] leading-[1.9] mt-2">
                    暂无事件数据。
                    <button
                      className="underline underline-offset-4"
                      onClick={() => setSetupOpen(true)}
                    >
                      接入关键行为
                    </button>
                    后，可继续跟踪点击与转化。
                  </p>
                )}
              </div>
            </aside>
          </div>
        </>
      )}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="resource-dialog">
          <DialogHeader>
            <DialogTitle>异常与运行数据</DialogTitle>
            <DialogDescription>
              只记录错误类型与次数，不采集错误内容和堆栈。
            </DialogDescription>
          </DialogHeader>
          {data?.errors?.length ? (
            data.errors.map((row) => (
              <div className="flex justify-between text-sm" key={row.name}>
                <span>{row.name}</span>
                <strong>{row.count}</strong>
              </div>
            ))
          ) : (
            <p className="muted text-sm">暂无异常类型数据。</p>
          )}
          {data?.metrics.map((metric) => (
            <p key={metric.name} className="flex justify-between text-xs">
              <span>{metric.name}</span>
              <span>
                {metric.value}
                {metric.name.endsWith("_ms") ? " ms" : ""}
              </span>
            </p>
          ))}
        </DialogContent>
      </Dialog>
      <Dialog open={setupOpen} onOpenChange={setSetupOpen}>
        <DialogContent className="sdk-dialog">
          <DialogHeader>
            <DialogTitle>接入一个作品</DialogTitle>
            <DialogDescription>
              选择项目后复制对应接入代码，无需在作品中放任何密钥。
            </DialogDescription>
          </DialogHeader>
          <ProjectPicker
            projects={projects}
            value={projectId}
            onChange={setProjectId}
          />
          <pre className="sdk-snippet">
            <code>{snippet}</code>
          </pre>
          <p className="muted text-[11px]">
            {selected
              ? `允许来源：${selected.origins.join("、")}`
              : "先选择一个项目，即可生成接入代码。"}
          </p>
          <button
            className="pill primary self-start"
            disabled={!selected}
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(snippet);
                setCopied(true);
              } catch {
                setError("复制失败，请手动选择代码");
              }
            }}
          >
            {copied ? "已复制" : "复制代码"}
            <Icon name={copied ? "check" : "code"} size={14} />
          </button>
        </DialogContent>
      </Dialog>
    </>
  );
}
