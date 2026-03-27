import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      {/* Nav */}
      <nav className="mx-auto flex max-w-5xl items-center justify-between px-6 py-6">
        <span className="text-lg font-bold tracking-tight">Gitglow</span>
        <Link
          href="/api/auth/signin"
          className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-slate-200 transition hover:bg-slate-700"
        >
          Sign in
        </Link>
      </nav>

      {/* Hero */}
      <section className="mx-auto flex min-h-[80vh] max-w-5xl flex-col justify-center gap-6 px-6 py-24">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-300">
          GitHub profile storytelling
        </p>
        <h1 className="max-w-3xl text-5xl font-semibold tracking-tight sm:text-6xl">
          Gitglow turns your GitHub history into a README worth reading.
        </h1>
        <p className="max-w-2xl text-lg leading-8 text-slate-300">
          Connect GitHub, shape the story you want to tell, and generate a profile README with
          refreshable visuals, featured projects, and a clearer developer narrative.
        </p>
        <div className="mt-4 flex items-center gap-4">
          <Link
            href="/api/auth/signin"
            className="rounded-lg bg-emerald-500 px-6 py-3 text-base font-semibold text-slate-950 transition hover:bg-emerald-400"
          >
            Get started with GitHub
          </Link>
          <Link
            href="/preview"
            className="rounded-lg border border-slate-700 px-6 py-3 text-base font-medium text-slate-300 transition hover:border-slate-500 hover:text-slate-100"
          >
            See a demo
          </Link>
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-5xl px-6 pb-24">
        <h2 className="mb-10 text-center text-2xl font-semibold text-slate-100">How it works</h2>
        <div className="grid gap-8 sm:grid-cols-3">
          <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10 text-lg font-bold text-emerald-400">1</div>
            <h3 className="mb-2 font-semibold text-slate-100">Connect GitHub</h3>
            <p className="text-sm leading-relaxed text-slate-400">Sign in with GitHub and we import your profile, repos, and activity.</p>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10 text-lg font-bold text-emerald-400">2</div>
            <h3 className="mb-2 font-semibold text-slate-100">Tell your story</h3>
            <p className="text-sm leading-relaxed text-slate-400">Answer a few questions to shape a narrative that goes beyond your commit history.</p>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10 text-lg font-bold text-emerald-400">3</div>
            <h3 className="mb-2 font-semibold text-slate-100">Get your README</h3>
            <p className="text-sm leading-relaxed text-slate-400">Preview, export, or auto-publish a polished profile README with visual cards.</p>
          </div>
        </div>
      </section>
    </main>
  );
}
