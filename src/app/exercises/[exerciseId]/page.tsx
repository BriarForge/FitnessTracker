import Link from "next/link";
import { notFound } from "next/navigation";

import { addExerciseLogAction } from "@/app/actions";
import { ProgressChart } from "@/components/progress-chart";
import { formatMetricValue, getExerciseProgress } from "@/lib/fitness";
import { requireUser } from "@/lib/session";

type ExerciseDetailPageProps = {
  params: Promise<{
    exerciseId: string;
  }>;
};

export default async function ExerciseDetailPage({
  params,
}: ExerciseDetailPageProps) {
  const session = await requireUser();
  const { exerciseId } = await params;
  const data = await getExerciseProgress(session.user.id, exerciseId);

  if (!data) {
    notFound();
  }

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-6 py-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <Link href="/dashboard" className="text-sm text-cyan-300 transition hover:text-cyan-200">
            Back to dashboard
          </Link>
          <h1 className="mt-3 text-4xl font-semibold text-white">
            {data.exercise.name}
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-400">
            Best result: {formatMetricValue(data.best, data.exercise.unit)}.{" "}
            {data.exercise.trackBodyweight
              ? "Logs snapshot the current bodyweight and treat the entered value as extra load."
              : "Logs only track the entered quantity."}
          </p>
        </div>
        <div className="rounded-3xl border border-white/10 bg-slate-950/80 px-5 py-4 text-sm text-slate-300">
          <div>Metric: {data.exercise.measurementType}</div>
          <div>Unit: {data.exercise.unit}</div>
          <div>Entries: {data.logs.length}</div>
        </div>
      </div>

      <section className="grid gap-6 lg:grid-cols-[1.15fr,0.85fr]">
        <ProgressChart
          unit={data.exercise.unit}
          logs={data.logs.map((log) => ({
            id: log.id,
            value: log.value,
            performedAt: log.performedAt,
          }))}
        />

        <section className="rounded-[2rem] border border-white/10 bg-slate-950/80 p-6">
          <h2 className="text-xl font-semibold text-white">Add another entry</h2>
          <form action={addExerciseLogAction} className="mt-5 space-y-4">
            <input type="hidden" name="exerciseId" value={data.exercise.id} />
            <label className="block text-sm text-slate-300">
              Quantity ({data.exercise.unit})
              <input
                required
                type="number"
                min="0"
                step="0.01"
                name="value"
                className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none transition focus:border-cyan-300"
              />
            </label>
            <label className="block text-sm text-slate-300">
              Performed at
              <input
                type="datetime-local"
                name="performedAt"
                className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none transition focus:border-cyan-300"
              />
            </label>
            <label className="block text-sm text-slate-300">
              Note
              <textarea
                name="note"
                rows={4}
                className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none transition focus:border-cyan-300"
              />
            </label>
            <button
              type="submit"
              className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-slate-200"
            >
              Save entry
            </button>
          </form>
        </section>
      </section>

      <section className="rounded-[2rem] border border-white/10 bg-slate-950/80 p-6">
        <h2 className="text-xl font-semibold text-white">History</h2>
        <div className="mt-5 overflow-x-auto">
          <table className="min-w-full divide-y divide-white/10 text-sm">
            <thead>
              <tr className="text-left text-slate-400">
                <th className="pb-3 pr-6 font-medium">Date</th>
                <th className="pb-3 pr-6 font-medium">Value</th>
                <th className="pb-3 pr-6 font-medium">Bodyweight</th>
                <th className="pb-3 font-medium">Note</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {data.logs.map((log) => (
                <tr key={log.id} className="text-slate-200">
                  <td className="py-3 pr-6">
                    {new Date(log.performedAt).toLocaleString()}
                  </td>
                  <td className="py-3 pr-6">
                    {formatMetricValue(log.value, data.exercise.unit)}
                  </td>
                  <td className="py-3 pr-6">
                    {log.bodyweightKg ? `${log.bodyweightKg} kg` : "n/a"}
                  </td>
                  <td className="py-3">{log.note || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
