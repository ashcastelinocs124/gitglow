/**
 * Activity card SVG template with CSS animations.
 */

function esc(str: string): string {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

export function renderActivityCard(data: Record<string, unknown>): string {
  const login = String(data.login ?? "unknown");
  const totalRepos = typeof data.totalRepos === "number" ? data.totalRepos : 0;
  const totalStars = typeof data.totalStars === "number" ? data.totalStars : 0;
  const activeRepos = Array.isArray(data.recentlyActiveRepos) ? data.recentlyActiveRepos.length : 0;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="200" viewBox="0 0 400 200">
  <style>
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes slideUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes countUp { from { opacity: 0; transform: scale(0.5); } to { opacity: 1; transform: scale(1); } }
    @keyframes widthGrow { from { width: 0; } }
    .card-title { animation: slideUp 0.6s ease-out; }
    .card-subtitle { animation: fadeIn 0.8s ease-out; }
    .stat-box-1 { animation: slideUp 0.5s ease-out 0.2s both; }
    .stat-box-2 { animation: slideUp 0.5s ease-out 0.35s both; }
    .stat-box-3 { animation: slideUp 0.5s ease-out 0.5s both; }
    .stat-num { animation: countUp 0.4s ease-out 0.6s both; }
    .divider { animation: widthGrow 0.8s ease-out 0.1s both; }
  </style>
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0f172a"/>
      <stop offset="100%" stop-color="#1e293b"/>
    </linearGradient>
  </defs>
  <rect width="400" height="200" rx="12" fill="url(#bg)" stroke="#334155" stroke-width="1"/>
  <text class="card-title" x="24" y="40" font-family="system-ui,sans-serif" font-size="18" font-weight="700" fill="#f8fafc">${esc(login)}</text>
  <text class="card-subtitle" x="24" y="60" font-family="system-ui,sans-serif" font-size="11" fill="#94a3b8">Activity Overview</text>
  <line class="divider" x1="24" y1="72" x2="376" y2="72" stroke="#334155" stroke-width="1"/>
  <g class="stat-box-1" transform="translate(24, 88)">
    <rect width="108" height="44" rx="8" fill="#1e293b" stroke="#334155" stroke-width="0.5"/>
    <text x="12" y="16" font-family="system-ui,sans-serif" font-size="10" fill="#94a3b8">Repositories</text>
    <text class="stat-num" x="12" y="36" font-family="system-ui,sans-serif" font-size="18" font-weight="700" fill="#38bdf8">${totalRepos}</text>
  </g>
  <g class="stat-box-2" transform="translate(146, 88)">
    <rect width="108" height="44" rx="8" fill="#1e293b" stroke="#334155" stroke-width="0.5"/>
    <text x="12" y="16" font-family="system-ui,sans-serif" font-size="10" fill="#94a3b8">Stars Earned</text>
    <text class="stat-num" x="12" y="36" font-family="system-ui,sans-serif" font-size="18" font-weight="700" fill="#fbbf24">${totalStars}</text>
  </g>
  <g class="stat-box-3" transform="translate(268, 88)">
    <rect width="108" height="44" rx="8" fill="#1e293b" stroke="#334155" stroke-width="0.5"/>
    <text x="12" y="16" font-family="system-ui,sans-serif" font-size="10" fill="#94a3b8">Active (90d)</text>
    <text class="stat-num" x="12" y="36" font-family="system-ui,sans-serif" font-size="18" font-weight="700" fill="#34d399">${activeRepos}</text>
  </g>
  <g class="stat-box-3" transform="translate(24, 148)">
    <rect width="352" height="36" rx="8" fill="#1e293b" stroke="#334155" stroke-width="0.5"/>
    <text x="12" y="14" font-family="system-ui,sans-serif" font-size="10" fill="#94a3b8">Recent Activity</text>
    <text x="12" y="28" font-family="system-ui,sans-serif" font-size="13" font-weight="600" fill="#34d399">${activeRepos} repo${activeRepos !== 1 ? "s" : ""} updated in the last 90 days</text>
  </g>
</svg>`;
}
