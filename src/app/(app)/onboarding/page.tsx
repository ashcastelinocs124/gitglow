import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import QuestionnaireForm from "@/components/onboarding/questionnaire-form";
import OnboardingFeaturedProjects from "@/components/onboarding/onboarding-featured-projects";

export default async function OnboardingPage() {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect("/api/auth/signin");
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      {/* Nav */}
      <nav className="border-b border-slate-800 bg-slate-950/80 backdrop-blur">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-6 py-4">
          <Link href="/dashboard" className="text-lg font-bold tracking-tight">Gitglow</Link>
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="text-sm text-slate-400 transition hover:text-slate-200">Dashboard</Link>
            <Link href="/preview" className="text-sm text-slate-400 transition hover:text-slate-200">Preview</Link>
          </div>
        </div>
      </nav>

      {/* Progress indicator */}
      <div className="mx-auto max-w-2xl px-6 pt-8">
        <div className="flex items-center gap-3 text-sm">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-xs font-bold text-slate-950">1</span>
          <span className="font-medium text-emerald-400">Your story</span>
          <div className="h-px flex-1 bg-slate-700" />
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-700 text-xs font-bold text-slate-400">2</span>
          <span className="text-slate-500">Featured projects</span>
          <div className="h-px flex-1 bg-slate-700" />
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-700 text-xs font-bold text-slate-400">3</span>
          <span className="text-slate-500">Preview</span>
        </div>
      </div>

      {/* Step 1 — Narrative questionnaire */}
      <section className="mx-auto max-w-2xl px-6 py-12">
        <h1 className="text-3xl font-semibold">Tell your story</h1>
        <p className="mt-3 text-slate-400">
          Answer a few questions so we can build a developer narrative that
          goes beyond your commit history.
        </p>

        <div className="mt-10">
          <QuestionnaireForm />
        </div>
      </section>

      {/* Divider */}
      <div className="mx-auto max-w-2xl px-6">
        <hr className="border-slate-800" />
      </div>

      {/* Step 2 — Featured project selection */}
      <section id="featured-projects" className="mx-auto max-w-2xl px-6 py-12">
        <h2 className="text-2xl font-semibold">Feature your best work</h2>
        <p className="mt-3 text-slate-400">
          Choose up to six repositories to highlight on your profile. We
          pre-selected a few based on stars and pinned status.
        </p>

        <div className="mt-10">
          <OnboardingFeaturedProjects />
        </div>
      </section>

      {/* Bottom CTA */}
      <div className="mx-auto max-w-2xl px-6 pb-16">
        <hr className="mb-8 border-slate-800" />
        <div className="flex items-center justify-between">
          <Link
            href="/dashboard"
            className="text-sm text-slate-400 transition hover:text-slate-200"
          >
            Back to dashboard
          </Link>
          <Link
            href="/preview"
            className="rounded-lg bg-emerald-500 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400"
          >
            Generate &amp; Preview README
          </Link>
        </div>
      </div>
    </main>
  );
}
