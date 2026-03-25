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
      <section className="mx-auto max-w-4xl px-6 py-16">
        <h1 className="text-3xl font-semibold">Dashboard</h1>
        <p className="mt-4 text-slate-300">
          You are signed in. Next: connect GitHub import and build your profile
          story.
        </p>

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
