/**
 * Journey card SVG template.
 *
 * Renders a dark-themed 400x200 card showing:
 * - Developer archetype
 * - Headline / tagline
 * - Years active (if available)
 */

/** Escape XML special characters to prevent injection. */
function esc(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/** Map archetypes to accent colors for visual differentiation. */
const ARCHETYPE_COLORS: Record<string, string> = {
  fullstack: "#8b5cf6",
  backend: "#3b82f6",
  frontend: "#f472b6",
  systems: "#ef4444",
  mobile: "#10b981",
  data: "#f59e0b",
  devops: "#06b6d4",
};

const DEFAULT_ARCHETYPE_COLOR = "#8b5cf6";

export function renderJourneyCard(data: Record<string, unknown>): string {
  const login = String(data.login ?? "unknown");
  const archetype = String(data.developerArchetype ?? "developer");
  const headline = String(data.headline ?? `${login}'s Developer Journey`);
  const yearsActive =
    typeof data.yearsActive === "number" ? data.yearsActive : null;

  const accentColor =
    ARCHETYPE_COLORS[archetype.toLowerCase()] ?? DEFAULT_ARCHETYPE_COLOR;

  // Truncate headline if too long for the card width
  const maxHeadlineLen = 48;
  const displayHeadline =
    headline.length > maxHeadlineLen
      ? headline.slice(0, maxHeadlineLen - 1) + "\u2026"
      : headline;

  const yearsSection =
    yearsActive !== null
      ? `  <g transform="translate(24, 140)">
    <rect width="352" height="36" rx="8" fill="#1e293b" stroke="#334155" stroke-width="0.5"/>
    <text x="12" y="14" font-family="system-ui, sans-serif" font-size="10" fill="#94a3b8">Years Active</text>
    <text x="12" y="28" font-family="system-ui, sans-serif" font-size="14" font-weight="700" fill="${accentColor}">${yearsActive} year${yearsActive !== 1 ? "s" : ""} of coding</text>
  </g>`
      : `  <g transform="translate(24, 140)">
    <rect width="352" height="36" rx="8" fill="#1e293b" stroke="#334155" stroke-width="0.5"/>
    <text x="12" y="22" font-family="system-ui, sans-serif" font-size="12" fill="#64748b">Journey in progress...</text>
  </g>`;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="200" viewBox="0 0 400 200">
  <defs>
    <linearGradient id="bg-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#0f172a"/>
      <stop offset="100%" style="stop-color:#1e293b"/>
    </linearGradient>
  </defs>
  <rect width="400" height="200" rx="12" fill="url(#bg-gradient)" stroke="#334155" stroke-width="1"/>
  <text x="24" y="40" font-family="system-ui, -apple-system, sans-serif" font-size="18" font-weight="700" fill="#f8fafc">${esc(login)}</text>
  <text x="24" y="60" font-family="system-ui, -apple-system, sans-serif" font-size="11" fill="#94a3b8">Developer Journey</text>
  <line x1="24" y1="72" x2="376" y2="72" stroke="#334155" stroke-width="1"/>
  <g transform="translate(24, 88)">
    <rect x="0" y="0" width="8" height="32" rx="4" fill="${accentColor}"/>
    <text x="20" y="14" font-family="system-ui, sans-serif" font-size="12" font-weight="600" fill="#e2e8f0">${esc(displayHeadline)}</text>
    <text x="20" y="28" font-family="system-ui, sans-serif" font-size="11" fill="${accentColor}">${esc(archetype)} engineer</text>
  </g>
${yearsSection}
</svg>`;
}
