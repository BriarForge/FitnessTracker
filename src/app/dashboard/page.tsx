import Link from "next/link";

import { addExerciseLogAction, createExerciseAction } from "@/app/actions";
import { ActivityDashboardSection } from "@/components/activity-dashboard-section";
import { formatMetricValue, getMeasurementDescription } from "@/lib/fitness-shared";
import { getDashboardData, getWeeklyActivity } from "@/lib/fitness";
import { requireUser } from "@/lib/session";

export default async function DashboardPage() {
  const session = await requireUser();
  const data = await getDashboardData(session.user.id);
  const activity = await getWeeklyActivity(session.user.id, 12, undefined, data.profile?.timezone);

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-6 py-10">
      <ActivityDashboardSection
        weeks={activity.weeks}
        totalSessions={activity.totalSessions}
        timezone={activity.timezone}
      />
      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-[2rem] border border-white/10 bg-slate-950/80 p-6">
          <div className="text-xs uppercase tracking-[0.25em] text-cyan-300">
            Exercises
          </div>
          <div className="mt-3 text-4xl font-semibold text-white">
            {data.summary.totalExercises}
          </div>
        </div>
        <div className="rounded-[2rem] border border-white/10 bg-slate-950/80 p-6">
          <div className="text-xs uppercase tracking-[0.25em] text-emerald-300">
            Logged entries
          </div>
          <div className="mt-3 text-4xl font-semibold text-white">
            {data.summary.totalLogs}
          </div>
        </div>
        <div className="rounded-[2rem] border border-white/10 bg-slate-950/80 p-6">
          <div className="text-xs uppercase tracking-[0.25em] text-amber-300">
            Current bodyweight
          </div>
          <div className="mt-3 text-4xl font-semibold text-white">
            {data.profile?.currentBodyweightKg
              ? `${data.profile.currentBodyweightKg} kg`
              : "Unset"}
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.1fr,0.9fr]">
        <div className="rounded-[2rem] border border-white/10 bg-slate-950/80 p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold text-white">Exercises</h1>
              <p className="mt-1 text-xs text-slate-500">Timezone: {data.timezone}</p>
              <p className="mt-2 text-sm text-slate-400">
                Create an exercise once, then append quantities over time.
              </p>
            </div>
            <Link
              href="/settings"
              className="rounded-full border border-white/10 px-4 py-2 text-sm text-slate-300 transition hover:border-white/30 hover:text-white"
            >
              Settings
            </Link>
          </div>

          <div className="mt-6 grid gap-4">
            {data.exercises.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-white/10 p-6 text-sm text-slate-400">
                No exercises yet. Start with Squats, Running, Plank, or any movement
                you want to measure consistently.
              </div>
            ) : (
              data.exercises.map((exercise) => (
                <article
                  key={exercise.id}
                  className="rounded-3xl border border-white/10 bg-slate-900 p-5"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <Link
                        href={`/exercises/${exercise.id}`}
                        className="text-lg font-semibold text-white transition hover:text-cyan-200"
                      >
                        {exercise.name}
                      </Link>
                      <p className="mt-1 text-sm text-slate-400">
                        {getMeasurementDescription(exercise.measurementType)}
                      </p>
                    </div>
                    <div className="rounded-2xl bg-white/5 px-3 py-2 text-right text-sm text-slate-300">
                      <div>Best: {formatMetricValue(exercise.bestValue, exercise.unit)}</div>
                      <div>
                        Latest: {formatMetricValue(exercise.latestValue, exercise.unit)}
                      </div>
                    </div>
                  </div>

                  <form action={addExerciseLogAction} className="mt-4 grid gap-3 md:grid-cols-[1.1fr,1fr,1fr,auto]">
                    <input type="hidden" name="exerciseId" value={exercise.id} />
                    <label className="text-sm text-slate-300">
                      Quantity ({exercise.unit})
                      <input
                        required
                        type="number"
                        min="0"
                        step="0.01"
                        name="value"
                        className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-cyan-300"
                      />
                    </label>
                    <label className="text-sm text-slate-300">
                      Performed at
                      <input
                        type="datetime-local"
                        name="performedAt"
                        className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-cyan-300"
                      />
                    </label>
                    <label className="text-sm text-slate-300">
                      Note
                      <input
                        type="text"
                        name="note"
                        className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-cyan-300"
                        placeholder={
                          exercise.trackBodyweight
                            ? "Extra load only; bodyweight is snapshotted"
                            : "Optional"
                        }
                      />
                    </label>
                    <div className="flex items-end">
                      <button
                        type="submit"
                        className="w-full rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-slate-200 md:w-auto"
                      >
                        Add entry
                      </button>
                    </div>
                  </form>
                </article>
              ))
            )}
          </div>
        </div>

        <div className="space-y-6">
          <section className="rounded-[2rem] border border-white/10 bg-slate-950/80 p-6">
            <h2 className="text-xl font-semibold text-white">New exercise</h2>
            <p className="mt-2 text-sm text-slate-400">
              Use `weight` for external load. If the movement also depends on your
              own body mass, enable bodyweight tracking so each log snapshots the
              current number from Settings.
            </p>

            <form action={createExerciseAction} className="mt-6 space-y-4">
              <label className="block text-sm text-slate-300">
                Name
                <input
                  required
                  name="name"
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none transition focus:border-emerald-300"
                  placeholder="Squats"
                />
              </label>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-sm text-slate-300">
                  Metric
                  <select
                    name="measurementType"
                    className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none transition focus:border-emerald-300"
                    defaultValue="reps"
                  >
                    <option value="reps">Reps</option>
                    <option value="weight">Weight</option>
                    <option value="distance">Distance</option>
                    <option value="duration">Duration</option>
                  </select>
                </label>
                <label className="block text-sm text-slate-300">
                  Unit
                  <input
                    required
                    name="unit"
                    defaultValue="reps"
                    className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none transition focus:border-emerald-300"
                    placeholder="kg, km, min, reps"
                  />
                </label>
              </div>

              <label className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-300">
                <input
                  type="checkbox"
                  name="trackBodyweight"
                  className="mt-1 h-4 w-4 rounded border-white/15 bg-slate-900 text-emerald-300"
                />
                <span>
                  Include current bodyweight in each log snapshot. Use this for
                  movements like pull-ups or squats where the logged quantity is
                  the extra load above bodyweight.
                </span>
              </label>

              <label className="block text-sm text-slate-300">
                Notes
                <textarea
                  name="notes"
                  rows={4}
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none transition focus:border-emerald-300"
                  placeholder="Optional setup notes or technique reminders"
                />
              </label>

              <button
                type="submit"
                className="rounded-full bg-linear-to-r from-emerald-300 to-cyan-300 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:from-emerald-200 hover:to-cyan-200"
              >
                Create exercise
              </button>
            </form>
          </section>

          <section className="rounded-[2rem] border border-white/10 bg-slate-950/80 p-6">
            <h2 className="text-xl font-semibold text-white">Agent surface</h2>
            <p className="mt-2 text-sm text-slate-400">
              Tokens are user-specific. Agents can use the OpenAPI document plus a
              bearer token to append data without impersonating another user.
            </p>
            <div className="mt-4 rounded-2xl bg-slate-900 px-4 py-3 text-sm text-slate-300">
              <div>
                OpenAPI: <code>/api/openapi</code>
              </div>
              <div className="mt-2">
                Example: <code>POST /api/v1/logs</code> with <code>Authorization: Bearer &lt;token&gt;</code>
              </div>
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}
