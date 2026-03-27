/**
 * Project timeline SVG generator.
 * Produces a static timeline showing repos plotted over time.
 */

interface TimelineRepo {
  name: string;
  date: string;
  language: string | null;
  stars: number;
}

const LANG_COLORS: Record<string, string> = {
  TypeScript: "#3178c6",
  JavaScript: "#f1e05a",
  Python: "#3572A5",
  Rust: "#dea584",
  Go: "#00ADD8",
  Java: "#b07219",
  Ruby: "#701516",
  "C++": "#f34b7d",
  C: "#555555",
  "C#": "#178600",
  Swift: "#F05138",
  Kotlin: "#A97BFF",
  Shell: "#89e051",
  HTML: "#e34c26",
  CSS: "#563d7c",
  "Jupyter Notebook": "#DA5B0B",
  Dart: "#00B4AB",
};

function getLangColor(lang: string | null): string {
  if (!lang) return "#64748b";
  return LANG_COLORS[lang] ?? "#64748b";
}

function escapeXml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function formatMonth(dateStr: string): string {
  const d = new Date(dateStr);
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${months[d.getMonth()]} ${d.getFullYear()}`;
}

export function renderTimelineCard(data: Record<string, unknown>): string {
  const login = String(data.login ?? "user");
  const repos = (data.repositories as TimelineRepo[] | undefined) ?? [];

  const sorted = repos
    .filter((r) => r.date)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  if (sorted.length === 0) {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="100" viewBox="0 0 800 100">
      <rect width="800" height="100" rx="12" fill="#0f172a"/>
      <text x="400" y="55" text-anchor="middle" fill="#64748b" font-family="system-ui,sans-serif" font-size="14">No timeline data available</text>
    </svg>`;
  }

  const WIDTH = 800;
  const HEIGHT = 350;
  const PAD_X = 50;
  const PAD_TOP = 50;
  const PAD_BOTTOM = 50;
  const TIMELINE_Y = HEIGHT / 2;

  const times = sorted.map((r) => new Date(r.date).getTime());
  const minTime = Math.min(...times);
  const maxTime = Math.max(...times);
  const padding = (maxTime - minTime) * 0.05 || 86400000 * 30;
  const tMin = minTime - padding;
  const tMax = maxTime + padding;

  function timeToX(t: number): number {
    const range = tMax - tMin;
    if (range === 0) return WIDTH / 2;
    return PAD_X + ((t - tMin) / range) * (WIDTH - 2 * PAD_X);
  }

  // Year markers
  const startYear = new Date(minTime).getFullYear();
  const endYear = new Date(maxTime).getFullYear();
  const yearMarkers: { year: number; x: number }[] = [];
  for (let y = startYear; y <= endYear + 1; y++) {
    const t = new Date(y, 0, 1).getTime();
    if (t >= tMin && t <= tMax) {
      yearMarkers.push({ year: y, x: timeToX(t) });
    }
  }

  // Position repos with vertical spread
  interface Positioned { repo: TimelineRepo; x: number; y: number }
  const positioned: Positioned[] = [];
  const occupied: { x: number; y: number }[] = [];

  for (const repo of sorted) {
    const x = timeToX(new Date(repo.date).getTime());
    let y = TIMELINE_Y;
    let offset = 30;
    let above = true;
    let attempts = 0;

    while (attempts < 20) {
      const testY = above ? TIMELINE_Y - offset : TIMELINE_Y + offset;
      const tooClose = occupied.some(
        (o) => Math.abs(o.x - x) < 65 && Math.abs(o.y - testY) < 26,
      );
      if (!tooClose && testY > PAD_TOP && testY < HEIGHT - PAD_BOTTOM) {
        y = testY;
        break;
      }
      if (above) { above = false; } else { above = true; offset += 22; }
      attempts++;
    }

    occupied.push({ x, y });
    positioned.push({ repo, x, y });
  }

  // Build SVG
  const parts: string[] = [];

  // Generate per-dot animation classes
  const dotAnimations = positioned.map((_, i) => {
    const delay = 0.5 + i * 0.06;
    return `.dot-${i} { animation: popIn 0.4s ease-out ${delay}s both; }
    .lbl-${i} { animation: fadeIn 0.3s ease-out ${delay + 0.15}s both; }
    .conn-${i} { animation: drawLine 0.3s ease-out ${delay - 0.1}s both; }`;
  }).join("\n    ");

  parts.push(`<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">`);

  // CSS animations
  parts.push(`<style>
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes slideUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes popIn { from { opacity: 0; r: 0; } to { opacity: 1; } }
    @keyframes drawLine { from { opacity: 0; stroke-dashoffset: 100; } to { opacity: 0.4; stroke-dashoffset: 0; } }
    @keyframes axisGrow { from { stroke-dashoffset: 800; } to { stroke-dashoffset: 0; } }
    .title { animation: slideUp 0.6s ease-out; }
    .axis { stroke-dasharray: 800; animation: axisGrow 1.2s ease-out 0.2s both; }
    .year-text { animation: fadeIn 0.8s ease-out 0.4s both; }
    ${dotAnimations}
  </style>`);

  // Background
  parts.push(`<rect width="${WIDTH}" height="${HEIGHT}" rx="12" fill="#0f172a"/>`);

  // Title
  parts.push(`<text class="title" x="${WIDTH / 2}" y="30" text-anchor="middle" fill="#e2e8f0" font-family="system-ui,sans-serif" font-size="16" font-weight="600">${escapeXml(login)}'s Project Timeline</text>`);

  // Year markers
  for (const m of yearMarkers) {
    parts.push(`<line x1="${m.x}" y1="${PAD_TOP}" x2="${m.x}" y2="${HEIGHT - PAD_BOTTOM}" stroke="#1e293b" stroke-width="1" stroke-dasharray="4,4"/>`);
    parts.push(`<text class="year-text" x="${m.x}" y="${HEIGHT - 15}" text-anchor="middle" fill="#334155" font-family="system-ui,sans-serif" font-size="28" font-weight="700">${m.year}</text>`);
  }

  // Timeline axis
  parts.push(`<line class="axis" x1="${PAD_X}" y1="${TIMELINE_Y}" x2="${WIDTH - PAD_X}" y2="${TIMELINE_Y}" stroke="#334155" stroke-width="2"/>`);

  // Connector lines
  positioned.forEach(({ x, y }, i) => {
    parts.push(`<line class="conn-${i}" x1="${x}" y1="${y}" x2="${x}" y2="${TIMELINE_Y}" stroke="#334155" stroke-width="1" opacity="0.4" stroke-dasharray="100"/>`);
  });

  // Dots on timeline axis
  positioned.forEach(({ repo, x }, i) => {
    parts.push(`<circle class="dot-${i}" cx="${x}" cy="${TIMELINE_Y}" r="3" fill="${getLangColor(repo.language)}" opacity="0.6"/>`);
  });

  // Repo dots + labels
  positioned.forEach(({ repo, x, y }, i) => {
    const color = getLangColor(repo.language);
    const name = repo.name.length > 16 ? repo.name.slice(0, 14) + "..." : repo.name;
    const labelY = y < TIMELINE_Y ? y - 10 : y + 16;
    const dateY = y < TIMELINE_Y ? y + 2 : y + 27;

    // Dot
    parts.push(`<circle class="dot-${i}" cx="${x}" cy="${y}" r="5" fill="${color}" stroke="#0f172a" stroke-width="1.5"/>`);

    // Name
    parts.push(`<text class="lbl-${i}" x="${x}" y="${labelY}" text-anchor="middle" fill="#cbd5e1" font-family="system-ui,sans-serif" font-size="9" font-weight="500">${escapeXml(name)}</text>`);

    // Date
    parts.push(`<text class="lbl-${i}" x="${x}" y="${dateY}" text-anchor="middle" fill="#475569" font-family="system-ui,sans-serif" font-size="7">${formatMonth(repo.date)}</text>`);
  });

  parts.push("</svg>");

  return parts.join("\n");
}
