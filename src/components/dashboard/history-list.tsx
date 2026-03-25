"use client";

import { useMemo } from "react";
import {
  canRollback,
  sortGenerationsByDate,
  getGenerationSummary,
  type GenerationEntry,
} from "@/lib/history/versioning";

// ---------------------------------------------------------------------------
// Status badge colours
// ---------------------------------------------------------------------------

const STATUS_STYLES: Record<
  GenerationEntry["status"],
  { bg: string; text: string; label: string }
> = {
  draft: {
    bg: "bg-yellow-400/10",
    text: "text-yellow-400",
    label: "Draft",
  },
  published: {
    bg: "bg-emerald-400/10",
    text: "text-emerald-400",
    label: "Published",
  },
  failed: {
    bg: "bg-red-400/10",
    text: "text-red-400",
    label: "Failed",
  },
};

// ---------------------------------------------------------------------------
// Date formatter
// ---------------------------------------------------------------------------

function formatDate(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface HistoryListProps {
  generations: GenerationEntry[];
  onRollback?: (generationId: string) => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function HistoryList({
  generations,
  onRollback,
}: HistoryListProps) {
  const sorted = useMemo(
    () => sortGenerationsByDate(generations),
    [generations],
  );

  const summary = useMemo(
    () => getGenerationSummary(generations),
    [generations],
  );

  const hasRollbackTarget = useMemo(
    () => canRollback(generations),
    [generations],
  );

  // Empty state
  if (sorted.length === 0) {
    return (
      <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-8 text-center">
        <p className="text-slate-400">No generations yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary bar */}
      <div className="flex flex-wrap items-center gap-4 text-sm text-slate-400">
        <span>
          <span className="font-semibold text-slate-200">{summary.total}</span>{" "}
          total
        </span>
        {summary.published > 0 && (
          <span>
            <span className="font-semibold text-emerald-400">
              {summary.published}
            </span>{" "}
            published
          </span>
        )}
        {summary.draft > 0 && (
          <span>
            <span className="font-semibold text-yellow-400">
              {summary.draft}
            </span>{" "}
            draft
          </span>
        )}
        {summary.failed > 0 && (
          <span>
            <span className="font-semibold text-red-400">
              {summary.failed}
            </span>{" "}
            failed
          </span>
        )}
        {hasRollbackTarget && (
          <span className="ml-auto text-xs text-slate-500">
            Rollback available
          </span>
        )}
      </div>

      {/* Generation entries */}
      <ul className="space-y-2">
        {sorted.map((entry) => {
          const style = STATUS_STYLES[entry.status];
          const isRollbackable = entry.status === "published";

          return (
            <li
              key={entry.id}
              className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-900/50 px-4 py-3 transition hover:border-slate-700"
            >
              <div className="flex flex-col gap-1 overflow-hidden">
                {/* Headline or fallback */}
                <span className="truncate text-sm font-medium text-slate-100">
                  {entry.headline ?? "Untitled generation"}
                </span>

                {/* Date and status */}
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <time dateTime={entry.generatedAt}>
                    {formatDate(entry.generatedAt)}
                  </time>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider ${style.bg} ${style.text}`}
                  >
                    {style.label}
                  </span>
                </div>
              </div>

              {/* Rollback button */}
              {isRollbackable && onRollback && (
                <button
                  type="button"
                  onClick={() => onRollback(entry.id)}
                  className="ml-4 shrink-0 rounded-md border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-300 transition hover:border-slate-500 hover:text-slate-100"
                >
                  Rollback
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
