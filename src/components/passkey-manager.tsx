"use client";

import { useEffect, useState } from "react";

import { authClient } from "@/lib/auth-client";

type PasskeyRecord = {
  id: string;
  name?: string | null;
  createdAt?: string | Date | null;
  deviceType?: string | null;
};

export function PasskeyManager() {
  const [items, setItems] = useState<PasskeyRecord[]>([]);
  const [message, setMessage] = useState<string>("");
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const result = await authClient.passkey.listUserPasskeys();
    setLoading(false);

    if (result.error) {
      setMessage(result.error.message ?? "Unable to load passkeys.");
      return;
    }

    setItems(result.data ?? []);
  }

  useEffect(() => {
    let cancelled = false;

    async function loadInitial() {
      const result = await authClient.passkey.listUserPasskeys();

      if (cancelled) {
        return;
      }

      setLoading(false);

      if (result.error) {
        setMessage(result.error.message ?? "Unable to load passkeys.");
        return;
      }

      setItems(result.data ?? []);
    }

    void loadInitial();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className="rounded-[2rem] border border-white/10 bg-slate-950/80 p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-white">Passkeys</h2>
          <p className="mt-2 max-w-xl text-sm text-slate-400">
            Register a passkey after your first magic-link sign-in. Returning
            sign-in can then stay passwordless and fast.
          </p>
        </div>
        <button
          type="button"
          className="rounded-full border border-emerald-300/25 px-4 py-2 text-sm font-medium text-emerald-100 transition hover:border-emerald-200 hover:bg-emerald-300/10"
          onClick={async () => {
            setMessage("");
            const result = await authClient.passkey.addPasskey({
              name: `Passkey ${items.length + 1}`,
            });

            if (result.error) {
              setMessage(result.error.message ?? "Unable to add a passkey.");
              return;
            }

            setMessage("Passkey added.");
            await load();
          }}
        >
          Add passkey
        </button>
      </div>

      {message ? (
        <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-300">
          {message}
        </div>
      ) : null}

      <div className="mt-6 space-y-3">
        {loading ? (
          <div className="text-sm text-slate-400">Loading passkeys...</div>
        ) : items.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/10 p-4 text-sm text-slate-400">
            No passkeys yet.
          </div>
        ) : (
          items.map((item) => (
            <div
              key={item.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-slate-900 px-4 py-3"
            >
              <div>
                <div className="text-sm font-medium text-white">
                  {item.name || "Unnamed passkey"}
                </div>
                <div className="text-xs text-slate-400">
                  {item.deviceType || "Unknown device"}
                </div>
              </div>
              <button
                type="button"
                className="rounded-full border border-rose-400/25 px-3 py-1.5 text-xs font-medium text-rose-100 transition hover:border-rose-300 hover:bg-rose-300/10"
                onClick={async () => {
                  setMessage("");
                  const result = await authClient.passkey.deletePasskey({
                    id: item.id,
                  });

                  if (result.error) {
                    setMessage(result.error.message ?? "Unable to remove passkey.");
                    return;
                  }

                  setMessage("Passkey removed.");
                  await load();
                }}
              >
                Remove
              </button>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
