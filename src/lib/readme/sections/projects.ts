/**
 * Featured projects section builder.
 *
 * Renders a "## Featured Projects" section as a GFM table.
 * Output is pure GitHub-flavored markdown (no HTML).
 */

export interface FeaturedProject {
  name: string;
  description: string | null;
  language: string | null;
  stars: number;
  url: string;
}

/**
 * Render the "Featured Projects" section.
 *
 * Returns an empty string if the projects array is empty or undefined,
 * so the section is omitted entirely.
 *
 * @param projects - Array of featured project entries.
 * @returns GitHub-flavored markdown string, or empty string if nothing to show.
 */
export function renderProjectsSection(
  projects?: FeaturedProject[],
): string {
  if (!projects || projects.length === 0) {
    return "";
  }

  const lines: string[] = [];

  lines.push("## Featured Projects");
  lines.push("");
  lines.push("| Project | Description | Language | Stars |");
  lines.push("| ------- | ----------- | -------- | ----- |");

  for (const project of projects) {
    const name = `[${project.name}](${project.url})`;
    const description = project.description ?? "---";
    const language = project.language ?? "---";
    const stars = String(project.stars);

    lines.push(`| ${name} | ${description} | ${language} | ${stars} |`);
  }

  return lines.join("\n");
}
