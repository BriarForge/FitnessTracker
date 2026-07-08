type ProgressPoint = {
  id: string;
  value: number;
  performedAt: Date;
  bodyweightKg?: number | null;
};

type ProgressChartProps = {
  unit: string;
  logs: ProgressPoint[];
  title?: string;
  subtitle?: string;
  latest?: number | null;
  best?: number | null;
};

const WIDTH = 640;
const HEIGHT = 240;
const PADDING = { top: 24, right: 24, bottom: 36, left: 40 };

function formatShortDate(date: Date, locale?: string): string {
  return new Intl.DateTimeFormat(locale, {
    month: "short",
    day: "numeric",
  }).format(date);
}

function formatFullDate(date: Date, locale?: string): string {
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export function ProgressChart({
  unit,
  logs,
  title,
  subtitle,
  latest,
  best,
}: ProgressChartProps) {
  // Logs arrive newest-first from the data layer; flip to oldest-first so the
  // trend line reads left → right over time.
  const ordered = [...logs].sort(
    (a, b) => a.performedAt.getTime() - b.performedAt.getTime(),
  );

  if (ordered.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-white/15 bg-slate-900/70 p-8 text-sm text-slate-400">
        No entries yet. Log a workout to start the trend.
      </div>
    );
  }

  if (ordered.length < 2) {
    return (
      <div className="rounded-3xl border border-dashed border-white/15 bg-slate-900/70 p-8 text-sm text-slate-400">
        Add at least one more entry to see a trend line.
      </div>
    );
  }

  const values = ordered.map((log) => log.value);
  const rawMin = Math.min(...values);
  const rawMax = Math.max(...values);
  const min = Number.isFinite(rawMin) ? rawMin : 0;
  const max = Number.isFinite(rawMax) ? rawMax : 1;
  const range = Math.max(max - min, 1);

  const innerW = WIDTH - PADDING.left - PADDING.right;
  const innerH = HEIGHT - PADDING.top - PADDING.bottom;

  const times = ordered.map((log) => log.performedAt.getTime());
  const tMin = times[0];
  const tMax = times[times.length - 1];
  const tRange = Math.max(tMax - tMin, 1);

  const points = ordered.map((log) => {
    const x =
      PADDING.left +
      ((log.performedAt.getTime() - tMin) / tRange) * innerW;
    const y =
      PADDING.top + innerH - ((log.value - min) / range) * innerH;
    return { x, y, log };
  });

  // Y-axis ticks: 5 evenly spaced values from min to max.
  const yTickValues = [
    min,
    min + range * 0.25,
    min + range * 0.5,
    min + range * 0.75,
    max,
  ];

  // X-axis ticks: up to 5 evenly spaced across time.
  const xTickCount = Math.min(5, ordered.length);
  const xTicks = Array.from({ length: xTickCount }, (_, i) => {
    const ratio = xTickCount === 1 ? 0 : i / (xTickCount - 1);
    return {
      x: PADDING.left + ratio * innerW,
      date: new Date(tMin + ratio * tRange),
    };
  });

  const heading = title ?? "Trend";
  const subheading = subtitle ?? `Quantities are plotted in ${unit}.`;

  return (
    <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-4">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-white">{heading}</div>
          <div className="text-xs text-slate-400">{subheading}</div>
        </div>
        <div className="flex gap-4 text-right text-xs text-slate-400">
          {latest !== undefined ? (
            <div>
              <div className="text-[10px] uppercase tracking-wider text-slate-500">Latest</div>
              <div className="text-slate-200">
                {latest === null ? "—" : `${latest} ${unit}`}
              </div>
            </div>
          ) : null}
          {best !== undefined ? (
            <div>
              <div className="text-[10px] uppercase tracking-wider text-slate-500">Best</div>
              <div className="text-slate-200">
                {best === null ? "—" : `${best} ${unit}`}
              </div>
            </div>
          ) : null}
          <div>
            <div className="text-[10px] uppercase tracking-wider text-slate-500">Low</div>
            <div>{min} {unit}</div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-wider text-slate-500">High</div>
            <div>{max} {unit}</div>
          </div>
        </div>
      </div>
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="w-full overflow-visible">
        <defs>
          <linearGradient id="progress-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#34d399" />
            <stop offset="100%" stopColor="#22d3ee" />
          </linearGradient>
        </defs>

        {yTickValues.map((tick, i) => {
          const y =
            PADDING.top + innerH - ((tick - min) / range) * innerH;
          return (
            <g key={`y-${i}`}>
              <line
                x1={PADDING.left}
                x2={WIDTH - PADDING.right}
                y1={y}
                y2={y}
                stroke="rgba(148, 163, 184, 0.12)"
                strokeDasharray="2 4"
              />
              <text
                x={PADDING.left - 8}
                y={y + 4}
                textAnchor="end"
                fontSize="10"
                fill="rgba(148, 163, 184, 0.7)"
              >
                {tick}
              </text>
            </g>
          );
        })}

        {xTicks.map((tick, i) => (
          <text
            key={`x-${i}`}
            x={tick.x}
            y={HEIGHT - PADDING.bottom + 18}
            textAnchor="middle"
            fontSize="10"
            fill="rgba(148, 163, 184, 0.7)"
          >
            {formatShortDate(tick.date)}
          </text>
        ))}

        <polyline
          fill="none"
          stroke="url(#progress-gradient)"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={points.map((p) => `${p.x},${p.y}`).join(" ")}
        />

        {points.map((p) => {
          const bw = p.log.bodyweightKg;
          const tooltip = bw
            ? `${p.log.value} ${unit} on ${formatFullDate(p.log.performedAt)} (BW ${bw} kg)`
            : `${p.log.value} ${unit} on ${formatFullDate(p.log.performedAt)}`;
          return (
            <g key={p.log.id}>
              <circle cx={p.x} cy={p.y} r="5" fill="#e2e8f0" />
              <title>{tooltip}</title>
            </g>
          );
        })}
      </svg>
    </div>
  );
}