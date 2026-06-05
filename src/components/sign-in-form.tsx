"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { authClient } from "@/lib/auth-client";

type MessageState = {
  tone: "error" | "success" | "neutral";
  text: string;
};

export function SignInForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<MessageState>({
    tone: "neutral",
    text: "Magic link is the recovery path. Passkeys are for your normal return sign-in.",
  });
  const [submitting, setSubmitting] = useState(false);

  const callbackURL = useMemo(() => "/dashboard", []);

  async function handleMagicLink(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);

    const result = await authClient.signIn.magicLink({
      email,
      callbackURL,
      newUserCallbackURL: callbackURL,
    });

    setSubmitting(false);

    if (result.error) {
      setMessage({
        tone: "error",
        text: result.error.message ?? "Unable to send the sign-in link.",
      });
      return;
    }

    setMessage({
      tone: "success",
      text: "Check your inbox for the sign-in link.",
    });
  }

  async function handlePasskeySignIn() {
    setSubmitting(true);
    const result = await authClient.signIn.passkey();
    setSubmitting(false);

    if (result.error) {
      setMessage({
        tone: "error",
        text: result.error.message ?? "Passkey sign-in failed.",
      });
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="w-full rounded-[2rem] border border-white/10 bg-slate-950/80 p-8 shadow-2xl shadow-cyan-950/20">
      <div className="mb-8">
        <div className="text-xs uppercase tracking-[0.25em] text-teal-300">
          Sign in
        </div>
        <h1 className="mt-3 text-3xl font-semibold text-white">
          Use a magic link first, then add a passkey.
        </h1>
        <p className="mt-3 max-w-xl text-sm leading-6 text-slate-300">
          This app is built to be shared across multiple users. Each person gets
          their own account, passkeys, exercise history, and agent tokens.
        </p>
      </div>

      <form className="space-y-4" onSubmit={handleMagicLink}>
        <label className="block text-sm font-medium text-slate-200">
          Email address
          <input
            className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-teal-300"
            type="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
          />
        </label>

        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            type="submit"
            disabled={submitting}
            className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? "Sending..." : "Send magic link"}
          </button>
          <button
            type="button"
            disabled={submitting}
            onClick={handlePasskeySignIn}
            className="rounded-full border border-teal-300/30 px-5 py-3 text-sm font-semibold text-teal-200 transition hover:border-teal-200 hover:bg-teal-300/10 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Use a saved passkey
          </button>
        </div>
      </form>

      <div
        className={`mt-6 rounded-2xl border px-4 py-3 text-sm ${
          message.tone === "error"
            ? "border-rose-400/30 bg-rose-400/10 text-rose-100"
            : message.tone === "success"
              ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-100"
              : "border-white/10 bg-white/5 text-slate-300"
        }`}
      >
        {message.text}
      </div>
    </div>
  );
}
