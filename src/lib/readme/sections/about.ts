/**
 * About Me section builder — rich format with bullet points.
 */

export function renderAboutSection(about: string, goals?: string): string {
  const lines: string[] = [];

  lines.push("## About Me");
  lines.push("");
  lines.push(about);
  lines.push("");
  lines.push("- I'm currently building and shipping projects (see below)");
  if (goals) {
    lines.push(`- **Current goal:** ${goals}`);
  }
  lines.push("- I'm always learning and expanding my skills");
  lines.push("- I'm looking to collaborate on open-source projects");

  return lines.join("\n");
}
