"use client";

import { useMemo, useState } from "react";

interface RepoDataPoint {
  name: string;
  date: string; // ISO date
  language: string | null;
  stars: number;
  url: string;
}

interface ProjectTimelineProps {
  repositories: RepoDataPoint[];
  login: string;
}

const LANG_COLORS: Record<string, string> = {
  TypeScript: "#3178c6",
  JavaScript: "#f1e05a",
  Python: "#3572A5",
  Rust: "#dea584",
  Go: "#00ADD8",
  Java: "#b07219",
  Ruby: "#701516",
  "C++": "#f34b7d",
  C: "#555555",
  "C#": "#178600",
  Swift: "#F05138",
  Kotlin: "#A97BFF",
  Shell: "#89e051",
  HTML: "#e34c26",
  CSS: "#563d7c",
  "Jupyter Notebook": "#DA5B0B",
  Dart: "#00B4AB",
  Vue: "#41b883",
  Svelte: "#ff3e00",
};

function getLangColor(lang: string | null): string {
  if (!lang) return "#64748b";
  return LANG_COLORS[lang] ?? "#64748b";
}

function formatMonth(date: Date): string {
  return date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

export default function ProjectTimeline({ repositories, login }: ProjectTimelineProps) {
  const [hoveredRepo, setHoveredRepo] = useState<string | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  const sorted = useMemo(() => {
    return [...repositories]
      .filter((r) => r.date)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [repositories]);

  const { minTime, maxTime, yearMarkers } = useMemo(() => {
    if (sorted.length === 0) return { minTime: 0, maxTime: 1, yearMarkers: [] };
    const times = sorted.map((r) => new Date(r.date).getTime());
    const min = Math.min(...times);
    const max = Math.max(...times);
    const padding = (max - min) * 0.05 || 86400000 * 30;

    const markers: { year: number; time: number }[] = [];
    const startYear = new Date(min).getFullYear();
    const endYear = new Date(max).getFullYear();
    for (let y = startYear; y <= endYear + 1; y++) {
      const t = new Date(y, 0, 1).getTime();
      if (t >= min - padding && t <= max + padding) {
        markers.push({ year: y, time: t });
      }
    }

    return { minTime: min - padding, maxTime: max + padding, yearMarkers: markers };
  }, [sorted]);

  if (sorted.length === 0) return null;

  const WIDTH = 900;
  const HEIGHT = 400;
  const PADDING_X = 40;
  const PADDING_TOP = 30;
  const PADDING_BOTTOM = 60;
  const TIMELINE_Y = HEIGHT / 2;

  function timeToX(time: number): number {
    const range = maxTime - minTime;
    if (range === 0) return WIDTH / 2;
    return PADDING_X + ((time - minTime) / range) * (WIDTH - 2 * PADDING_X);
  }

  // Distribute repos vertically to avoid overlap
  const positioned = useMemo(() => {
    const points: { repo: RepoDataPoint; x: number; y: number }[] = [];
    const occupied: { x: number; y: number }[] = [];

    for (const repo of sorted) {
      const x = timeToX(new Date(repo.date).getTime());
      let y = TIMELINE_Y;
      let offset = 30;
      let above = true;
      let attempts = 0;

      while (attempts < 20) {
        const testY = above ? TIMELINE_Y - offset : TIMELINE_Y + offset;
        const tooClose = occupied.some(
          (o) => Math.abs(o.x - x) < 70 && Math.abs(o.y - testY) < 28,
        );
        if (!tooClose && testY > PADDING_TOP && testY < HEIGHT - PADDING_BOTTOM) {
          y = testY;
          break;
        }
        if (above) {
          above = false;
        } else {
          above = true;
          offset += 25;
        }
        attempts++;
      }

      occupied.push({ x, y });
      points.push({ repo, x, y });
    }
    return points;
  }, [sorted, minTime, maxTime]);

  const hoveredData = hoveredRepo
    ? positioned.find((p) => p.repo.name === hoveredRepo)
    : null;

  return (
    <div className="mt-8 rounded-xl border border-slate-800 bg-slate-900/80 p-6">
      <h3 className="mb-4 text-lg font-semibold text-slate-100">
        Project Timeline
      </h3>
      <div className="overflow-x-auto">
        <svg
          width={WIDTH}
          height={HEIGHT}
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          className="w-full"
          style={{ minWidth: 600 }}
        >
          {/* Background */}
          <rect width={WIDTH} height={HEIGHT} fill="transparent" />

          {/* Year markers */}
          {yearMarkers.map((m) => {
            const x = timeToX(m.time);
            return (
              <g key={m.year}>
                <line
                  x1={x} y1={PADDING_TOP} x2={x} y2={HEIGHT - PADDING_BOTTOM}
                  stroke="#1e293b" strokeWidth={1} strokeDasharray="4,4"
                />
                <text
                  x={x} y={HEIGHT - 20}
                  textAnchor="middle" fill="#475569" fontSize={32} fontWeight={700}
                  opacity={0.3}
                >
                  {m.year}
                </text>
              </g>
            );
          })}

          {/* Timeline axis */}
          <line
            x1={PADDING_X} y1={TIMELINE_Y}
            x2={WIDTH - PADDING_X} y2={TIMELINE_Y}
            stroke="#334155" strokeWidth={2}
          />

          {/* Connector lines from dots to timeline */}
          {positioned.map(({ repo, x, y }) => (
            <line
              key={`line-${repo.name}`}
              x1={x} y1={y} x2={x} y2={TIMELINE_Y}
              stroke={hoveredRepo === repo.name ? "#34d399" : "#334155"}
              strokeWidth={hoveredRepo === repo.name ? 2 : 1}
              opacity={hoveredRepo === repo.name ? 1 : 0.5}
              style={{ transition: "all 0.2s ease" }}
            />
          ))}

          {/* Repo dots */}
          {positioned.map(({ repo, x, y }) => {
            const isHovered = hoveredRepo === repo.name;
            return (
              <g key={repo.name}>
                {/* Glow effect on hover */}
                {isHovered && (
                  <circle cx={x} cy={y} r={12} fill={getLangColor(repo.language)} opacity={0.2}>
                    <animate attributeName="r" values="10;14;10" dur="1.5s" repeatCount="indefinite" />
                  </circle>
                )}
                <circle
                  cx={x} cy={y}
                  r={isHovered ? 7 : 5}
                  fill={getLangColor(repo.language)}
                  stroke={isHovered ? "#fff" : "#0f172a"}
                  strokeWidth={isHovered ? 2 : 1.5}
                  style={{ cursor: "pointer", transition: "all 0.2s ease" }}
                  onMouseEnter={(e) => {
                    setHoveredRepo(repo.name);
                    const rect = (e.target as SVGElement).closest("svg")!.getBoundingClientRect();
                    setTooltipPos({
                      x: e.clientX - rect.left,
                      y: e.clientY - rect.top,
                    });
                  }}
                  onMouseLeave={() => setHoveredRepo(null)}
                  onClick={() => window.open(repo.url, "_blank")}
                />
                {/* Label */}
                <text
                  x={x}
                  y={y < TIMELINE_Y ? y - 12 : y + 18}
                  textAnchor="middle"
                  fill={isHovered ? "#e2e8f0" : "#94a3b8"}
                  fontSize={isHovered ? 12 : 10}
                  fontWeight={isHovered ? 600 : 400}
                  style={{ cursor: "pointer", transition: "all 0.2s ease" }}
                  onMouseEnter={() => setHoveredRepo(repo.name)}
                  onMouseLeave={() => setHoveredRepo(null)}
                  onClick={() => window.open(repo.url, "_blank")}
                >
                  {repo.name.length > 18 ? repo.name.slice(0, 16) + "..." : repo.name}
                </text>
                {/* Date label */}
                <text
                  x={x}
                  y={y < TIMELINE_Y ? y - 1 : y + 30}
                  textAnchor="middle"
                  fill="#475569"
                  fontSize={8}
                >
                  {formatMonth(new Date(repo.date))}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Tooltip */}
        {hoveredData && (
          <div
            className="pointer-events-none absolute z-10 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 shadow-xl"
            style={{
              left: tooltipPos.x + 10,
              top: tooltipPos.y - 60,
            }}
          >
            <p className="text-sm font-semibold text-slate-100">{hoveredData.repo.name}</p>
            <p className="text-xs text-slate-400">
              {hoveredData.repo.language ?? "Unknown"} · {hoveredData.repo.stars} stars
            </p>
            <p className="text-xs text-slate-500">
              {formatMonth(new Date(hoveredData.repo.date))}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
