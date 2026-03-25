export default function HomePage() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      <section className="mx-auto flex min-h-screen max-w-5xl flex-col justify-center gap-6 px-6 py-24">
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
      </section>
    </main>
  );
}
