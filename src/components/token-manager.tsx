"use client";

import { useEffect, useState } from "react";

type ApiKeyRecord = {
  id: string;
  name: string | null;
  prefix: string | null;
  start: string | null;
  expiresAt: string | null;
  permissions: Record<string, string[]> | null;
};

type ApiKeyCreateResponse = {
  id: string;
  key: string;
};

export function TokenManager() {
  const [items, setItems] = useState<ApiKeyRecord[]>([]);
  const [name, setName] = useState("");
  const [scope, setScope] = useState<"read" | "write">("write");
  const [plainKey, setPlainKey] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const response = await fetch("/api/user/api-keys", {
      cache: "no-store",
    });
    setLoading(false);

    if (!response.ok) {
      setMessage("Unable to load agent tokens.");
      return;
    }

    const data = (await response.json()) as { apiKeys: ApiKeyRecord[] };
    setItems(data.apiKeys);
  }

  useEffect(() => {
    let cancelled = false;

    async function loadInitial() {
      const response = await fetch("/api/user/api-keys", {
        cache: "no-store",
      });

      if (cancelled) {
        return;
      }

      setLoading(false);

      if (!response.ok) {
        setMessage("Unable to load agent tokens.");
        return;
      }

      const data = (await response.json()) as { apiKeys: ApiKeyRecord[] };
      setItems(data.apiKeys);
    }

    void loadInitial();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className="rounded-[2rem] border border-white/10 bg-slate-950/80 p-6">
      <div>
        <h2 className="text-lg font-semibold text-white">Agent tokens</h2>
        <p className="mt-2 max-w-2xl text-sm text-slate-400">
          Each user can create personal tokens so OpenClaw, Hermes, or any other
          agent can act on behalf of that user. Tokens only show once when they
          are created.
        </p>
      </div>

      <div className="mt-6 grid gap-4 rounded-3xl border border-white/10 bg-slate-900 p-4 md:grid-cols-[1.4fr,1fr,auto]">
        <label className="text-sm text-slate-300">
          Token name
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-300"
            placeholder="OpenClaw on laptop"
          />
        </label>
        <label className="text-sm text-slate-300">
          Scope
          <select
            value={scope}
            onChange={(event) => setScope(event.target.value as "read" | "write")}
            className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-cyan-300"
          >
            <option value="write">Read and write</option>
            <option value="read">Read only</option>
          </select>
        </label>
        <div className="flex items-end">
          <button
            type="button"
            className="w-full rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-slate-200 md:w-auto"
            onClick={async () => {
              setMessage("");
              setPlainKey(null);

              const response = await fetch("/api/user/api-keys", {
                method: "POST",
                headers: {
                  "content-type": "application/json",
                },
                body: JSON.stringify({
                  name,
                  scope,
                }),
              });

              if (!response.ok) {
                setMessage("Unable to create token.");
                return;
              }

              const data = (await response.json()) as ApiKeyCreateResponse;
              setPlainKey(data.key);
              setName("");
              setMessage("Token created. Copy it now.");
              await load();
            }}
          >
            Create token
          </button>
        </div>
      </div>

      {plainKey ? (
        <div className="mt-4 rounded-3xl border border-amber-300/30 bg-amber-300/10 p-4">
          <div className="text-sm font-medium text-amber-100">
            Copy this token now. It will not be shown again.
          </div>
          <code className="mt-3 block overflow-x-auto rounded-2xl bg-slate-950/70 px-4 py-3 text-sm text-amber-50">
            {plainKey}
          </code>
        </div>
      ) : null}

      {message ? (
        <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-300">
          {message}
        </div>
      ) : null}

      <div className="mt-6 space-y-3">
        {loading ? (
          <div className="text-sm text-slate-400">Loading tokens...</div>
        ) : items.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/10 p-4 text-sm text-slate-400">
            No tokens created yet.
          </div>
        ) : (
          items.map((item) => (
            <div
              key={item.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-slate-900 px-4 py-3"
            >
              <div>
                <div className="text-sm font-medium text-white">
                  {item.name || "Unnamed token"}
                </div>
                <div className="text-xs text-slate-400">
                  {item.start || item.prefix || "Token"} · expires{" "}
                  {item.expiresAt
                    ? new Date(item.expiresAt).toLocaleDateString()
                    : "never"}
                </div>
              </div>
              <button
                type="button"
                className="rounded-full border border-rose-400/25 px-3 py-1.5 text-xs font-medium text-rose-100 transition hover:border-rose-300 hover:bg-rose-300/10"
                onClick={async () => {
                  const response = await fetch(`/api/user/api-keys/${item.id}`, {
                    method: "DELETE",
                  });

                  if (!response.ok) {
                    setMessage("Unable to delete token.");
                    return;
                  }

                  setMessage("Token deleted.");
                  await load();
                }}
              >
                Revoke
              </button>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
