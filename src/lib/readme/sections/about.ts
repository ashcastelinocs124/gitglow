/**
 * About Me section builder.
 *
 * Renders a "## About Me" section with the user's summary and optional goals.
 * Output is pure GitHub-flavored markdown (no HTML).
 */

/**
 * Render the "About Me" section.
 *
 * @param about - The user's about/bio summary text.
 * @param goals - Optional goals paragraph.
 * @returns GitHub-flavored markdown string for the section.
 */
export function renderAboutSection(about: string, goals?: string): string {
  const lines: string[] = [];

  lines.push("## About Me");
  lines.push("");
  lines.push(about);

  if (goals) {
    lines.push("");
    lines.push(`**Goals:** ${goals}`);
  }

  return lines.join("\n");
}
