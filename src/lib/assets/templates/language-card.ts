/**
 * Language card SVG template.
 *
 * Renders a dark-themed 400x250 card showing:
 * - Top 5 languages with colored horizontal bars
 * - Language name and repo count for each
 */

interface LanguageEntry {
  name: string;
  repoCount: number;
}

/** Well-known language colors matching GitHub's language color scheme. */
const LANGUAGE_COLORS: Record<string, string> = {
  TypeScript: "#3178c6",
  JavaScript: "#f1e05a",
  Python: "#3572A5",
  Go: "#00ADD8",
  Rust: "#dea584",
  Java: "#b07219",
  Ruby: "#701516",
  "C++": "#f34b7d",
  C: "#555555",
  "C#": "#178600",
  PHP: "#4F5D95",
  Swift: "#F05138",
  Kotlin: "#A97BFF",
  Dart: "#00B4AB",
  Shell: "#89e051",
  HTML: "#e34c26",
  CSS: "#563d7c",
  Vue: "#41b883",
  Svelte: "#ff3e00",
  Scala: "#c22d40",
  Elixir: "#6e4a7e",
  Haskell: "#5e5086",
  Lua: "#000080",
  R: "#198CE7",
  Zig: "#ec915c",
};

const DEFAULT_COLOR = "#64748b";

/** Escape XML special characters to prevent injection. */
function esc(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export function renderLanguageCard(data: Record<string, unknown>): string {
  const login = String(data.login ?? "unknown");
  const rawLanguages = Array.isArray(data.languages)
    ? (data.languages as LanguageEntry[])
    : [];

  // Take only the top 5
  const languages = rawLanguages.slice(0, 5);

  const maxCount = languages.length > 0
    ? Math.max(...languages.map((l) => l.repoCount))
    : 1;

  const barMaxWidth = 200;
  const rowHeight = 32;
  const headerHeight = 80;
  const cardHeight = headerHeight + languages.length * rowHeight + 24;

  const languageBars = languages
    .map((lang, i) => {
      const color = LANGUAGE_COLORS[lang.name] ?? DEFAULT_COLOR;
      const barWidth = Math.max(
        8,
        Math.round((lang.repoCount / maxCount) * barMaxWidth),
      );
      const y = headerHeight + i * rowHeight;

      return `  <g transform="translate(24, ${y})">
    <text x="0" y="14" font-family="system-ui, sans-serif" font-size="12" font-weight="600" fill="#e2e8f0">${esc(lang.name)}</text>
    <rect x="130" y="2" width="${barWidth}" height="16" rx="4" fill="${color}" opacity="0.85"/>
    <text x="${130 + barWidth + 8}" y="14" font-family="system-ui, sans-serif" font-size="11" fill="#94a3b8">${lang.repoCount}</text>
  </g>`;
    })
    .join("\n");

  const emptyMessage =
    languages.length === 0
      ? `  <text x="200" y="${headerHeight + 30}" font-family="system-ui, sans-serif" font-size="12" fill="#64748b" text-anchor="middle">No language data available</text>`
      : "";

  return `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="${cardHeight}" viewBox="0 0 400 ${cardHeight}">
  <defs>
    <linearGradient id="bg-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#0f172a"/>
      <stop offset="100%" style="stop-color:#1e293b"/>
    </linearGradient>
  </defs>
  <rect width="400" height="${cardHeight}" rx="12" fill="url(#bg-gradient)" stroke="#334155" stroke-width="1"/>
  <text x="24" y="40" font-family="system-ui, -apple-system, sans-serif" font-size="18" font-weight="700" fill="#f8fafc">${esc(login)}</text>
  <text x="24" y="60" font-family="system-ui, -apple-system, sans-serif" font-size="11" fill="#94a3b8">Language Distribution</text>
  <line x1="24" y1="72" x2="376" y2="72" stroke="#334155" stroke-width="1"/>
${languageBars}${emptyMessage}
</svg>`;
}
