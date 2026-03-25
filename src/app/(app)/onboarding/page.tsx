import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import QuestionnaireForm from "@/components/onboarding/questionnaire-form";

export default async function OnboardingPage() {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect("/api/auth/signin");
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
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
    </main>
  );
}
