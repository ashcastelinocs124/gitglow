/**
 * Developer journey section — narrative only (no repo list).
 */

export function renderJourneySection(
  journeySummary?: string,
  _recentlyActiveRepos?: string[],
): string {
  if (!journeySummary) {
    return "";
  }

  const lines: string[] = [];

  lines.push("## My Journey");
  lines.push("");
  lines.push(journeySummary);

  return lines.join("\n");
}
