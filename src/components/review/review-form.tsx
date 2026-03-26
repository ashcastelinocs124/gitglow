"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ARCHETYPE_OPTIONS } from "@/lib/profile/questionnaire";
import type { AnalysisResult } from "@/lib/analysis/types";

// ─── Label map (matches questionnaire-form.tsx) ─────────────────────────────

const ARCHETYPE_LABELS: Record<string, string> = {
  backend: "Backend Engineer",
  frontend: "Frontend Engineer",
  fullstack: "Full-Stack Developer",
  data: "Data Engineer / Analyst",
  devops: "DevOps / Platform",
  mobile: "Mobile Developer",
  ml: "ML / AI Engineer",
  indie: "Indie Hacker / OSS",
  systems: "Systems / Low-Level",
};

// ─── Props ──────────────────────────────────────────────────────────────────

interface ReviewFormProps {
  analysis: AnalysisResult;
  repositories: {
    id: string;
    name: string;
    stars: number;
    description: string | null;
    language: string | null;
  }[];
}

// ─── Component ──────────────────────────────────────────────────────────────

export default function ReviewForm({ analysis, repositories }: ReviewFormProps) {
  const router = useRouter();

  // Pre-fill all fields from the analysis
  const [headline, setHeadline] = useState(analysis.headline);
  const [bio, setBio] = useState(analysis.bio);
  const [goals, setGoals] = useState(analysis.goals);
  const [archetype, setArchetype] = useState(analysis.archetype);
  const [experienceOutsideGitHub, setExperienceOutsideGitHub] = useState(
    analysis.experienceOutsideGitHub ?? "",
  );
  const [voiceNotes, setVoiceNotes] = useState(analysis.voiceNotes);

  // Featured projects — pre-checked based on analysis
  const [selectedProjectIds, setSelectedProjectIds] = useState<Set<string>>(
    () => new Set(analysis.featuredProjectIds),
  );

  // Visual options
  const [showTimeline, setShowTimeline] = useState(
    analysis.visualSuggestions.showTimeline,
  );
  const [showLanguageBreakdown, setShowLanguageBreakdown] = useState(
    analysis.visualSuggestions.showLanguageBreakdown,
  );
  const [showActivityCard, setShowActivityCard] = useState(
    analysis.visualSuggestions.showActivityCard,
  );

  // Themes — removable chips + add new
  const [themes, setThemes] = useState<string[]>(
    analysis.visualSuggestions.emphasisThemes,
  );
  const [newTheme, setNewTheme] = useState("");

  // Submission state
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // ── Helpers ──────────────────────────────────────────────────────────────

  function toggleProject(id: string) {
    setSelectedProjectIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function removeTheme(index: number) {
    setThemes((prev) => prev.filter((_, i) => i !== index));
  }

  function addTheme() {
    const trimmed = newTheme.trim();
    if (trimmed && !themes.includes(trimmed)) {
      setThemes((prev) => [...prev, trimmed]);
      setNewTheme("");
    }
  }

  // ── Submit ───────────────────────────────────────────────────────────────

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitError(null);
    setSubmitting(true);

    try {
      // 1) Save questionnaire data
      const questionnairePayload: Record<string, unknown> = {
        bio,
        goals,
        archetype,
      };
      if (experienceOutsideGitHub.trim()) {
        questionnairePayload.experienceOutsideGitHub = experienceOutsideGitHub;
      }
      if (voiceNotes.trim()) {
        questionnairePayload.voiceNotes = voiceNotes;
      }

      const qRes = await fetch("/api/profile/questionnaire", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(questionnairePayload),
      });

      if (!qRes.ok) {
        const body = await qRes.json().catch(() => null);
        throw new Error(
          body?.error ?? `Questionnaire save failed (${qRes.status})`,
        );
      }

      // 2) Save featured project IDs
      const fRes = await fetch("/api/profile/featured", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          featuredProjectIds: Array.from(selectedProjectIds),
        }),
      });

      if (!fRes.ok) {
        const body = await fRes.json().catch(() => null);
        throw new Error(
          body?.error ?? `Featured projects save failed (${fRes.status})`,
        );
      }

      // 3) Redirect to preview
      router.push("/preview");
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : "Something went wrong",
      );
    } finally {
      setSubmitting(false);
    }
  }

  // ── Shared styles (matching questionnaire-form.tsx) ──────────────────────

  const inputBase =
    "w-full rounded-md border border-slate-700 bg-slate-900 px-4 py-2.5 text-slate-50 placeholder-slate-500 outline-none transition focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400";
  const labelBase = "block text-sm font-medium text-slate-300 mb-1.5";

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Headline */}
      <div>
        <label htmlFor="headline" className={labelBase}>
          Headline <AiBadge />
        </label>
        <input
          id="headline"
          type="text"
          className={inputBase}
          value={headline}
          onChange={(e) => setHeadline(e.target.value)}
          placeholder="A catchy one-liner for your profile..."
        />
      </div>

      {/* Bio */}
      <div>
        <label htmlFor="bio" className={labelBase}>
          Bio <AiBadge />
        </label>
        <textarea
          id="bio"
          rows={4}
          className={inputBase}
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          placeholder="A short intro about who you are as a developer..."
        />
      </div>

      {/* Goals */}
      <div>
        <label htmlFor="goals" className={labelBase}>
          Goals <AiBadge />
        </label>
        <textarea
          id="goals"
          rows={3}
          className={inputBase}
          value={goals}
          onChange={(e) => setGoals(e.target.value)}
          placeholder="What do you want your profile to communicate?"
        />
      </div>

      {/* Archetype */}
      <div>
        <label htmlFor="archetype" className={labelBase}>
          Developer archetype <AiBadge />
        </label>
        <select
          id="archetype"
          className={inputBase}
          value={archetype}
          onChange={(e) => setArchetype(e.target.value)}
        >
          <option value="" disabled>
            Select your archetype...
          </option>
          {ARCHETYPE_OPTIONS.map((opt) => (
            <option key={opt} value={opt}>
              {ARCHETYPE_LABELS[opt] ?? opt}
            </option>
          ))}
        </select>
      </div>

      {/* Experience outside GitHub */}
      <div>
        <label htmlFor="experienceOutsideGitHub" className={labelBase}>
          Experience outside GitHub{" "}
          <span className="text-slate-500">(optional)</span>
        </label>
        <textarea
          id="experienceOutsideGitHub"
          rows={3}
          className={inputBase}
          value={experienceOutsideGitHub}
          onChange={(e) => setExperienceOutsideGitHub(e.target.value)}
          placeholder="Work, projects, or skills that don't show up on your GitHub..."
        />
      </div>

      {/* Featured Projects */}
      <fieldset>
        <legend className="text-sm font-medium text-slate-300 mb-3">
          Featured projects <AiBadge />
        </legend>
        <div className="space-y-2 rounded-lg border border-slate-700 bg-slate-900/50 p-4 max-h-80 overflow-y-auto">
          {repositories.map((repo) => {
            const isChecked = selectedProjectIds.has(repo.id);
            const reason = analysis.featuredProjectReasons[repo.id];
            return (
              <label
                key={repo.id}
                className="flex items-start gap-3 rounded-md p-2 transition hover:bg-slate-800/50 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => toggleProject(repo.id)}
                  className="mt-1 h-4 w-4 rounded border-slate-600 bg-slate-800 text-emerald-400 focus:ring-emerald-400 focus:ring-offset-0"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-slate-100 truncate">
                      {repo.name}
                    </span>
                    {repo.language && (
                      <span className="text-xs text-slate-500">
                        {repo.language}
                      </span>
                    )}
                    {repo.stars > 0 && (
                      <span className="text-xs text-slate-500">
                        {repo.stars} stars
                      </span>
                    )}
                  </div>
                  {repo.description && (
                    <p className="text-sm text-slate-400 truncate">
                      {repo.description}
                    </p>
                  )}
                  {isChecked && reason && (
                    <p className="mt-1 text-xs text-emerald-400/80 italic">
                      AI reason: {reason}
                    </p>
                  )}
                </div>
              </label>
            );
          })}
          {repositories.length === 0 && (
            <p className="text-sm text-slate-500 text-center py-4">
              No repositories found.
            </p>
          )}
        </div>
      </fieldset>

      {/* Visual Options */}
      <fieldset>
        <legend className="text-sm font-medium text-slate-300 mb-3">
          Visual options <AiBadge />
        </legend>
        <div className="space-y-3 rounded-lg border border-slate-700 bg-slate-900/50 p-4">
          <ToggleRow
            label="Show Timeline"
            checked={showTimeline}
            onChange={setShowTimeline}
          />
          <ToggleRow
            label="Show Language Card"
            checked={showLanguageBreakdown}
            onChange={setShowLanguageBreakdown}
          />
          <ToggleRow
            label="Show Activity Card"
            checked={showActivityCard}
            onChange={setShowActivityCard}
          />
        </div>
      </fieldset>

      {/* Themes */}
      <div>
        <label className={labelBase}>
          Emphasis themes <AiBadge />
        </label>
        <div className="flex flex-wrap gap-2 mb-3">
          {themes.map((theme, i) => (
            <span
              key={`${theme}-${i}`}
              className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-sm text-emerald-300"
            >
              {theme}
              <button
                type="button"
                onClick={() => removeTheme(i)}
                className="text-emerald-400/60 hover:text-emerald-300 transition"
                aria-label={`Remove theme: ${theme}`}
              >
                x
              </button>
            </span>
          ))}
          {themes.length === 0 && (
            <span className="text-sm text-slate-500">No themes added yet.</span>
          )}
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            className={inputBase}
            value={newTheme}
            onChange={(e) => setNewTheme(e.target.value)}
            placeholder="Add a theme..."
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addTheme();
              }
            }}
          />
          <button
            type="button"
            onClick={addTheme}
            className="shrink-0 rounded-md border border-slate-700 px-4 py-2.5 text-sm font-medium text-slate-300 transition hover:border-emerald-400 hover:text-emerald-400"
          >
            Add
          </button>
        </div>
      </div>

      {/* Voice Notes */}
      <div>
        <label htmlFor="voiceNotes" className={labelBase}>
          Voice &amp; tone notes <AiBadge />
        </label>
        <textarea
          id="voiceNotes"
          rows={3}
          className={inputBase}
          value={voiceNotes}
          onChange={(e) => setVoiceNotes(e.target.value)}
          placeholder='e.g. "Keep it casual" or "Professional and concise"...'
        />
      </div>

      {/* Submit error */}
      {submitError && (
        <div className="rounded-md border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {submitError}
        </div>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-md bg-emerald-400 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {submitting ? "Saving..." : "Generate README"}
      </button>
    </form>
  );
}

// ─── Sub-components ─────────────────────────────────────────────────────────

/** Small emerald pill badge indicating AI-suggested content. */
function AiBadge() {
  return (
    <span className="ml-2 inline-flex items-center rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-emerald-400">
      AI suggested
    </span>
  );
}

/** Toggle switch row for visual options. */
function ToggleRow({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-center justify-between cursor-pointer">
      <span className="text-sm text-slate-200">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition-colors ${
          checked ? "bg-emerald-500" : "bg-slate-700"
        }`}
      >
        <span
          className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow ring-0 transition-transform ${
            checked ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </button>
    </label>
  );
}
