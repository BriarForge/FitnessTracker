import Link from "next/link";
import { redirect } from "next/navigation";

import { getServerSession } from "@/lib/session";

const features = [
  "Append-only logs for reps, weight, duration, and distance",
  "Passkey sign-in with magic-link recovery",
  "Per-user agent tokens for OpenClaw, Hermes, or direct API calls",
  "Simple OpenAPI surface for agent automation",
];

export default async function Home() {
  const session = await getServerSession();

  if (session) {
    redirect("/dashboard");
  }

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col justify-center px-6 py-16">
      <div className="grid items-center gap-12 lg:grid-cols-[1.2fr,0.8fr]">
        <section>
          <div className="inline-flex rounded-full border border-cyan-300/20 bg-cyan-300/10 px-4 py-1 text-xs uppercase tracking-[0.3em] text-cyan-200">
            Multi-user
          </div>
          <h1 className="mt-6 max-w-4xl text-5xl font-semibold tracking-tight text-white md:text-6xl">
            Track whether you are actually improving, not just whether you worked out.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
            Create an exercise like Squats, log `10` today and `15` tomorrow, and
            keep the trend clean enough that both you and your agent can use it.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/sign-in"
              className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-slate-200"
            >
              Start with email sign-in
            </Link>
            <Link
              href="/api/openapi"
              className="rounded-full border border-white/10 px-5 py-3 text-sm font-semibold text-slate-200 transition hover:border-white/30 hover:text-white"
            >
              View agent API
            </Link>
          </div>
        </section>

        <section className="rounded-[2rem] border border-white/10 bg-slate-950/80 p-8 shadow-2xl shadow-cyan-950/10">
          <h2 className="text-xl font-semibold text-white">Built for your actual use case</h2>
          <div className="mt-6 space-y-3">
            {features.map((feature) => (
              <div
                key={feature}
                className="rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 text-sm text-slate-200"
              >
                {feature}
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
