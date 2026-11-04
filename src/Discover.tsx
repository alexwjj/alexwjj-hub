import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { api, useAuth } from "./account";
import {
  FilterPills,
  Icon,
  OutLink,
  PageHeading,
  SearchField,
  SectionHeading,
} from "./components/hub-ui";
type Site = {
  id: string;
  name: string;
  url: string;
  category: string;
  description: string;
  pinned: boolean;
};
const categories = ["评测与动态", "AI 资讯", "趣味实验", "开发资源"];
const recommendations = [
  {
    name: "Hugging Face Spaces",
    url: "https://huggingface.co/spaces",
    category: "趣味实验",
    description: "逛逛社区创作的 AI 应用，发现可以直接上手的实验。",
    icon: "blocks",
  },
  {
    name: "OpenAI News",
    url: "https://openai.com/news",
    category: "评测与动态",
    description: "查看官方发布、产品更新与研究进展，回到消息源头。",
    icon: "file",
  },
  {
    name: "v0",
    url: "https://v0.app",
    category: "开发资源",
    description: "看看 AI 如何生成界面与应用，也给自己的想法找点灵感。",
    icon: "panels",
  },
];
const empty = {
  name: "",
  url: "",
  category: "开发资源",
  description: "",
  pinned: true,
};
export function Discover({
  onCountChange,
}: {
  onCountChange?: (count: number) => void;
}) {
  const { user } = useAuth();
  const owner = !!user?.isOwner;
  const [sites, setSites] = useState<Site[]>([]),
    [category, setCategory] = useState("全部"),
    [query, setQuery] = useState(""),
    [error, setError] = useState(""),
    [fetching, setFetching] = useState(true);
  const [open, setOpen] = useState(false),
    [editing, setEditing] = useState<string | null>(null),
    [form, setForm] = useState(empty),
    [busy, setBusy] = useState(false),
    [reading, setReading] = useState(false),
    [menu, setMenu] = useState<string | null>(null),
    [formError, setFormError] = useState("");
  useEffect(() => {
    const controller = new AbortController();
    api<{ sites: Site[] }>("/api/discover", { signal: controller.signal })
      .then((r) => setSites(r.sites))
      .catch((e) => {
        if (!controller.signal.aborted) setError(e.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setFetching(false);
      });
    return () => controller.abort();
  }, []);
  useEffect(() => {
    if (!fetching && !error) onCountChange?.(sites.length);
  }, [sites, fetching, error, onCountChange]);
  const shown = sites.filter(
    (s) =>
      (category === "全部" || s.category === category) &&
      `${s.name} ${s.description} ${s.url}`
        .toLowerCase()
        .includes(query.trim().toLowerCase()),
  );
  function edit(site?: Site | typeof empty) {
    setEditing(site && "id" in site ? site.id : null);
    setForm(
      site
        ? {
            name: site.name,
            url: site.url,
            category: site.category,
            description: site.description,
            pinned: site.pinned,
          }
        : { ...empty },
    );
    setFormError("");
    setOpen(true);
    setMenu(null);
  }
  async function save() {
    setBusy(true);
    setFormError("");
    try {
      const result = await api<{ site: Site }>("/api/discover", {
        method: editing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, ...(editing ? { id: editing } : {}) }),
      });
      setSites((old) =>
        (editing
          ? old.map((s) => (s.id === editing ? result.site : s))
          : [...old, result.site]
        ).sort((a, b) => Number(b.pinned) - Number(a.pinned)),
      );
      setOpen(false);
    } catch (e) {
      setFormError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function changeSite(site: Site, remove = false) {
    setMenu(null);
    try {
      await api("/api/discover", {
        method: remove ? "DELETE" : "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          remove ? { id: site.id } : { ...site, pinned: !site.pinned },
        ),
      });
      setSites((old) =>
        remove
          ? old.filter((s) => s.id !== site.id)
          : old
              .map((s) => (s.id === site.id ? { ...s, pinned: !s.pinned } : s))
              .sort((a, b) => Number(b.pinned) - Number(a.pinned)),
      );
    } catch (e) {
      setError((e as Error).message);
    }
  }
  return (
    <>
      <PageHeading
        eyebrow="DISCOVER / CURATED LINKS"
        title="给好奇心，留个入口。"
        description="模型评测、AI 动态和有意思的小网站，收进一个持续更新的收藏夹。"
      />
      <div className="page-controls">
        <FilterPills
          items={["全部", ...categories]}
          value={category}
          onChange={setCategory}
        />
        <div className="flex items-center gap-[14px] control-actions">
          <SearchField
            value={query}
            onChange={setQuery}
            placeholder="搜索网站或用途"
          />
          <button
            className="pill primary"
            disabled={!owner}
            title={owner ? "添加网站" : "仅站长可以编辑发现收藏"}
            onClick={() => edit()}
          >
            添加网站
            <Icon name="plus" size={16} />
          </button>
        </div>
      </div>
      <SectionHeading
        title="常逛的地方"
        eyebrow={`${String(shown.length).padStart(2, "0")} 个网站`}
      >
        <span className="muted text-xs flex gap-3 items-center">
          <Icon name="pin" size={14} />
          常用优先
        </span>
      </SectionHeading>
      {error && (
        <p className="inline-error" role="alert">
          {error}
        </p>
      )}
      {fetching ? (
        <p className="data-placeholder">正在读取收藏…</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 discover-grid">
          {shown.map((site, i) => (
            <article className="glass discover-card" key={site.id}>
              <div className="flex items-center gap-2.5 text-[11px] muted">
                <span className="soft-icon">
                  <Icon
                    name={site.category === "AI 资讯" ? "rss" : "radar"}
                    size={21}
                  />
                </span>
                {site.category}
                {site.pinned && (
                  <Icon name="pin" size={16} className="ml-auto" />
                )}
              </div>
              <div className="flex items-center justify-between mt-[22px]">
                <h2>{site.name}</h2>
                <span className="mono text-[11px] muted">
                  {String(i + 1).padStart(2, "0")}
                </span>
              </div>
              <p className="mt-[25px]">{site.description}</p>
              <span className="mono text-[11px] muted mt-[22px]">
                {site.url.replace(/^https?:\/\//, "").replace(/\/$/, "")}
              </span>
              <div className="flex justify-between items-center mt-auto pt-7">
                <div className="flex items-center gap-3 relative">
                  <button
                    className="text-link"
                    disabled={!owner}
                    onClick={() => edit(site)}
                  >
                    <Icon name="pencil" size={14} />
                    编辑
                  </button>
                  <button
                    className="icon-button"
                    aria-label={`${site.name} 更多操作`}
                    disabled={!owner}
                    onClick={() => setMenu(menu === site.id ? null : site.id)}
                  >
                    <Icon name="more" size={17} />
                  </button>
                  {menu === site.id && (
                    <div className="site-menu glass">
                      <button onClick={() => void changeSite(site)}>
                        {site.pinned ? "取消固定" : "固定到常逛"}
                      </button>
                      <button onClick={() => void changeSite(site, true)}>
                        移除网站
                      </button>
                    </div>
                  )}
                </div>
                <OutLink className="pill" href={site.url}>
                  打开网站
                  <Icon name="arrow" size={15} />
                </OutLink>
              </div>
            </article>
          ))}
        </div>
      )}
      {!fetching && !shown.length && (
        <div className="glass p-10 text-center muted">没有找到匹配的网站。</div>
      )}
      <div className="mt-[44px]">
        <SectionHeading title="再多一点新鲜感">
          <p className="muted text-xs mr-auto ml-3">
            挑一个感兴趣的，加入自己的收藏。
          </p>
        </SectionHeading>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {recommendations
            .filter((s) => category === "全部" || s.category === category)
            .filter((s) =>
              `${s.name} ${s.description}`
                .toLowerCase()
                .includes(query.toLowerCase()),
            )
            .map((site) => (
              <article key={site.url} className="glass recommendation-card">
                <div className="flex justify-between muted">
                  <Icon name={site.icon} size={26} />
                  <span className="text-[10px]">{site.category}</span>
                </div>
                <h3 className="text-lg mt-[22px]">{site.name}</h3>
                <p className="muted text-xs leading-[1.8] mt-4">
                  {site.description}
                </p>
                <span className="mono muted text-[9px] mt-[25px]">
                  {site.url.replace(/^https?:\/\//, "")}
                </span>
                <div className="flex justify-between mt-auto pt-7">
                  <button
                    className="text-link"
                    disabled={
                      !owner ||
                      sites.some(
                        (s) =>
                          s.url.replace(/\/$/, "") ===
                          site.url.replace(/\/$/, ""),
                      )
                    }
                    onClick={() => edit({ ...site, pinned: true })}
                  >
                    {sites.some(
                      (s) =>
                        s.url.replace(/\/$/, "") ===
                        site.url.replace(/\/$/, ""),
                    )
                      ? "已收藏"
                      : "加入收藏"}
                    <Icon name="plus" size={15} />
                  </button>
                  <OutLink href={site.url} label={`打开 ${site.name}`}>
                    <Icon name="arrow" size={15} />
                  </OutLink>
                </div>
              </article>
            ))}
        </div>
      </div>
      <p className="muted text-[11px] mt-6">
        随时添加、编辑或固定网站，让这里慢慢变成你的日常入口。
      </p>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="add-site-dialog">
          <DialogHeader>
            <DialogTitle>
              {editing ? "编辑这个值得常逛的网站" : "添加一个值得常逛的网站"}
            </DialogTitle>
            <DialogDescription>
              先收下链接，再慢慢整理你的发现。
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void save();
            }}
            className="flex flex-col flex-1 mt-5 gap-5"
          >
            <label className="form-label">
              网站链接
              <div className="flex input-shell">
                <input
                  type="url"
                  required
                  placeholder="https://example.com"
                  value={form.url}
                  onChange={(e) => setForm({ ...form, url: e.target.value })}
                />
                <button
                  type="button"
                  className="pill !h-7 !text-[10px] !px-2.5"
                  disabled={reading || !form.url}
                  onClick={async () => {
                    setReading(true);
                    setFormError("");
                    try {
                      const r = await api<{
                        title: string;
                        description: string;
                      }>("/api/discover/metadata", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ url: form.url }),
                      });
                      setForm((f) => ({
                        ...f,
                        name: r.title,
                        description: r.description,
                      }));
                    } catch (e) {
                      setFormError((e as Error).message);
                    } finally {
                      setReading(false);
                    }
                  }}
                >
                  {reading ? "读取中…" : "读取信息"}
                  <Icon name="refresh" size={11} />
                </button>
              </div>
            </label>
            <div className="grid grid-cols-[1fr_172px] gap-4 max-sm:grid-cols-1">
              <label className="form-label">
                网站名称
                <input
                  className="input-shell"
                  required
                  maxLength={100}
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </label>
              <label className="form-label">
                分类
                <select
                  className="input-shell"
                  value={form.category}
                  onChange={(e) =>
                    setForm({ ...form, category: e.target.value })
                  }
                >
                  {categories.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </label>
            </div>
            <label className="form-label">
              一句话说明
              <textarea
                className="input-shell h-[92px] resize-none"
                maxLength={500}
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
              />
            </label>
            <label className="flex justify-between items-center py-2">
              <span>
                <strong className="text-[13px] font-normal">固定到常逛</strong>
                <small className="block muted text-[11px] mt-2">
                  让它优先出现在收藏列表。
                </small>
              </span>
              <input
                type="checkbox"
                className="toggle-switch"
                checked={form.pinned}
                onChange={(e) => setForm({ ...form, pinned: e.target.checked })}
              />
            </label>
            <p className="muted text-[11px]">
              标题、分类和链接都可以在收藏后继续修改。
            </p>
            {formError && (
              <p className="inline-error" role="alert">
                {formError}
              </p>
            )}
            <div className="flex justify-end gap-3 mt-auto pt-7">
              <button
                type="button"
                className="pill"
                onClick={() => setOpen(false)}
              >
                取消
              </button>
              <button className="pill primary" disabled={busy}>
                {busy ? "保存中…" : editing ? "保存修改" : "添加到收藏"}
                <Icon name="plus" size={14} />
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
