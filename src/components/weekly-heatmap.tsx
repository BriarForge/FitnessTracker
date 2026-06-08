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

function dayOfMonth(date: string): number {
  const [, , day] = date.split("-").map(Number);
  return day;
}

type MonthRow = {
  key: string;
  label: string;
  days: Map<number, ActivityDay>;
};

function buildMonthRows(weeks: ActivityWeek[]): MonthRow[] {
  const rows = new Map<string, MonthRow>();

  for (const week of weeks) {
    for (const day of week.days) {
      const [year, month] = day.date.split("-").map(Number);
      const key = `${year}-${String(month).padStart(2, "0")}`;
      const existingRow = rows.get(key);

      if (existingRow) {
        existingRow.days.set(dayOfMonth(day.date), day);
        continue;
      }

      rows.set(key, {
        key,
        label: `${MONTH_LABELS[month - 1] ?? ""} ${year}`,
        days: new Map([[dayOfMonth(day.date), day]]),
      });
    }
  }

  return Array.from(rows.values());
}

export function WeeklyHeatmap({
  weeks,
  totalSessions,
  timezone,
  selectedDate,
  onSelectDate,
}: HeatmapProps) {
  const monthRows = buildMonthRows(weeks);
  const dayNumbers = Array.from({ length: 31 }, (_, idx) => idx + 1);
  const gridTemplateColumns = "4.5rem repeat(31, minmax(1.1rem, 1fr))";

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

      <div className="mt-5 overflow-x-auto pb-1">
        <div
          className="grid min-w-[40rem] gap-1"
          style={{ gridTemplateColumns }}
        >
          <div aria-hidden="true" />
          {dayNumbers.map((dayNumber) => (
            <div
              key={`day-label-${dayNumber}`}
              className="min-w-0 text-center text-[10px] text-slate-500"
            >
              {dayNumber}
            </div>
          ))}

          {monthRows.map((monthRow, monthIdx) => (
            <div
              key={`month-label-${monthRow.key}`}
              style={{
                gridColumnStart: 1,
                gridRowStart: monthIdx + 2,
              }}
              className="flex h-4 items-center pr-2 text-right text-[10px] text-slate-500"
            >
              {monthRow.label}
            </div>
          ))}

          {monthRows.flatMap((monthRow, monthIdx) =>
            dayNumbers.map((dayNumber) => {
              const day = monthRow.days.get(dayNumber);
              if (!day) {
                return (
                  <div
                    key={`${monthRow.key}-${dayNumber}`}
                    aria-hidden="true"
                    style={{
                      gridColumnStart: dayNumber + 1,
                      gridRowStart: monthIdx + 2,
                    }}
                    className="h-4 w-full rounded-[4px] border border-transparent"
                  />
                );
              }

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
                    gridColumnStart: dayNumber + 1,
                    gridRowStart: monthIdx + 2,
                  }}
                  className={[
                    "h-4 w-full rounded-[4px] transition",
                    intensityClass(day.count),
                    isSelected
                      ? "ring-2 ring-cyan-300 ring-offset-1 ring-offset-slate-950"
                      : "hover:scale-105",
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
