type ProjectLink = { url: string | null; origins?: readonly string[] };
const channel = (host: string) => host === 'weightbook.icu' || host.endsWith('.weightbook.icu') ? 'weightbook.icu' : host === 'vercel.app' || host.endsWith('.vercel.app') ? 'vercel.app' : null;

// Use configured aliases only; source links and projects without that channel stay canonical.
export function projectUrlForHost(project: ProjectLink, hostname: string): string | null {
  if (!project.url) return null;
  const family = channel(hostname.toLowerCase());
  if (!family) return project.url;
  try {
    const current = new URL(project.url);
    if (current.hostname === 'github.com') return project.url;
    for (const origin of project.origins || []) {
      const candidate = new URL(origin);
      if (candidate.protocol === 'https:' && channel(candidate.hostname) === family) {
        return new URL(current.pathname + current.search + current.hash, candidate.origin).href;
      }
    }
  } catch { /* Incomplete project metadata should not break navigation. */ }
  return project.url;
}
