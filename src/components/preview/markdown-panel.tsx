"use client";

/**
 * Raw markdown display panel with copy-to-clipboard and export-as-file
 * actions. Shows the markdown source in a styled `<pre><code>` block.
 */

import { useCallback, useState } from "react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface MarkdownPanelProps {
  markdown: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function MarkdownPanel({ markdown }: MarkdownPanelProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(markdown);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback: select-all inside the <pre> element (handled by browser)
    }
  }, [markdown]);

  const handleExport = useCallback(() => {
    const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "README.md";
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  }, [markdown]);

  return (
    <div className="flex flex-col rounded-lg bg-slate-900">
      {/* Action bar */}
      <div className="flex items-center justify-end gap-2 border-b border-slate-800 px-4 py-2">
        <button
          type="button"
          onClick={handleCopy}
          className="rounded-md bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-300 transition-colors hover:bg-slate-700 hover:text-slate-100"
        >
          {copied ? "Copied!" : "Copy"}
        </button>
        <button
          type="button"
          onClick={handleExport}
          className="rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-emerald-500"
        >
          Export .md
        </button>
      </div>

      {/* Markdown source */}
      <pre className="overflow-x-auto p-4 md:p-6">
        <code className="block whitespace-pre-wrap font-mono text-sm leading-relaxed text-slate-300">
          {markdown}
        </code>
      </pre>
    </div>
  );
}
