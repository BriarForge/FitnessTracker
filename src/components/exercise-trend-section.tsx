"use client";

import { useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { ProgressChart } from "@/components/progress-chart";
import type { DashboardTrendPoint } from "@/lib/fitness";

type TrendExercise = {
  id: string;
  name: string;
  unit: string;
  measurementType: string;
  trackBodyweight: boolean;
};

type ExerciseTrendSectionProps = {
  exercises: TrendExercise[];
  logsByExercise: Record<string, DashboardTrendPoint[]>;
  currentBodyweightKg?: number | null;
};

export function ExerciseTrendSection({
  exercises,
  logsByExercise,
  currentBodyweightKg,
}: ExerciseTrendSectionProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const requested = searchParams?.get("exercise") ?? null;

  // Single source of truth: URL ?exercise=<id>, falling back to the most-recent
  // exercise that has a log, then the first exercise alphabetically. We re-derive
  // on every render — no useEffect, no setState-in-effect cascade.
  const selectedId = useMemo(() => {
    if (exercises.length === 0) return null;
    if (requested && exercises.some((e) => e.id === requested)) return requested;
    let best: { id: string; when: number } | null = null;
    for (const ex of exercises) {
      const list = logsByExercise[ex.id] ?? [];
      const top = list[0];
      if (!top) continue;
      const when = top.performedAt instanceof Date
        ? top.performedAt.getTime()
        : new Date(top.performedAt).getTime();
      if (!best || when > best.when) best = { id: ex.id, when };
    }
    return best ? best.id : exercises[0].id;
  }, [exercises, logsByExercise, requested]);

  const series: DashboardTrendPoint[] = useMemo(() => {
    if (!selectedId) return [];
    return logsByExercise[selectedId] ?? [];
  }, [selectedId, logsByExercise]);

  const stats = useMemo(() => {
    if (series.length === 0) {
      return { latest: null as number | null, best: null as number | null, delta: null as number | null, entries: 0 };
    }
    const values = series.map((p) => p.value);
    const latest = values[0]; // series is newest-first from the data layer
    const best = values.reduce((m, v) => (v > m ? v : m), values[0]);
    const first = values[values.length - 1];
    const delta = first === 0 ? null : ((latest - first) / first) * 100;
    return { latest, best, delta, entries: series.length };
  }, [series]);

  if (exercises.length === 0) {
    return (
      <section className="rounded-[2rem] border border-white/10 bg-slate-950/80 p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-white">Trend</h2>
            <p className="mt-1 text-sm text-slate-400">
              Pick an exercise from the dropdown to see how your numbers have moved over time.
            </p>
          </div>
        </div>
        <div className="mt-6 rounded-3xl border border-dashed border-white/10 p-6 text-sm text-slate-400">
          No exercises yet. Create one below to start tracking your trend.
        </div>
      </section>
    );
  }

  const selected = exercises.find((e) => e.id === selectedId) ?? exercises[0];
  const subtitle = selected.trackBodyweight && currentBodyweightKg
    ? `Added load in ${selected.unit}; current bodyweight ${currentBodyweightKg} kg is snapshotted on each log.`
    : `Quantities are plotted in ${selected.unit}.`;

  const deltaText =
    stats.delta === null
      ? null
      : `${stats.delta >= 0 ? "+" : ""}${stats.delta.toFixed(1)}%`;

  return (
    <section className="rounded-[2rem] border border-white/10 bg-slate-950/80 p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-white">Trend</h2>
          <p className="mt-1 text-sm text-slate-400">
            Pick an exercise to see how your numbers have moved over time.
          </p>
        </div>
        <label className="flex items-center gap-2 text-sm text-slate-300">
          <span className="text-xs uppercase tracking-wider text-slate-500">Exercise</span>
          <select
            value={selectedId ?? ""}
            onChange={(event) => {
              const next = event.target.value;
              const params = new URLSearchParams(searchParams?.toString() ?? "");
              params.set("exercise", next);
              router.replace(`?${params.toString()}`, { scroll: false });
            }}
            className="rounded-2xl border border-white/10 bg-slate-900 px-4 py-2 text-sm text-white outline-none transition focus:border-cyan-300"
          >
            {exercises.map((ex) => (
              <option key={ex.id} value={ex.id}>
                {ex.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="mt-6">
        <ProgressChart
          unit={selected.unit}
          logs={series.map((p) => ({
            id: p.id,
            value: p.value,
            performedAt:
              p.performedAt instanceof Date
                ? p.performedAt
                : new Date(p.performedAt),
            bodyweightKg: p.bodyweightKg,
          }))}
          title={`${selected.name} trend`}
          subtitle={subtitle}
          latest={stats.latest}
          best={stats.best}
        />
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-4">
          <div className="text-[10px] uppercase tracking-wider text-slate-500">Entries</div>
          <div className="mt-1 text-lg font-semibold text-white">{stats.entries}</div>
        </div>
        <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-4">
          <div className="text-[10px] uppercase tracking-wider text-slate-500">Best</div>
          <div className="mt-1 text-lg font-semibold text-white">
            {stats.best === null ? "—" : `${stats.best} ${selected.unit}`}
          </div>
        </div>
        <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-4">
          <div className="text-[10px] uppercase tracking-wider text-slate-500">Change since first log</div>
          <div
            className={`mt-1 text-lg font-semibold ${
              stats.delta === null
                ? "text-slate-300"
                : stats.delta > 0
                  ? "text-emerald-300"
                  : stats.delta < 0
                    ? "text-rose-300"
                    : "text-slate-300"
            }`}
          >
            {deltaText ?? "—"}
          </div>
        </div>
      </div>
    </section>
  );
}