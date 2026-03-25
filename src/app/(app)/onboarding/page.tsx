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
      {/* Step 1 — Narrative questionnaire */}
      <section className="mx-auto max-w-2xl px-6 py-16">
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
      <section className="mx-auto max-w-2xl px-6 py-16">
        <h2 className="text-2xl font-semibold">Feature your best work</h2>
        <p className="mt-3 text-slate-400">
          Choose up to six repositories to highlight on your profile. We
          pre-selected a few based on stars and pinned status.
        </p>

        <div className="mt-10">
          <OnboardingFeaturedProjects />
        </div>
      </section>
    </main>
  );
}
