import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import type { GenerationEntry } from "@/lib/history/versioning";
import HistoryList from "@/components/dashboard/history-list";

// ---------------------------------------------------------------------------
// Sample data — will be replaced by a real DB query once wired up
// ---------------------------------------------------------------------------

const SAMPLE_GENERATIONS: GenerationEntry[] = [
  {
    id: "gen-1",
    status: "published",
    headline: "Full-stack engineer crafting developer tools",
    markdown: "# Hello\n\nWelcome to my profile.",
    generatedAt: "2026-03-18T10:30:00Z",
    publishedAt: "2026-03-18T11:00:00Z",
  },
  {
    id: "gen-2",
    status: "failed",
    headline: null,
    generatedAt: "2026-03-20T14:15:00Z",
    publishedAt: null,
  },
  {
    id: "gen-3",
    status: "draft",
    headline: "Open-source advocate and systems thinker",
    markdown: "# Hi there\n\nI build things.",
    generatedAt: "2026-03-22T09:00:00Z",
    publishedAt: null,
  },
  {
    id: "gen-4",
    status: "published",
    headline: "Building the future of developer profiles",
    markdown: "# Hey\n\nI love open source.",
    generatedAt: "2026-03-24T16:45:00Z",
    publishedAt: "2026-03-24T17:00:00Z",
  },
];

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect("/api/auth/signin");
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      {/* Nav */}
      <nav className="border-b border-slate-800 bg-slate-950/80 backdrop-blur">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
          <Link href="/" className="text-lg font-bold tracking-tight">Gitglow</Link>
          <div className="flex items-center gap-4">
            <Link href="/review" className="text-sm text-slate-400 transition hover:text-slate-200">Review</Link>
            <Link href="/preview" className="text-sm text-slate-400 transition hover:text-slate-200">Preview</Link>
            <Link href="/api/auth/signout" className="text-sm text-slate-500 transition hover:text-slate-300">Sign out</Link>
          </div>
        </div>
      </nav>

      <section className="mx-auto max-w-4xl px-6 py-16">
        <h1 className="text-3xl font-semibold">Dashboard</h1>
        <p className="mt-4 text-slate-300">
          Welcome back. Build your profile story or manage existing generations.
        </p>

        {/* Quick actions */}
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <Link
            href="/review"
            className="rounded-xl border border-slate-800 bg-slate-900/50 p-5 transition hover:border-emerald-500/30 hover:bg-slate-900"
          >
            <h3 className="font-semibold text-emerald-400">Tell your story</h3>
            <p className="mt-1 text-sm text-slate-400">Complete the questionnaire and pick featured projects.</p>
          </Link>
          <Link
            href="/preview"
            className="rounded-xl border border-slate-800 bg-slate-900/50 p-5 transition hover:border-emerald-500/30 hover:bg-slate-900"
          >
            <h3 className="font-semibold text-emerald-400">Preview README</h3>
            <p className="mt-1 text-sm text-slate-400">See your generated profile README and export it.</p>
          </Link>
          <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-5">
            <h3 className="font-semibold text-slate-300">Refresh visuals</h3>
            <p className="mt-1 text-sm text-slate-400">Update stats and cards without changing your story.</p>
          </div>
        </div>

        {/* Generation History */}
        <div className="mt-12">
          <h2 className="mb-4 text-xl font-semibold text-slate-100">
            Generation History
          </h2>
          <HistoryList generations={SAMPLE_GENERATIONS} />
        </div>
      </section>
    </main>
  );
}
