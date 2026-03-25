/**
 * Stats/metrics section builder.
 *
 * Renders a "## Stats" section with language breakdown and aggregate numbers.
 * Output is pure GitHub-flavored markdown (no HTML).
 */

export interface LanguageStat {
  name: string;
  repoCount: number;
}

/**
 * Render the "Stats" section.
 *
 * Returns an empty string if no meaningful stats data is provided,
 * so the section is omitted entirely.
 *
 * @param languages - Language breakdown entries.
 * @param totalStars - Aggregate star count.
 * @param totalForks - Aggregate fork count.
 * @param totalRepos - Total number of repositories.
 * @returns GitHub-flavored markdown string, or empty string if nothing to show.
 */
export function renderStatsSection(
  languages?: LanguageStat[],
  totalStars?: number,
  totalForks?: number,
  totalRepos?: number,
): string {
  const hasLanguages = languages !== undefined && languages.length > 0;
  const hasAggregates =
    totalStars !== undefined ||
    totalForks !== undefined ||
    totalRepos !== undefined;

  if (!hasLanguages && !hasAggregates) {
    return "";
  }

  const lines: string[] = [];

  lines.push("## Stats");
  lines.push("");

  if (hasAggregates) {
    const parts: string[] = [];
    if (totalRepos !== undefined) {
      parts.push(`**${totalRepos}** repositories`);
    }
    if (totalStars !== undefined) {
      parts.push(`**${totalStars}** stars`);
    }
    if (totalForks !== undefined) {
      parts.push(`**${totalForks}** forks`);
    }
    lines.push(parts.join(" · "));
  }

  if (hasLanguages) {
    if (hasAggregates) {
      lines.push("");
    }
    lines.push("**Languages:**");
    lines.push("");
    for (const lang of languages!) {
      lines.push(
        `- ${lang.name} — ${lang.repoCount} ${lang.repoCount === 1 ? "repo" : "repos"}`,
      );
    }
  }

  return lines.join("\n");
}
