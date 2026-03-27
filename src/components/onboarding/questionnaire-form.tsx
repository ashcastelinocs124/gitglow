"use client";

import { useState, type FormEvent } from "react";
import {
  ARCHETYPE_OPTIONS,
  defaultQuestionnaire,
  questionnaireSchema,
  type ValidationError,
} from "@/lib/profile/questionnaire";

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

export default function QuestionnaireForm() {
  const [form, setForm] = useState(defaultQuestionnaire);
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  function fieldError(field: string): string | undefined {
    return errors.find((e) => e.field === field)?.message;
  }

  function handleChange(
    field: string,
    value: string,
  ) {
    setForm((prev) => ({ ...prev, [field]: value }));
    // Clear field-level error on change
    setErrors((prev) => prev.filter((e) => e.field !== field));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitError(null);

    // Build payload, omitting empty optional fields
    const payload: Record<string, unknown> = {
      bio: form.bio,
      goals: form.goals,
      archetype: form.archetype,
    };
    if (form.experienceOutsideGitHub.trim()) {
      payload.experienceOutsideGitHub = form.experienceOutsideGitHub;
    }
    if (form.voiceNotes.trim()) {
      payload.voiceNotes = form.voiceNotes;
    }
    if (form.featuredSkills.length > 0) {
      payload.featuredSkills = form.featuredSkills;
    }

    const result = questionnaireSchema.safeParse(payload);

    if (!result.success) {
      setErrors(result.error);
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/profile/questionnaire", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(result.data),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(
          body?.message ?? `Server error (${res.status})`,
        );
      }

      // On success, scroll to featured projects section
      const featured = document.getElementById("featured-projects");
      if (featured) {
        featured.scrollIntoView({ behavior: "smooth" });
      }
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : "Something went wrong",
      );
    } finally {
      setSubmitting(false);
    }
  }

  const inputBase =
    "w-full rounded-md border border-slate-700 bg-slate-900 px-4 py-2.5 text-slate-50 placeholder-slate-500 outline-none transition focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400";
  const labelBase = "block text-sm font-medium text-slate-300 mb-1.5";
  const errorText = "mt-1 text-sm text-red-400";

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Bio */}
      <div>
        <label htmlFor="bio" className={labelBase}>
          Bio <span className="text-red-400">*</span>
        </label>
        <textarea
          id="bio"
          rows={3}
          placeholder="A short intro about who you are as a developer..."
          className={inputBase}
          value={form.bio}
          onChange={(e) => handleChange("bio", e.target.value)}
        />
        {fieldError("bio") && (
          <p className={errorText}>{fieldError("bio")}</p>
        )}
      </div>

      {/* Goals */}
      <div>
        <label htmlFor="goals" className={labelBase}>
          Goals <span className="text-red-400">*</span>
        </label>
        <textarea
          id="goals"
          rows={3}
          placeholder="What do you want your profile to communicate?"
          className={inputBase}
          value={form.goals}
          onChange={(e) => handleChange("goals", e.target.value)}
        />
        {fieldError("goals") && (
          <p className={errorText}>{fieldError("goals")}</p>
        )}
      </div>

      {/* Archetype */}
      <div>
        <label htmlFor="archetype" className={labelBase}>
          Developer archetype <span className="text-red-400">*</span>
        </label>
        <select
          id="archetype"
          className={inputBase}
          value={form.archetype}
          onChange={(e) => handleChange("archetype", e.target.value)}
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
        {fieldError("archetype") && (
          <p className={errorText}>{fieldError("archetype")}</p>
        )}
      </div>

      {/* Experience outside GitHub (optional) */}
      <div>
        <label htmlFor="experienceOutsideGitHub" className={labelBase}>
          Experience outside GitHub{" "}
          <span className="text-slate-500">(optional)</span>
        </label>
        <textarea
          id="experienceOutsideGitHub"
          rows={3}
          placeholder="Work, projects, or skills that don't show up on your GitHub..."
          className={inputBase}
          value={form.experienceOutsideGitHub}
          onChange={(e) =>
            handleChange("experienceOutsideGitHub", e.target.value)
          }
        />
        {fieldError("experienceOutsideGitHub") && (
          <p className={errorText}>
            {fieldError("experienceOutsideGitHub")}
          </p>
        )}
      </div>

      {/* Voice notes (optional) */}
      <div>
        <label htmlFor="voiceNotes" className={labelBase}>
          Voice &amp; tone notes{" "}
          <span className="text-slate-500">(optional)</span>
        </label>
        <textarea
          id="voiceNotes"
          rows={2}
          placeholder="e.g. &quot;Keep it casual&quot; or &quot;Professional and concise&quot;..."
          className={inputBase}
          value={form.voiceNotes}
          onChange={(e) => handleChange("voiceNotes", e.target.value)}
        />
        {fieldError("voiceNotes") && (
          <p className={errorText}>{fieldError("voiceNotes")}</p>
        )}
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
        {submitting ? "Saving..." : "Continue"}
      </button>
    </form>
  );
}
