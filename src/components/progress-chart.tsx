type ProgressPoint = {
  id: string;
  value: number;
  performedAt: Date;
};

type ProgressChartProps = {
  unit: string;
  logs: ProgressPoint[];
};

export function ProgressChart({ unit, logs }: ProgressChartProps) {
  const ordered = [...logs].reverse();

  if (ordered.length < 2) {
    return (
      <div className="rounded-3xl border border-dashed border-white/15 bg-slate-900/70 p-8 text-sm text-slate-400">
        Add at least two entries to see a trend line.
      </div>
    );
  }

  const width = 640;
  const height = 240;
  const padding = 28;
  const values = ordered.map((log) => log.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = Math.max(max - min, 1);

  const points = ordered.map((log, index) => {
    const x = padding + (index / (ordered.length - 1)) * (width - padding * 2);
    const y =
      height -
      padding -
      ((log.value - min) / range) * (height - padding * 2);
    return `${x},${y}`;
  });

  return (
    <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-4">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <div className="text-sm font-semibold text-white">Trend</div>
          <div className="text-xs text-slate-400">
            Quantities are plotted in {unit}.
          </div>
        </div>
        <div className="text-right text-xs text-slate-400">
          <div>Low: {min}</div>
          <div>High: {max}</div>
        </div>
      </div>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full overflow-visible">
        <defs>
          <linearGradient id="progress-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#34d399" />
            <stop offset="100%" stopColor="#22d3ee" />
          </linearGradient>
        </defs>
        <polyline
          fill="none"
          stroke="url(#progress-gradient)"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={points.join(" ")}
        />
        {ordered.map((log, index) => {
          const [x, y] = points[index].split(",");
          return (
            <g key={log.id}>
              <circle cx={x} cy={y} r="5" fill="#e2e8f0" />
            </g>
          );
        })}
      </svg>
    </div>
  );
}
