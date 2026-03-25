import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

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
          You are signed in. Next: connect GitHub import and build your profile story.
        </p>
      </section>
    </main>
  );
}
