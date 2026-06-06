"use client";

import { useState } from "react";

import type { ActivityWeek } from "@/lib/fitness-shared";

import { DayBreakdownPanel } from "@/components/day-breakdown-panel";
import { WeeklyHeatmap } from "@/components/weekly-heatmap";

type ActivityDashboardSectionProps = {
  weeks: ActivityWeek[];
  totalSessions: number;
  timezone: string;
};

export function ActivityDashboardSection({
  weeks,
  totalSessions,
  timezone,
}: ActivityDashboardSectionProps) {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  return (
    <section
      className={[
        "grid gap-6",
        selectedDate ? "lg:grid-cols-[1.4fr,1fr]" : "grid-cols-1",
      ].join(" ")}
    >
      <WeeklyHeatmap
        weeks={weeks}
        totalSessions={totalSessions}
        timezone={timezone}
        selectedDate={selectedDate}
        onSelectDate={(date) =>
          setSelectedDate((current) => (current === date ? null : date))
        }
      />
      {selectedDate ? (
        <DayBreakdownPanel
          key={selectedDate}
          date={selectedDate}
          onClose={() => setSelectedDate(null)}
        />
      ) : null}
    </section>
  );
}
