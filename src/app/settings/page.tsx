import { updateBodyweightAction, updateTimezoneAction } from "@/app/actions";
import { PasskeyManager } from "@/components/passkey-manager";
import { TokenManager } from "@/components/token-manager";
import { getDashboardData } from "@/lib/fitness";
import { requireUser } from "@/lib/session";

const TIMEZONE_OPTIONS = [
  "Australia/Perth",
  "Australia/Sydney",
  "Australia/Melbourne",
  "Australia/Brisbane",
  "Australia/Adelaide",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "Europe/London",
  "Europe/Paris",
  "Europe/Berlin",
  "Asia/Tokyo",
  "Asia/Shanghai",
  "Asia/Singapore",
  "UTC",
];

export default async function SettingsPage() {
  const session = await requireUser();
  const data = await getDashboardData(session.user.id);
  const currentTimezone = data.timezone ?? "Australia/Perth";

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-6 py-10">
      <section className="rounded-[2rem] border border-white/10 bg-slate-950/80 p-6">
        <h1 className="text-3xl font-semibold text-white">Settings</h1>
        <p className="mt-3 max-w-3xl text-sm text-slate-400">
          Passkeys belong to the signed-in user. Agent tokens are also per-user
          and are the credential agents should use when acting on behalf of that
          person.
        </p>
      </section>

      <section className="grid gap-6 lg:grid-cols-[0.8fr,1.2fr]">
        <section className="rounded-[2rem] border border-white/10 bg-slate-950/80 p-6">
          <h2 className="text-lg font-semibold text-white">Current bodyweight</h2>
          <p className="mt-2 text-sm text-slate-400">
            Stored in kilograms and snapshotted into bodyweight-enabled exercise logs.
          </p>
          <form action={updateBodyweightAction} className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-end">
            <label className="block flex-1 text-sm text-slate-300">
              Bodyweight (kg)
              <input
                required
                type="number"
                min="0"
                step="0.1"
                name="weightKg"
                defaultValue={data.profile?.currentBodyweightKg ?? ""}
                className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none transition focus:border-cyan-300"
              />
            </label>
            <button
              type="submit"
              className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-slate-200"
            >
              Save bodyweight
            </button>
          </form>
        </section>

        <section className="rounded-[2rem] border border-white/10 bg-slate-950/80 p-6">
          <h2 className="text-lg font-semibold text-white">Timezone</h2>
          <p className="mt-2 text-sm text-slate-400">
            Used for grouping exercise logs by day on the dashboard and heatmap.
          </p>
          <form action={updateTimezoneAction} className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-end">
            <label className="block flex-1 text-sm text-slate-300">
              Timezone
              <select
                name="timezone"
                defaultValue={data.profile?.timezone ?? "Australia/Perth"}
                className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none transition focus:border-cyan-300"
              >
                {TIMEZONE_OPTIONS.map((tz) => (
                  <option key={tz} value={tz}>
                    {tz}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="submit"
              className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-slate-200"
            >
              Save timezone
            </button>
          </form>
        </section>

        <PasskeyManager />
      </section>

      <TokenManager />
    </main>
  );
}
