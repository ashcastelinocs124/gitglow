import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { importGitHubProfile } from "@/lib/github/import-profile";
import { buildProfileModel } from "@/lib/profile/profile-model";
import { composeReadme, profileModelToReadmeInput } from "@/lib/readme/compose-readme";
import { defaultQuestionnaire } from "@/lib/profile/questionnaire";
import { getUserStore } from "@/lib/store";
import { generateAsset } from "@/lib/assets/generate-asset";
import PreviewTabs from "./preview-tabs";
import PublishStatus from "./publish-status";
import ProjectTimeline from "@/components/preview/project-timeline";
import InlineSvg from "@/components/preview/inline-svg";

export default async function PreviewPage() {
  const session = await getServerSession(authOptions);
  if (!session?.accessToken) {
    redirect("/api/auth/signin");
  }

  // Fetch real GitHub data
  let importData = getUserStore(session.user?.email ?? "").importData;

  if (!importData) {
    try {
      importData = await importGitHubProfile(session.accessToken);
    } catch {
      return (
        <main className="min-h-screen bg-slate-950 text-slate-50">
          <section className="mx-auto max-w-4xl px-6 py-16 text-center">
            <h1 className="text-2xl font-semibold">Could not load your GitHub data</h1>
            <p className="mt-4 text-slate-400">Please try again or complete onboarding first.</p>
            <Link href="/review" className="mt-6 inline-block rounded-lg bg-emerald-500 px-6 py-3 text-sm font-semibold text-slate-950">
              Go to onboarding
            </Link>
          </section>
        </main>
      );
    }
  }

  const store = getUserStore(session.user?.email ?? "");
  const narrative = store.questionnaire ?? {
    ...defaultQuestionnaire(),
    bio: importData.profile.bio ?? "Developer",
    goals: "Showcase my work on GitHub",
    archetype: "",
  };
  const featuredIds = store.featuredProjectIds?.length
    ? store.featuredProjectIds
    : importData.repositories
        .sort((a, b) => b.stars - a.stars)
        .slice(0, 6)
        .map((r) => r.githubRepoId);

  const profileModel = buildProfileModel({
    profile: importData.profile,
    repositories: importData.repositories,
    narrative,
    featuredProjectIds: featuredIds,
  });

  // Generate visual asset cards
  const [activityCard, languageCard, timelineCard, growthCard] = await Promise.all([
    generateAsset({
      kind: "activity-card",
      data: {
        login: profileModel.login,
        totalRepos: profileModel.totalRepos,
        totalStars: profileModel.totalStars,
        recentlyActiveRepos: profileModel.recentlyActiveRepos,
      },
    }),
    generateAsset({
      kind: "language-card",
      data: {
        login: profileModel.login,
        languages: profileModel.languages,
      },
    }),
    generateAsset({
      kind: "timeline-card",
      data: {
        login: profileModel.login,
        repositories: importData.repositories
          .filter((r) => r.pushedAt)
          .map((r) => ({
            name: r.name,
            date: r.pushedAt!.toISOString(),
            language: r.primaryLanguage,
            stars: r.stars,
          })),
      },
    }),
    generateAsset({
      kind: "growth-card",
      data: {
        login: profileModel.login,
        repositories: importData.repositories
          .filter((r) => r.pushedAt)
          .map((r) => ({
            name: r.name,
            date: r.pushedAt!.toISOString(),
            language: r.primaryLanguage,
          })),
      },
    }),
  ]);

  // Embed SVGs as base64 data URIs — works on GitHub without hosting
  const readmeInput = profileModelToReadmeInput(profileModel);
  readmeInput.assets = [
    { alt: "Activity overview", url: `data:image/svg+xml;base64,${Buffer.from(activityCard.content).toString("base64")}` },
    { alt: "Language breakdown", url: `data:image/svg+xml;base64,${Buffer.from(languageCard.content).toString("base64")}` },
    { alt: "Project timeline", url: `data:image/svg+xml;base64,${Buffer.from(timelineCard.content).toString("base64")}` },
    { alt: "Project growth", url: `data:image/svg+xml;base64,${Buffer.from(growthCard.content).toString("base64")}` },
  ];

  const markdown = composeReadme(readmeInput);

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      {/* Nav */}
      <nav className="border-b border-slate-800 bg-slate-950/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Link href="/dashboard" className="text-lg font-bold tracking-tight">Gitglow</Link>
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="text-sm text-slate-400 transition hover:text-slate-200">Dashboard</Link>
            <Link href="/review" className="text-sm text-slate-400 transition hover:text-slate-200">Edit profile</Link>
          </div>
        </div>
      </nav>

      <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-semibold">Preview your README</h1>
            <p className="mt-2 text-slate-400">
              Generated from your real GitHub profile — {profileModel.totalRepos} repos, {profileModel.totalStars} stars.
            </p>
            <PublishStatus />
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/review"
              className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-medium text-slate-300 transition hover:border-slate-500 hover:text-slate-100"
            >
              Edit profile
            </Link>
            <button
              className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400"
            >
              Publish to GitHub
            </button>
          </div>
        </div>

        {/* Animated SVG cards (rendered inline so CSS animations work) */}
        <div className="mb-8 space-y-4">
          <InlineSvg svg={activityCard.content} className="w-full max-w-md" />
          <InlineSvg svg={languageCard.content} className="w-full max-w-md" />
          <InlineSvg svg={timelineCard.content} className="w-full" />
          <InlineSvg svg={growthCard.content} className="w-full" />
        </div>

        {/* Tabbed README content */}
        <PreviewTabs markdown={markdown} />

        {/* Interactive project timeline */}
        <ProjectTimeline
          login={profileModel.login}
          repositories={importData.repositories.map((r) => ({
            name: r.name,
            date: r.pushedAt ? r.pushedAt.toISOString() : "",
            language: r.primaryLanguage,
            stars: r.stars,
            url: `https://github.com/${r.ownerLogin}/${r.name}`,
          }))}
        />
      </section>
    </main>
  );
}
