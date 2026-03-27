/**
 * Language card SVG template with animated bars.
 */

interface LanguageEntry {
  name: string;
  repoCount: number;
}

const LANGUAGE_COLORS: Record<string, string> = {
  TypeScript: "#3178c6", JavaScript: "#f1e05a", Python: "#3572A5",
  Go: "#00ADD8", Rust: "#dea584", Java: "#b07219", Ruby: "#701516",
  "C++": "#f34b7d", C: "#555555", "C#": "#178600", PHP: "#4F5D95",
  Swift: "#F05138", Kotlin: "#A97BFF", Dart: "#00B4AB", Shell: "#89e051",
  HTML: "#e34c26", CSS: "#563d7c", Vue: "#41b883", Svelte: "#ff3e00",
  "Jupyter Notebook": "#DA5B0B", R: "#198CE7",
};

function esc(str: string): string {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

export function renderLanguageCard(data: Record<string, unknown>): string {
  const login = String(data.login ?? "unknown");
  const rawLanguages = Array.isArray(data.languages) ? (data.languages as LanguageEntry[]) : [];
  const languages = rawLanguages.slice(0, 6);
  const maxCount = languages.length > 0 ? Math.max(...languages.map((l) => l.repoCount)) : 1;

  const barMaxWidth = 180;
  const rowHeight = 34;
  const headerHeight = 80;
  const cardHeight = headerHeight + languages.length * rowHeight + 24;

  // Generate animation keyframes for each bar
  const barAnimations = languages.map((_, i) => {
    const delay = 0.3 + i * 0.12;
    return `.bar-${i} { animation: growBar 0.8s ease-out ${delay}s both; }
    .label-${i} { animation: fadeIn 0.5s ease-out ${delay + 0.2}s both; }`;
  }).join("\n    ");

  const languageBars = languages.map((lang, i) => {
    const color = LANGUAGE_COLORS[lang.name] ?? "#64748b";
    const barWidth = Math.max(8, Math.round((lang.repoCount / maxCount) * barMaxWidth));
    const y = headerHeight + i * rowHeight;

    return `  <g transform="translate(24, ${y})">
    <text class="label-${i}" x="0" y="14" font-family="system-ui,sans-serif" font-size="12" font-weight="600" fill="#e2e8f0">${esc(lang.name)}</text>
    <rect class="bar-${i}" x="120" y="1" width="${barWidth}" height="18" rx="4" fill="${color}" opacity="0.85"/>
    <text class="label-${i}" x="${120 + barWidth + 8}" y="14" font-family="system-ui,sans-serif" font-size="11" fill="#94a3b8">${lang.repoCount} repo${lang.repoCount !== 1 ? "s" : ""}</text>
  </g>`;
  }).join("\n");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="${cardHeight}" viewBox="0 0 400 ${cardHeight}">
  <style>
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes slideUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes growBar { from { width: 0; opacity: 0; } to { opacity: 0.85; } }
    .card-title { animation: slideUp 0.6s ease-out; }
    .card-subtitle { animation: fadeIn 0.8s ease-out; }
    ${barAnimations}
  </style>
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0f172a"/>
      <stop offset="100%" stop-color="#1e293b"/>
    </linearGradient>
  </defs>
  <rect width="400" height="${cardHeight}" rx="12" fill="url(#bg)" stroke="#334155" stroke-width="1"/>
  <text class="card-title" x="24" y="40" font-family="system-ui,sans-serif" font-size="18" font-weight="700" fill="#f8fafc">${esc(login)}</text>
  <text class="card-subtitle" x="24" y="60" font-family="system-ui,sans-serif" font-size="11" fill="#94a3b8">Language Distribution</text>
  <line x1="24" y1="72" x2="376" y2="72" stroke="#334155" stroke-width="1"/>
${languageBars}
</svg>`;
}
