import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { importGitHubProfile } from "@/lib/github/import-profile";
import { getUserStore, setImportData, setAnalysisResult } from "@/lib/store";
import type { AnalysisResult } from "@/lib/analysis/types";
import ReviewForm from "@/components/review/review-form";

export default async function ReviewPage() {
  const session = await getServerSession(authOptions);
  if (!session?.accessToken) {
    redirect("/api/auth/signin");
  }

  const email = session.user?.email ?? "";
  const store = getUserStore(email);

  // ── Ensure we have import data ──────────────────────────────────────────

  let importData = store.importData;

  if (!importData) {
    try {
      importData = await importGitHubProfile(session.accessToken);
      setImportData(email, importData);
    } catch {
      return (
        <main className="min-h-screen bg-slate-950 text-slate-50">
          <section className="mx-auto max-w-3xl px-6 py-16 text-center">
            <h1 className="text-2xl font-semibold">
              Could not load your GitHub data
            </h1>
            <p className="mt-4 text-slate-400">
              Please try again or complete onboarding first.
            </p>
            <Link
              href="/onboarding"
              className="mt-6 inline-block rounded-lg bg-emerald-500 px-6 py-3 text-sm font-semibold text-slate-950"
            >
              Go to onboarding
            </Link>
          </section>
        </main>
      );
    }
  }

  // ── Ensure we have an analysis result ───────────────────────────────────

  let analysis: AnalysisResult | undefined = store.analysisResult;

  if (!analysis) {
    try {
      // Dynamic import — the module may not exist yet (handled by catch)
      const modulePath = "@/lib/analysis/analyze-profile";
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const mod = await (import(/* webpackIgnore: true */ modulePath) as Promise<{ analyzeProfile: (data: unknown) => Promise<AnalysisResult> }>);
      analysis = await mod.analyzeProfile(importData);
      setAnalysisResult(email, analysis);
    } catch {
      // Fallback: build a basic analysis from the raw data
      analysis = {
        headline: `Hi, I'm ${importData.profile.name ?? importData.profile.login}`,
        bio: importData.profile.bio ?? "Developer",
        goals: "Showcase my work",
        archetype: "",
        experienceOutsideGitHub: null,
        featuredProjectIds: importData.repositories
          .sort((a, b) => b.stars - a.stars)
          .slice(0, 6)
          .map((r) => r.githubRepoId),
        featuredProjectReasons: {},
        visualSuggestions: {
          showTimeline: true,
          showLanguageBreakdown: true,
          showActivityCard: true,
          emphasisThemes: [],
        },
        voiceNotes: "",
      };
      setAnalysisResult(email, analysis);
    }
  }

  // ── Map repositories for the form ───────────────────────────────────────

  const repositories = importData.repositories.map((r) => ({
    id: r.githubRepoId,
    name: r.name,
    stars: r.stars,
    description: r.description,
    language: r.primaryLanguage,
  }));

  // ── Render ──────────────────────────────────────────────────────────────

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      {/* Nav */}
      <nav className="border-b border-slate-800 bg-slate-950/80 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4">
          <Link
            href="/dashboard"
            className="text-lg font-bold tracking-tight"
          >
            Gitglow
          </Link>
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard"
              className="text-sm text-slate-400 transition hover:text-slate-200"
            >
              Dashboard
            </Link>
            <Link
              href="/preview"
              className="text-sm text-slate-400 transition hover:text-slate-200"
            >
              Preview
            </Link>
          </div>
        </div>
      </nav>

      <section className="mx-auto max-w-3xl px-6 py-12">
        <h1 className="text-3xl font-semibold">Review your profile</h1>
        <p className="mt-3 text-slate-400">
          AI analyzed your GitHub activity. Edit anything below, then generate
          your README.
        </p>

        <div className="mt-10">
          <ReviewForm analysis={analysis} repositories={repositories} />
        </div>
      </section>
    </main>
  );
}
