import { redirect } from "next/navigation";

import { SignInForm } from "@/components/sign-in-form";
import { getServerSession } from "@/lib/session";

export default async function SignInPage() {
  const session = await getServerSession();

  if (session) {
    redirect("/dashboard");
  }

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 items-center px-6 py-16">
      <div className="grid w-full gap-8 lg:grid-cols-[1.1fr,0.9fr]">
        <div className="flex flex-col justify-center">
          <div className="inline-flex w-fit rounded-full border border-teal-300/20 bg-teal-300/10 px-4 py-1 text-xs uppercase tracking-[0.3em] text-teal-200">
            Production-first
          </div>
          <h1 className="mt-6 text-5xl font-semibold tracking-tight text-white">
            A simple tracker that keeps your data clean enough for humans and agents.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
            Track reps, weight, distance, and duration over time. Each user has
            passkeys for sign-in and personal API tokens for OpenClaw, Hermes,
            or any agent that needs to act on their behalf.
          </p>
        </div>
        <SignInForm />
      </div>
    </main>
  );
}
