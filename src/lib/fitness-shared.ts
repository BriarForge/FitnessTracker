export function getMeasurementDescription(measurementType: string) {
  switch (measurementType) {
    case "reps":
      return "Track count over time.";
    case "distance":
      return "Track distance sessions like runs or rides.";
    case "duration":
      return "Track time-based sessions like planks or walks.";
    case "weight":
      return "Track external load. Enable bodyweight when the movement includes your own body mass.";
    default:
      return "";
  }
}

export function formatMetricValue(
  value: number | null | undefined,
  unit: string,
  precision = 2,
) {
  if (value === null || value === undefined) {
    return "No data";
  }

  const normalized = Number(value);
  const display =
    Number.isInteger(normalized) || unit === "reps"
      ? normalized.toString()
      : normalized.toFixed(precision).replace(/\.?0+$/, "");

  return `${display} ${unit}`.trim();
}

export type ActivityDay = {
  date: string;
  count: number;
};

export type ActivityWeek = {
  startDate: string;
  days: ActivityDay[];
};

export type WeeklyActivity = {
  weeks: ActivityWeek[];
  totalSessions: number;
  timezone: string;
};
