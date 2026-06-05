import Link from "next/link";

import { getServerSession } from "@/lib/session";
import { SignOutButton } from "./sign-out-button";

export async function AppHeader() {
  const session = await getServerSession();

  return (
    <header className="border-b border-white/10 bg-slate-950/90 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-6 py-4">
        <Link href={session ? "/dashboard" : "/"} className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-linear-to-br from-emerald-400 via-teal-300 to-cyan-400 font-mono text-sm font-bold text-slate-950">
            FT
          </div>
          <div>
            <div className="text-sm font-semibold tracking-wide text-white">
              Fitness Tracker
            </div>
            <div className="text-xs text-slate-400">
              Passkeys, progress, and agent-ready APIs
            </div>
          </div>
        </Link>

        {session ? (
          <div className="flex items-center gap-3">
            <nav className="hidden items-center gap-4 text-sm text-slate-300 md:flex">
              <Link href="/dashboard" className="transition hover:text-white">
                Dashboard
              </Link>
              <Link href="/settings" className="transition hover:text-white">
                Settings
              </Link>
            </nav>
            <SignOutButton />
          </div>
        ) : (
          <Link
            href="/sign-in"
            className="rounded-full bg-white px-4 py-2 text-sm font-medium text-slate-950 transition hover:bg-slate-200"
          >
            Sign in
          </Link>
        )}
      </div>
    </header>
  );
}
