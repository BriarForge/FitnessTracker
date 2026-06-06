import type { ActivityDay, ActivityWeek } from "@/lib/fitness-shared";

type HeatmapProps = {
  weeks: ActivityWeek[];
  totalSessions: number;
  timezone: string;
  selectedDate: string | null;
  onSelectDate: (date: string) => void;
};

function intensityClass(count: number): string {
  if (count <= 0) {
    return "bg-slate-900 border border-white/5";
  }
  if (count === 1) {
    return "bg-emerald-500/30 border border-emerald-300/20";
  }
  if (count <= 3) {
    return "bg-emerald-400/60 border border-emerald-300/40";
  }
  return "bg-emerald-300 border border-emerald-200";
}

const DAY_LABELS = ["", "Mon", "", "Wed", "", "Fri", ""];
const MONTH_LABELS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

function formatDateLabel(date: string): string {
  const [y, m, d] = date.split("-").map(Number);
  const month = MONTH_LABELS[m - 1] ?? "";
  return `${d} ${month} ${y}`;
}

export function WeeklyHeatmap({
  weeks,
  totalSessions,
  timezone,
  selectedDate,
  onSelectDate,
}: HeatmapProps) {
  const weekColumns = `repeat(${Math.max(weeks.length, 1)}, minmax(0, 1fr))`;

  return (
    <div className="rounded-[2rem] border border-white/10 bg-slate-950/80 p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-white">Weekly activity</h2>
          <p className="mt-1 text-sm text-slate-400">
            Last {weeks.length} weeks in {timezone}. Click a day for the
            breakdown.
          </p>
        </div>
        <div className="text-right text-sm text-slate-300">
          <div className="text-2xl font-semibold text-white">
            {totalSessions}
          </div>
          <div className="text-xs uppercase tracking-wider text-slate-500">
            sessions
          </div>
        </div>
      </div>

      <div className="mt-5">
        <div className="flex flex-col gap-1">
          <div
            className="ml-7 grid gap-1 text-[10px] text-slate-500"
            style={{ gridTemplateColumns: weekColumns }}
          >
            {weeks.map((week, idx) => {
              const lastDay = week.days[week.days.length - 1];
              const label = lastDay
                ? MONTH_LABELS[Number(lastDay.date.split("-")[1]) - 1]
                : "";
              const prevLabel =
                idx > 0
                  ? MONTH_LABELS[
                      Number(weeks[idx - 1].days[0].date.split("-")[1]) - 1
                    ]
                  : "";
              return (
                <div
                  key={`month-${idx}`}
                  className="min-w-0 text-center"
                >
                  {label !== prevLabel ? label : ""}
                </div>
              );
            })}
          </div>
          <div className="flex items-start gap-1">
            <div className="flex w-7 flex-col gap-1 pt-px text-[10px] text-slate-500">
              {DAY_LABELS.map((label, idx) => (
                <div
                  key={`day-label-${idx}`}
                  className="flex h-3 items-center justify-end pr-1"
                >
                  {label}
                </div>
              ))}
            </div>
            <div
              className="grid flex-1 gap-1"
              style={{ gridTemplateColumns: weekColumns }}
            >
              {weeks.map((week) => (
                <div
                  key={week.startDate}
                  className="grid gap-1"
                  style={{ gridTemplateRows: "repeat(7, minmax(0, 1fr))" }}
                >
                  {week.days.map((day: ActivityDay) => {
                    const isSelected = day.date === selectedDate;
                    return (
                      <button
                        key={day.date}
                        type="button"
                        onClick={() => onSelectDate(day.date)}
                        title={`${formatDateLabel(day.date)} — ${day.count} session${
                          day.count === 1 ? "" : "s"
                        }`}
                        aria-label={`${formatDateLabel(day.date)}: ${day.count} session${
                          day.count === 1 ? "" : "s"
                        }`}
                        className={[
                          "aspect-square w-full rounded-sm transition",
                          intensityClass(day.count),
                          isSelected
                            ? "ring-2 ring-cyan-300 ring-offset-1 ring-offset-slate-950"
                            : "hover:scale-110",
                        ].join(" ")}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-2 text-xs text-slate-500">
        <span>Less</span>
        <span className="h-3 w-3 rounded-sm bg-slate-900 border border-white/5" />
        <span className="h-3 w-3 rounded-sm bg-emerald-500/30 border border-emerald-300/20" />
        <span className="h-3 w-3 rounded-sm bg-emerald-400/60 border border-emerald-300/40" />
        <span className="h-3 w-3 rounded-sm bg-emerald-300 border border-emerald-200" />
        <span>More</span>
      </div>
    </div>
  );
}
