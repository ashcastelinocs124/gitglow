/**
 * Featured projects section — table with descriptions and status.
 */

export interface FeaturedProject {
  name: string;
  description: string | null;
  language: string | null;
  stars: number;
  url: string;
}

export function renderProjectsSection(
  projects?: FeaturedProject[],
): string {
  if (!projects || projects.length === 0) {
    return "";
  }

  const lines: string[] = [];

  lines.push("## Projects I'm working on");
  lines.push("");
  lines.push("| Project | What it is | Tech | Stars |");
  lines.push("| :------ | :--------- | :--- | :---: |");

  for (const project of projects) {
    const name = `[**${project.name}**](${project.url})`;
    const description = project.description ?? "---";
    const language = project.language ? `\`${project.language}\`` : "---";
    const stars = project.stars > 0 ? `${project.stars}` : "---";

    lines.push(`| ${name} | ${description} | ${language} | ${stars} |`);
  }

  return lines.join("\n");
}
