/**
 * Stats section — GitHub stats cards + language breakdown.
 */

export interface LanguageStat {
  name: string;
  repoCount: number;
}

export function renderStatsSection(
  languages?: LanguageStat[],
  totalStars?: number,
  totalForks?: number,
  totalRepos?: number,
  login?: string,
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

  lines.push("## GitHub Statistics");
  lines.push("");

  // GitHub readme stats cards (if login available)
  if (login) {
    lines.push(`![${login}'s GitHub stats](https://github-readme-stats.vercel.app/api?username=${login}&show_icons=true&theme=tokyonight&hide_border=true&bg_color=0d1117&title_color=34d399&icon_color=34d399&text_color=94a3b8)`);
    lines.push("");
    lines.push(`![Top Languages](https://github-readme-stats.vercel.app/api/top-langs/?username=${login}&layout=compact&theme=tokyonight&hide_border=true&bg_color=0d1117&title_color=34d399&text_color=94a3b8)`);
    lines.push("");
    lines.push(`![GitHub Streak](https://github-readme-streak-stats.herokuapp.com/?user=${login}&theme=tokyonight&hide_border=true&background=0d1117&ring=34d399&fire=34d399&currStreakLabel=34d399)`);
    lines.push("");
  }

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
    lines.push("");
    lines.push("### Technologies & Languages");
    lines.push("");
    const langNames = languages!.map((l) => `\`${l.name}\``).join(" · ");
    lines.push(langNames);
  }

  return lines.join("\n");
}
