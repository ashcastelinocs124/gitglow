/**
 * Developer journey section builder.
 *
 * Renders a "## My Journey" section with a narrative summary and
 * an optional list of recently active repositories.
 * Output is pure GitHub-flavored markdown (no HTML).
 */

/**
 * Render the "My Journey" section.
 *
 * Returns an empty string if neither `journeySummary` nor
 * `recentlyActiveRepos` are provided, so the section is omitted entirely.
 *
 * @param journeySummary - Optional narrative about the developer's journey.
 * @param recentlyActiveRepos - Optional list of recently active repo names.
 * @returns GitHub-flavored markdown string, or empty string if nothing to show.
 */
export function renderJourneySection(
  journeySummary?: string,
  recentlyActiveRepos?: string[],
): string {
  const hasJourney = Boolean(journeySummary);
  const hasActive =
    recentlyActiveRepos !== undefined && recentlyActiveRepos.length > 0;

  if (!hasJourney && !hasActive) {
    return "";
  }

  const lines: string[] = [];

  lines.push("## My Journey");
  lines.push("");

  if (journeySummary) {
    lines.push(journeySummary);
  }

  if (hasActive) {
    if (journeySummary) {
      lines.push("");
    }
    lines.push("**Recently active in:**");
    lines.push("");
    for (const repo of recentlyActiveRepos!) {
      lines.push(`- ${repo}`);
    }
  }

  return lines.join("\n");
}
