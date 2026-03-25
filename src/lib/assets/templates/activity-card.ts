/**
 * Activity card SVG template.
 *
 * Renders a dark-themed 400x200 card showing:
 * - Username
 * - Total repositories
 * - Total stars
 * - Recently active repos count
 */

interface ActivityCardData {
  login: string;
  totalRepos?: number;
  totalStars?: number;
  recentlyActiveRepos?: string[];
}

/** Escape XML special characters to prevent injection. */
function esc(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export function renderActivityCard(data: Record<string, unknown>): string {
  const d: ActivityCardData = {
    login: String(data.login ?? "unknown"),
    totalRepos: typeof data.totalRepos === "number" ? data.totalRepos : 0,
    totalStars: typeof data.totalStars === "number" ? data.totalStars : 0,
    recentlyActiveRepos: Array.isArray(data.recentlyActiveRepos)
      ? (data.recentlyActiveRepos as string[])
      : [],
  };

  const activeCount = d.recentlyActiveRepos?.length ?? 0;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="200" viewBox="0 0 400 200">
  <defs>
    <linearGradient id="bg-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#0f172a"/>
      <stop offset="100%" style="stop-color:#1e293b"/>
    </linearGradient>
  </defs>
  <rect width="400" height="200" rx="12" fill="url(#bg-gradient)" stroke="#334155" stroke-width="1"/>
  <text x="24" y="40" font-family="system-ui, -apple-system, sans-serif" font-size="18" font-weight="700" fill="#f8fafc">${esc(d.login)}</text>
  <text x="24" y="60" font-family="system-ui, -apple-system, sans-serif" font-size="11" fill="#94a3b8">Activity Overview</text>
  <line x1="24" y1="72" x2="376" y2="72" stroke="#334155" stroke-width="1"/>
  <g transform="translate(24, 92)">
    <rect width="160" height="40" rx="8" fill="#1e293b" stroke="#334155" stroke-width="0.5"/>
    <text x="12" y="16" font-family="system-ui, sans-serif" font-size="10" fill="#94a3b8">Repositories</text>
    <text x="12" y="32" font-family="system-ui, sans-serif" font-size="16" font-weight="700" fill="#38bdf8">${d.totalRepos}</text>
  </g>
  <g transform="translate(200, 92)">
    <rect width="160" height="40" rx="8" fill="#1e293b" stroke="#334155" stroke-width="0.5"/>
    <text x="12" y="16" font-family="system-ui, sans-serif" font-size="10" fill="#94a3b8">Stars</text>
    <text x="12" y="32" font-family="system-ui, sans-serif" font-size="16" font-weight="700" fill="#fbbf24">${d.totalStars}</text>
  </g>
  <g transform="translate(24, 148)">
    <rect width="352" height="36" rx="8" fill="#1e293b" stroke="#334155" stroke-width="0.5"/>
    <text x="12" y="14" font-family="system-ui, sans-serif" font-size="10" fill="#94a3b8">Recently Active</text>
    <text x="12" y="28" font-family="system-ui, sans-serif" font-size="13" font-weight="600" fill="#34d399">${activeCount} repo${activeCount !== 1 ? "s" : ""} in last 90 days</text>
  </g>
</svg>`;
}
