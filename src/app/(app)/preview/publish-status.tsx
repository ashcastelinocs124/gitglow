"use client";

/**
 * Displays the "last published" status banner on the preview page.
 *
 * In a full integration this would fetch the last PublishEvent from the
 * database. For now it renders a placeholder indicating the status area.
 * The component is a client component so it can update without a full
 * page reload after a publish action completes.
 */

import { useState, useEffect } from "react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface PublishStatusData {
  lastPublishedAt: string | null;
  lastCommitSha: string | null;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function PublishStatus() {
  const [status, setStatus] = useState<PublishStatusData | null>(null);

  useEffect(() => {
    // In a full integration, this would call an API route to fetch the
    // most recent PublishEvent for the current user. For now, render
    // the "never published" state as a placeholder.
    setStatus({
      lastPublishedAt: null,
      lastCommitSha: null,
    });
  }, []);

  if (status === null) {
    return null; // Loading state: render nothing to avoid layout shift
  }

  if (!status.lastPublishedAt) {
    return (
      <div className="mt-3 flex items-center gap-2 text-sm text-slate-500">
        <span className="inline-block h-2 w-2 rounded-full bg-slate-600" />
        Not yet published
      </div>
    );
  }

  return (
    <div className="mt-3 flex items-center gap-2 text-sm text-emerald-400">
      <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
      Last published{" "}
      {new Date(status.lastPublishedAt).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })}
      {status.lastCommitSha && (
        <span className="text-slate-500">
          {" "}
          ({status.lastCommitSha.slice(0, 7)})
        </span>
      )}
    </div>
  );
}
