"use client";

import { useCallback, useMemo } from "react";
import {
  MAX_FEATURED_PROJECTS,
  suggestFeaturedProjects,
  type SelectableRepository,
} from "@/lib/profile/featured-projects";

// ---------------------------------------------------------------------------
// Language colour mapping (small curated palette)
// ---------------------------------------------------------------------------

const LANGUAGE_COLORS: Record<string, string> = {
  TypeScript: "bg-blue-500",
  JavaScript: "bg-yellow-400",
  Python: "bg-emerald-400",
  Rust: "bg-orange-400",
  Go: "bg-cyan-400",
  Java: "bg-red-400",
  Ruby: "bg-red-500",
  C: "bg-slate-400",
  "C++": "bg-pink-400",
  "C#": "bg-purple-400",
  Swift: "bg-orange-500",
  Kotlin: "bg-violet-400",
  Shell: "bg-lime-400",
  HTML: "bg-orange-300",
  CSS: "bg-indigo-400",
};

function languageColor(lang: string | null | undefined): string {
  if (!lang) return "bg-slate-600";
  return LANGUAGE_COLORS[lang] ?? "bg-slate-500";
}

// ---------------------------------------------------------------------------
// Star formatter
// ---------------------------------------------------------------------------

function formatStars(count: number): string {
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1).replace(/\.0$/, "")}k`;
  }
  return String(count);
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface FeaturedProjectPickerProps {
  repositories: SelectableRepository[];
  selected: string[];
  onChange: (ids: string[]) => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function FeaturedProjectPicker({
  repositories,
  selected,
  onChange,
}: FeaturedProjectPickerProps) {
  const suggestedIds = useMemo(() => {
    const suggested = suggestFeaturedProjects(repositories);
    return new Set(suggested.map((r) => r.id));
  }, [repositories]);

  const atLimit = selected.length >= MAX_FEATURED_PROJECTS;

  const toggle = useCallback(
    (id: string) => {
      if (selected.includes(id)) {
        onChange(selected.filter((s) => s !== id));
      } else if (!atLimit) {
        onChange([...selected, id]);
      }
    },
    [selected, onChange, atLimit],
  );

  if (repositories.length === 0) {
    return (
      <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-8 text-center">
        <p className="text-slate-400">
          No repositories found. Import your GitHub profile first.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header / counter */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-400">
          Select up to{" "}
          <span className="font-semibold text-emerald-400">
            {MAX_FEATURED_PROJECTS}
          </span>{" "}
          projects to feature on your profile.
        </p>
        <span
          className={`text-sm font-medium ${
            atLimit ? "text-amber-400" : "text-slate-500"
          }`}
        >
          {selected.length}/{MAX_FEATURED_PROJECTS}
        </span>
      </div>

      {/* Repository grid */}
      <ul className="grid gap-3 sm:grid-cols-2">
        {repositories.map((repo) => {
          const isSelected = selected.includes(repo.id);
          const isDisabled = atLimit && !isSelected;
          const isSuggested = suggestedIds.has(repo.id);

          return (
            <li key={repo.id}>
              <button
                type="button"
                disabled={isDisabled}
                onClick={() => toggle(repo.id)}
                className={`relative w-full rounded-lg border p-4 text-left transition ${
                  isSelected
                    ? "border-emerald-400 bg-emerald-400/10"
                    : "border-slate-700 bg-slate-900 hover:border-slate-500"
                } ${isDisabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}
              >
                {/* Suggested badge */}
                {isSuggested && !isSelected && (
                  <span className="absolute right-3 top-3 rounded-full bg-slate-700 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-slate-300">
                    Suggested
                  </span>
                )}

                {/* Selection indicator */}
                <div className="mb-2 flex items-center gap-2">
                  <span
                    className={`flex h-5 w-5 items-center justify-center rounded border transition ${
                      isSelected
                        ? "border-emerald-400 bg-emerald-400 text-slate-950"
                        : "border-slate-600 bg-slate-800"
                    }`}
                  >
                    {isSelected && (
                      <svg
                        className="h-3 w-3"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={3}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    )}
                  </span>
                  <h3 className="truncate text-sm font-semibold text-slate-50">
                    {repo.name}
                  </h3>
                </div>

                {/* Description */}
                {repo.description && (
                  <p className="mb-3 line-clamp-2 text-xs text-slate-400">
                    {repo.description}
                  </p>
                )}

                {/* Meta row */}
                <div className="flex items-center gap-3 text-xs text-slate-500">
                  {/* Language dot */}
                  {repo.primaryLanguage && (
                    <span className="flex items-center gap-1">
                      <span
                        className={`inline-block h-2.5 w-2.5 rounded-full ${languageColor(repo.primaryLanguage)}`}
                      />
                      {repo.primaryLanguage}
                    </span>
                  )}

                  {/* Stars */}
                  <span className="flex items-center gap-1">
                    <svg
                      className="h-3.5 w-3.5"
                      fill="currentColor"
                      viewBox="0 0 16 16"
                    >
                      <path d="M8 .25a.75.75 0 0 1 .673.418l1.882 3.815 4.21.612a.75.75 0 0 1 .416 1.279l-3.046 2.97.719 4.192a.75.75 0 0 1-1.088.791L8 12.347l-3.766 1.98a.75.75 0 0 1-1.088-.79l.72-4.194L.818 6.374a.75.75 0 0 1 .416-1.28l4.21-.611L7.327.668A.75.75 0 0 1 8 .25z" />
                    </svg>
                    {formatStars(repo.stars)}
                  </span>

                  {/* Pinned badge */}
                  {repo.isPinned && (
                    <span className="rounded bg-slate-700 px-1.5 py-0.5 text-[10px] font-medium text-slate-300">
                      Pinned
                    </span>
                  )}
                </div>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
