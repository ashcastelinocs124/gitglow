/**
 * Projects-over-time growth chart SVG.
 * Animated bar chart showing number of repos created/active per year.
 */

interface RepoEntry {
  name: string;
  date: string;
  language: string | null;
}

function escapeXml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

export function renderGrowthCard(data: Record<string, unknown>): string {
  const login = String(data.login ?? "user");
  const repos = (data.repositories as RepoEntry[] | undefined) ?? [];

  // Group repos by year
  const byYear = new Map<number, RepoEntry[]>();
  for (const repo of repos) {
    if (!repo.date) continue;
    const year = new Date(repo.date).getFullYear();
    if (!byYear.has(year)) byYear.set(year, []);
    byYear.get(year)!.push(repo);
  }

  const years = Array.from(byYear.keys()).sort((a, b) => a - b);
  if (years.length === 0) {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="100" viewBox="0 0 800 100">
      <rect width="800" height="100" rx="12" fill="#0f172a"/>
      <text x="400" y="55" text-anchor="middle" fill="#64748b" font-family="system-ui,sans-serif" font-size="14">No project data available</text>
    </svg>`;
  }

  const maxCount = Math.max(...years.map((y) => byYear.get(y)!.length));
  const WIDTH = 800;
  const barAreaWidth = WIDTH - 120;
  const barWidth = Math.min(80, Math.floor(barAreaWidth / years.length) - 12);
  const totalBarsWidth = years.length * (barWidth + 12) - 12;
  const startX = (WIDTH - totalBarsWidth) / 2;
  const HEIGHT = 300;
  const BAR_MAX_H = 160;
  const BAR_BOTTOM = 230;

  // Gradient colors for bars
  const barColors = ["#34d399", "#2dd4bf", "#22d3ee", "#38bdf8", "#818cf8", "#a78bfa"];

  // CSS animations
  const barAnimations = years.map((_, i) => {
    const delay = 0.3 + i * 0.15;
    return `.bar-${i} { animation: growUp 0.8s ease-out ${delay}s both; transform-origin: bottom; }
    .bar-label-${i} { animation: fadeIn 0.4s ease-out ${delay + 0.4}s both; }
    .bar-count-${i} { animation: popIn 0.3s ease-out ${delay + 0.6}s both; }`;
  }).join("\n    ");

  const parts: string[] = [];

  parts.push(`<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">`);

  parts.push(`<style>
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes slideUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes growUp { from { transform: scaleY(0); opacity: 0; } to { transform: scaleY(1); opacity: 1; } }
    @keyframes popIn { from { opacity: 0; transform: scale(0); } to { opacity: 1; transform: scale(1); } }
    .title { animation: slideUp 0.6s ease-out; }
    .subtitle { animation: fadeIn 0.8s ease-out 0.2s both; }
    .axis { animation: fadeIn 0.6s ease-out 0.2s both; }
    ${barAnimations}
  </style>`);

  // Background
  parts.push(`<rect width="${WIDTH}" height="${HEIGHT}" rx="12" fill="#0f172a"/>`);

  // Title
  parts.push(`<text class="title" x="${WIDTH / 2}" y="32" text-anchor="middle" fill="#e2e8f0" font-family="system-ui,sans-serif" font-size="16" font-weight="600">${escapeXml(login)}'s Project Growth</text>`);
  parts.push(`<text class="subtitle" x="${WIDTH / 2}" y="52" text-anchor="middle" fill="#64748b" font-family="system-ui,sans-serif" font-size="11">Projects built over the years</text>`);

  // Horizontal axis
  parts.push(`<line class="axis" x1="${startX - 10}" y1="${BAR_BOTTOM}" x2="${startX + totalBarsWidth + 10}" y2="${BAR_BOTTOM}" stroke="#334155" stroke-width="1"/>`);

  // Grid lines
  for (let i = 1; i <= 4; i++) {
    const y = BAR_BOTTOM - (BAR_MAX_H / 4) * i;
    parts.push(`<line class="axis" x1="${startX - 10}" y1="${y}" x2="${startX + totalBarsWidth + 10}" y2="${y}" stroke="#1e293b" stroke-width="1" stroke-dasharray="4,4"/>`);
  }

  // Bars
  years.forEach((year, i) => {
    const count = byYear.get(year)!.length;
    const barH = maxCount > 0 ? (count / maxCount) * BAR_MAX_H : 0;
    const x = startX + i * (barWidth + 12);
    const y = BAR_BOTTOM - barH;
    const color = barColors[i % barColors.length];

    // Bar with rounded top
    parts.push(`<rect class="bar-${i}" x="${x}" y="${y}" width="${barWidth}" height="${barH}" rx="4" fill="${color}" opacity="0.85" style="transform-origin: ${x + barWidth / 2}px ${BAR_BOTTOM}px"/>`);

    // Count on top of bar
    parts.push(`<text class="bar-count-${i}" x="${x + barWidth / 2}" y="${y - 8}" text-anchor="middle" fill="#e2e8f0" font-family="system-ui,sans-serif" font-size="14" font-weight="700">${count}</text>`);

    // Year label below axis
    parts.push(`<text class="bar-label-${i}" x="${x + barWidth / 2}" y="${BAR_BOTTOM + 20}" text-anchor="middle" fill="#94a3b8" font-family="system-ui,sans-serif" font-size="12" font-weight="500">${year}</text>`);

    // Repo names (small, below year)
    const topRepos = byYear.get(year)!.slice(0, 3);
    topRepos.forEach((repo, j) => {
      const repoName = repo.name.length > 14 ? repo.name.slice(0, 12) + ".." : repo.name;
      parts.push(`<text class="bar-label-${i}" x="${x + barWidth / 2}" y="${BAR_BOTTOM + 35 + j * 12}" text-anchor="middle" fill="#475569" font-family="system-ui,sans-serif" font-size="8">${escapeXml(repoName)}</text>`);
    });
  });

  // Total count
  const total = repos.filter((r) => r.date).length;
  parts.push(`<text class="subtitle" x="${WIDTH / 2}" y="${HEIGHT - 10}" text-anchor="middle" fill="#64748b" font-family="system-ui,sans-serif" font-size="10">${total} projects across ${years.length} years</text>`);

  parts.push("</svg>");
  return parts.join("\n");
}
