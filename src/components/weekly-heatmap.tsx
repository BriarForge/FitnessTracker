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

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
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

function monthIndex(date: string): number {
  const [, month] = date.split("-").map(Number);
  return month - 1;
}

function dayOfMonth(date: string): number {
  const [, , day] = date.split("-").map(Number);
  return day;
}

function getWeekMonthLabel(week: ActivityWeek, weekIdx: number): string {
  if (weekIdx === 0) {
    return MONTH_LABELS[monthIndex(week.days[0]?.date ?? "")] ?? "";
  }

  const firstOfMonth = week.days.find((day) => dayOfMonth(day.date) === 1);
  if (firstOfMonth) {
    return MONTH_LABELS[monthIndex(firstOfMonth.date)] ?? "";
  }

  return "";
}

export function WeeklyHeatmap({
  weeks,
  totalSessions,
  timezone,
  selectedDate,
  onSelectDate,
}: HeatmapProps) {
  const gridTemplateColumns = `1.75rem repeat(${Math.max(
    weeks.length,
    1,
  )}, minmax(0, 1fr))`;

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
        <div
          className="grid gap-1"
          style={{ gridTemplateColumns }}
        >
          <div aria-hidden="true" />
          {weeks.map((week, weekIdx) => (
            <div
              key={`month-${week.startDate}`}
              className="min-w-0 justify-self-start text-left text-[10px] text-slate-500"
            >
              {getWeekMonthLabel(week, weekIdx)}
            </div>
          ))}

          {DAY_LABELS.map((label, dayIdx) => (
            <div
              key={`day-label-${dayIdx}`}
              className="flex items-center justify-end pr-1 text-[10px] text-slate-500"
            >
              {label}
            </div>
          ))}

          {weeks.flatMap((week, weekIdx) =>
            week.days.map((day: ActivityDay, dayIdx) => {
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
                  style={{
                    gridColumnStart: weekIdx + 2,
                    gridRowStart: dayIdx + 2,
                  }}
                  className={[
                    "h-3 w-full rounded-[4px] transition",
                    intensityClass(day.count),
                    isSelected
                      ? "ring-2 ring-cyan-300 ring-offset-1 ring-offset-slate-950"
                      : "hover:scale-y-125",
                  ].join(" ")}
                />
              );
            }),
          )}
        </div>
      </div>

      <div className="mt-4 flex items-center gap-2 text-xs text-slate-500">
        <span>Less</span>
        <span className="h-3 w-5 rounded-[4px] bg-slate-900 border border-white/5" />
        <span className="h-3 w-5 rounded-[4px] bg-emerald-500/30 border border-emerald-300/20" />
        <span className="h-3 w-5 rounded-[4px] bg-emerald-400/60 border border-emerald-300/40" />
        <span className="h-3 w-5 rounded-[4px] bg-emerald-300 border border-emerald-200" />
        <span>More</span>
      </div>
    </div>
  );
}
