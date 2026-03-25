"use client";

/**
 * Client-side tab switcher for the preview page.
 * Toggles between the rendered README preview and the raw markdown panel.
 */

import { useState } from "react";
import ReadmeRender from "@/components/preview/readme-render";
import MarkdownPanel from "@/components/preview/markdown-panel";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface PreviewTabsProps {
  markdown: string;
}

type Tab = "preview" | "markdown";

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function PreviewTabs({ markdown }: PreviewTabsProps) {
  const [activeTab, setActiveTab] = useState<Tab>("preview");

  return (
    <div>
      {/* Tab bar */}
      <div className="mb-6 flex gap-1 rounded-lg bg-slate-900 p-1">
        <TabButton
          label="Preview"
          active={activeTab === "preview"}
          onClick={() => setActiveTab("preview")}
        />
        <TabButton
          label="Markdown"
          active={activeTab === "markdown"}
          onClick={() => setActiveTab("markdown")}
        />
      </div>

      {/* Panel */}
      {activeTab === "preview" ? (
        <ReadmeRender markdown={markdown} />
      ) : (
        <MarkdownPanel markdown={markdown} />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tab button
// ---------------------------------------------------------------------------

function TabButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
        active
          ? "bg-slate-800 text-emerald-400"
          : "text-slate-400 hover:text-slate-200"
      }`}
    >
      {label}
    </button>
  );
}
