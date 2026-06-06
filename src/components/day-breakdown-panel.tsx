"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { formatMetricValue } from "@/lib/fitness-shared";

type BreakdownEntry = {
  logId: string;
  exerciseId: string;
  exerciseName: string;
  measurementType: string;
  unit: string;
  value: number;
  bodyweightKg: number | null;
  performedAt: string;
  note: string | null;
};

type BreakdownResponse = {
  date: string;
  timezone: string;
  entries: BreakdownEntry[];
};

type PanelState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "ok"; data: BreakdownResponse }
  | { status: "error"; message: string };

type DayBreakdownPanelProps = {
  date: string | null;
  onClose: () => void;
};

const DAY_LABELS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];
const MONTH_LABELS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function formatLongDate(date: string): string {
  const [y, m, d] = date.split("-").map(Number);
  if (!y || !m || !d) return date;
  const probe = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
  const dayName = DAY_LABELS[probe.getUTCDay()];
  return `${dayName}, ${d} ${MONTH_LABELS[m - 1]} ${y}`;
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function DayBreakdownPanel({ date, onClose }: DayBreakdownPanelProps) {
  const [state, setState] = useState<PanelState>(() =>
    date ? { status: "loading" } : { status: "idle" },
  );

  useEffect(() => {
    if (!date) {
      return;
    }
    let cancelled = false;

    fetch(`/api/v1/activity?date=${date}`, { cache: "no-store" })
      .then(async (res) => {
        if (!res.ok) {
          throw new Error(`Failed to load (${res.status})`);
        }
        const body = (await res.json()) as BreakdownResponse;
        if (!cancelled) {
          setState({ status: "ok", data: body });
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setState({
            status: "error",
            message: err instanceof Error ? err.message : "Unknown error",
          });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [date]);

  // Close on Escape
  useEffect(() => {
    if (!date) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [date, onClose]);

  if (!date) return null;

  const subtitle =
    state.status === "ok"
      ? `${state.data.entries.length} session${
          state.data.entries.length === 1 ? "" : "s"
        } · ${state.data.timezone}`
      : state.status === "loading"
        ? "Loading…"
        : state.status === "error"
          ? state.message
          : "";

  return (
    <aside
      role="complementary"
      aria-label={`Activity for ${formatLongDate(date)}`}
      className="rounded-[2rem] border border-white/10 bg-slate-950/90 p-6"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-xs uppercase tracking-[0.25em] text-cyan-300">
            Breakdown
          </div>
          <h3 className="mt-2 text-xl font-semibold text-white">
            {formatLongDate(date)}
          </h3>
          <p className="mt-1 text-sm text-slate-400">{subtitle}</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-full border border-white/10 px-3 py-1.5 text-xs text-slate-300 transition hover:border-white/30 hover:text-white"
        >
          Close
        </button>
      </div>

      <div className="mt-5">
        {state.status === "loading" || state.status === "idle" ? (
          <div className="text-sm text-slate-400">Loading…</div>
        ) : state.status === "error" ? (
          <div className="rounded-2xl border border-rose-400/30 bg-rose-400/10 p-4 text-sm text-rose-100">
            {state.message}
          </div>
        ) : state.data.entries.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/10 p-6 text-sm text-slate-400">
            No sessions on this day.
          </div>
        ) : (
          <ul className="space-y-3">
            {state.data.entries.map((entry) => (
              <li
                key={entry.logId}
                className="rounded-2xl border border-white/10 bg-slate-900 p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <Link
                    href={`/exercises/${entry.exerciseId}`}
                    className="text-base font-semibold text-white transition hover:text-cyan-200"
                  >
                    {entry.exerciseName}
                  </Link>
                  <div className="text-xs text-slate-500">
                    {formatTime(entry.performedAt)}
                  </div>
                </div>
                <div className="mt-2 text-sm text-slate-300">
                  {formatMetricValue(entry.value, entry.unit)}
                </div>
                {entry.bodyweightKg ? (
                  <div className="mt-1 text-xs text-slate-500">
                    Bodyweight snapshot: {entry.bodyweightKg} kg
                  </div>
                ) : null}
                {entry.note ? (
                  <div className="mt-2 text-sm text-slate-400">{entry.note}</div>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </div>
    </aside>
  );
}
