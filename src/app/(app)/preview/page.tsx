import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { composeReadme } from "@/lib/readme/compose-readme";
import type { ReadmeInput } from "@/lib/readme/compose-readme";
import PreviewTabs from "./preview-tabs";
import PublishStatus from "./publish-status";

// ---------------------------------------------------------------------------
// Sample data — used until the real generation pipeline is wired in
// ---------------------------------------------------------------------------

const sampleInput: ReadmeInput = {
  headline: "Hi, I'm Ash -- a backend engineer",
  about: "I build robust backend systems and APIs. Passionate about distributed systems, developer tooling, and open source.",
  goals: "Contribute more to open source in 2026.",
  journeySummary:
    "Started coding in college, fell in love with distributed systems. After years of building at startups, now focused on developer tools that make every engineer more productive.",
  featuredProjects: [
    {
      name: "api-gateway",
      description: "A high-performance API gateway",
      language: "Go",
      stars: 120,
      url: "https://github.com/ash/api-gateway",
    },
    {
      name: "db-migrator",
      description: "Zero-downtime database migrations",
      language: "TypeScript",
      stars: 85,
      url: "https://github.com/ash/db-migrator",
    },
    {
      name: "log-stream",
      description: "Real-time log aggregation service",
      language: "Rust",
      stars: 42,
      url: "https://github.com/ash/log-stream",
    },
  ],
  languages: [
    { name: "TypeScript", repoCount: 18 },
    { name: "Go", repoCount: 12 },
    { name: "Rust", repoCount: 5 },
    { name: "Python", repoCount: 4 },
  ],
  totalStars: 520,
  totalForks: 78,
  totalRepos: 42,
  recentlyActiveRepos: ["api-gateway", "db-migrator", "gitglow"],
  assets: [
    {
      alt: "Activity overview",
      url: "https://placehold.co/800x200/1e293b/94a3b8?text=Activity+Card",
    },
  ],
};

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function PreviewPage() {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect("/api/auth/signin");
  }

  const markdown = composeReadme(sampleInput);

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-semibold">Preview your README</h1>
          <p className="mt-2 text-slate-400">
            See how your generated profile README will look on GitHub.
          </p>
          <PublishStatus />
        </div>

        {/* Tabbed content (client component) */}
        <PreviewTabs markdown={markdown} />
      </section>
    </main>
  );
}
