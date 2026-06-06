import { revalidatePath } from "next/cache";

import { and, asc, desc, eq, gte, inArray, lte, sql } from "drizzle-orm";
import { z } from "zod";

import { getEnv } from "@/lib/env";
import { getDb } from "@/lib/db";
import {
  bodyweightEntries,
  exerciseLogs,
  exercises,
  userProfiles,
} from "@/lib/db/app-schema";
import {
  mirrorProfileUpsert,
  mirrorExerciseUpsert,
  mirrorExerciseLogUpsert,
  mirrorBodyweightEntryUpsert,
} from "@/lib/db/sync";
import type {
  ActivityDay,
  ActivityWeek,
  WeeklyActivity,
} from "@/lib/fitness-shared";

const DEFAULT_TIMEZONE = "Australia/Perth";

function resolveTimezone(userTimezone?: string | null): string {
  if (userTimezone) {
    return userTimezone;
  }
  return getEnv().FITNESS_TIMEZONE || DEFAULT_TIMEZONE;
}

const exerciseSchema = z.object({
  name: z.string().trim().min(2).max(80),
  measurementType: z.enum(["reps", "distance", "duration", "weight"]),
  unit: z.string().trim().min(1).max(16),
  trackBodyweight: z.boolean().default(false),
  notes: z.string().trim().max(280).optional(),
});

const logSchema = z.object({
  exerciseId: z.uuid(),
  value: z.coerce.number().positive(),
  performedAt: z.coerce.date().optional(),
  note: z.string().trim().max(280).optional(),
});

const bodyweightSchema = z.object({
  weightKg: z.coerce.number().positive().max(500),
});

export type ExerciseInput = z.infer<typeof exerciseSchema>;
export type ExerciseLogInput = z.infer<typeof logSchema>;
export type BodyweightInput = z.infer<typeof bodyweightSchema>;

function db() {
  return getDb();
}

export async function ensureUserProfile(userId: string) {
  await db()
    .insert(userProfiles)
    .values({
      userId,
    })
    .onConflictDoNothing();

  // Mirror to local SQLite backup (idempotent upsert)
  await mirrorProfileUpsert(userId, {
    updatedAt: new Date(),
  });
}

export type ExerciseWithStats = Awaited<
  ReturnType<typeof listExercisesForUser>
>[number];

export async function listExercisesForUser(userId: string) {
  await ensureUserProfile(userId);

  const exerciseRows = await db()
    .select({
      id: exercises.id,
      name: exercises.name,
      measurementType: exercises.measurementType,
      unit: exercises.unit,
      trackBodyweight: exercises.trackBodyweight,
      notes: exercises.notes,
      createdAt: exercises.createdAt,
      updatedAt: exercises.updatedAt,
    })
    .from(exercises)
    .where(eq(exercises.userId, userId))
    .orderBy(desc(exercises.updatedAt), exercises.name);

  if (exerciseRows.length === 0) {
    return [];
  }

  const exerciseIds = exerciseRows.map((row) => row.id);
  const logRows = await db()
    .select({
      exerciseId: exerciseLogs.exerciseId,
      value: exerciseLogs.value,
      performedAt: exerciseLogs.performedAt,
    })
    .from(exerciseLogs)
    .where(inArray(exerciseLogs.exerciseId, exerciseIds))
    .orderBy(desc(exerciseLogs.performedAt));

  const byExercise = new Map<string, { value: number; performedAt: Date }[]>();
  for (const log of logRows) {
    const list = byExercise.get(log.exerciseId) ?? [];
    list.push({ value: Number(log.value), performedAt: log.performedAt });
    byExercise.set(log.exerciseId, list);
  }

  return exerciseRows.map((row) => {
    const logs = byExercise.get(row.id) ?? [];
    const latest = logs[0] ?? null;
    const best = logs.reduce((max, log) => Math.max(max, log.value), 0);
    return {
      ...row,
      latestValue: latest ? latest.value : null,
      latestPerformedAt: latest ? latest.performedAt : null,
      bestValue: logs.length > 0 ? best : null,
      totalEntries: logs.length,
    };
  });
}

export async function getDashboardData(userId: string) {
  await ensureUserProfile(userId);

  const [profile] = await db()
    .select()
    .from(userProfiles)
    .where(eq(userProfiles.userId, userId))
    .limit(1);

  const timezone = resolveTimezone(profile?.timezone);
  const exerciseRows = await listExercisesForUser(userId);

  const [summary] = await db()
    .select({
      totalExercises: sql<number>`count(distinct ${exercises.id})`,
      totalLogs: sql<number>`count(${exerciseLogs.id})`,
    })
    .from(exercises)
    .leftJoin(exerciseLogs, eq(exerciseLogs.exerciseId, exercises.id))
    .where(eq(exercises.userId, userId));

  return {
    profile,
    timezone,
    exercises: exerciseRows,
    summary: {
      totalExercises: summary?.totalExercises ?? 0,
      totalLogs: summary?.totalLogs ?? 0,
    },
  };
}

export async function createExercise(userId: string, input: ExerciseInput) {
  const values = exerciseSchema.parse(input);

  const [exercise] = await db()
    .insert(exercises)
    .values({
      userId,
      name: values.name,
      measurementType: values.measurementType,
      unit: values.unit,
      trackBodyweight: values.trackBodyweight,
      notes: values.notes,
    })
    .returning();

  revalidatePath("/dashboard");

  // Mirror to local SQLite backup
  await mirrorExerciseUpsert({
    id: exercise.id,
    userId: exercise.userId,
    name: exercise.name,
    measurementType: exercise.measurementType,
    unit: exercise.unit,
    trackBodyweight: exercise.trackBodyweight,
    notes: exercise.notes,
    createdAt: exercise.createdAt,
    updatedAt: exercise.updatedAt,
  });

  return exercise;
}

export async function getExerciseForUser(userId: string, exerciseId: string) {
  const [exercise] = await db()
    .select()
    .from(exercises)
    .where(and(eq(exercises.id, exerciseId), eq(exercises.userId, userId)))
    .limit(1);

  return exercise ?? null;
}

export async function listLogsForExercise(userId: string, exerciseId: string) {
  return db()
    .select()
    .from(exerciseLogs)
    .where(
      and(eq(exerciseLogs.userId, userId), eq(exerciseLogs.exerciseId, exerciseId)),
    )
    .orderBy(desc(exerciseLogs.performedAt), desc(exerciseLogs.createdAt));
}

export async function getExerciseProgress(userId: string, exerciseId: string) {
  const exercise = await getExerciseForUser(userId, exerciseId);

  if (!exercise) {
    return null;
  }

  const logs = await listLogsForExercise(userId, exerciseId);
  const [profile] = await db()
    .select()
    .from(userProfiles)
    .where(eq(userProfiles.userId, userId))
    .limit(1);

  const best = logs.reduce((maxValue, log) => Math.max(maxValue, log.value), 0);

  return {
    exercise,
    logs,
    profile,
    best,
  };
}

export async function addExerciseLog(userId: string, input: ExerciseLogInput) {
  const values = logSchema.parse(input);
  const exercise = await getExerciseForUser(userId, values.exerciseId);

  if (!exercise) {
    throw new Error("Exercise not found.");
  }

  const [profile] = await db()
    .select()
    .from(userProfiles)
    .where(eq(userProfiles.userId, userId))
    .limit(1);

  const [log] = await db()
    .insert(exerciseLogs)
    .values({
      userId,
      exerciseId: exercise.id,
      value: values.value,
      bodyweightKg: exercise.trackBodyweight
        ? profile?.currentBodyweightKg ?? null
        : null,
      note: values.note,
      performedAt: values.performedAt ?? new Date(),
    })
    .returning();

  await db()
    .update(exercises)
    .set({
      updatedAt: new Date(),
    })
    .where(eq(exercises.id, exercise.id));

  revalidatePath("/dashboard");
  revalidatePath(`/exercises/${exercise.id}`);

  // Mirror to local SQLite backup
  await mirrorExerciseLogUpsert({
    id: log.id,
    userId: log.userId,
    exerciseId: log.exerciseId,
    value: Number(log.value),
    bodyweightKg: log.bodyweightKg ? Number(log.bodyweightKg) : null,
    note: log.note,
    performedAt: log.performedAt,
    createdAt: log.createdAt,
  });

  return log;
}

export async function updateBodyweight(userId: string, input: BodyweightInput) {
  const values = bodyweightSchema.parse(input);

  await ensureUserProfile(userId);

  const [profile] = await db()
    .update(userProfiles)
    .set({
      currentBodyweightKg: values.weightKg,
      updatedAt: new Date(),
    })
    .where(eq(userProfiles.userId, userId))
    .returning();

  const [bwEntry] = await db().insert(bodyweightEntries).values({
    userId,
    weightKg: values.weightKg,
  }).returning();

  revalidatePath("/dashboard");
  revalidatePath("/settings");

  // Mirror to local SQLite backup
  await mirrorBodyweightEntryUpsert({
    id: bwEntry.id,
    userId,
    weightKg: Number(bwEntry.weightKg),
    recordedAt: bwEntry.recordedAt,
    createdAt: bwEntry.createdAt,
  });
  await mirrorProfileUpsert(userId, {
    currentBodyweightKg: Number(profile.currentBodyweightKg),
    updatedAt: profile.updatedAt,
  });

  return profile;
}

export async function updateTimezone(userId: string, timezone: string) {
  await ensureUserProfile(userId);

  const [profile] = await db()
    .update(userProfiles)
    .set({
      timezone,
      updatedAt: new Date(),
    })
    .where(eq(userProfiles.userId, userId))
    .returning();

  revalidatePath("/dashboard");
  revalidatePath("/settings");

  // Mirror to local SQLite backup
  await mirrorProfileUpsert(userId, {
    timezone,
    updatedAt: new Date(),
  });

  return profile;
}

function toIsoDateInTimezone(date: Date, timezone: string): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const year = parts.find((p) => p.type === "year")?.value ?? "1970";
  const month = parts.find((p) => p.type === "month")?.value ?? "01";
  const day = parts.find((p) => p.type === "day")?.value ?? "01";
  return `${year}-${month}-${day}`;
}

export async function getWeeklyActivity(
  userId: string,
  weeks = 12,
  timezone?: string,
  userTimezone?: string | null,
): Promise<WeeklyActivity> {
  const tz = timezone || resolveTimezone(userTimezone);
  const safeWeeks = Math.max(1, Math.min(52, Math.floor(weeks)));
  const totalDays = safeWeeks * 7;

  // Pull the last totalDays days of logs, ordered ascending so we can stream.
  // Server-side: filter by userId directly on exerciseLogs to avoid joining.
  const cutoff = new Date(Date.now() - totalDays * 24 * 60 * 60 * 1000);

  const rawLogs = await db()
    .select({
      performedAt: exerciseLogs.performedAt,
    })
    .from(exerciseLogs)
    .where(
      and(
        eq(exerciseLogs.userId, userId),
        gte(exerciseLogs.performedAt, cutoff),
      ),
    )
    .orderBy(asc(exerciseLogs.performedAt));

  // Build a per-day count map keyed by local YYYY-MM-DD.
  const counts = new Map<string, number>();
  for (const log of rawLogs) {
    const key = toIsoDateInTimezone(log.performedAt, tz);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  // Generate the last N days in the user's timezone, oldest first.
  const today = new Date();
  const days: ActivityDay[] = [];
  for (let i = totalDays - 1; i >= 0; i--) {
    const d = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
    const key = toIsoDateInTimezone(d, tz);
    days.push({ date: key, count: counts.get(key) ?? 0 });
  }

  // Group into weeks of 7 days, oldest first. The last week ends on today.
  const weekGroups: ActivityWeek[] = [];
  for (let i = 0; i < days.length; i += 7) {
    weekGroups.push({
      startDate: days[i].date,
      days: days.slice(i, i + 7),
    });
  }

  const totalSessions = rawLogs.length;

  return { weeks: weekGroups, totalSessions, timezone: tz };
}

export type DayBreakdownEntry = {
  logId: string;
  exerciseId: string;
  exerciseName: string;
  measurementType: string;
  unit: string;
  value: number;
  bodyweightKg: number | null;
  performedAt: Date;
  note: string | null;
};

export async function getDayBreakdown(
  userId: string,
  date: string,
  timezone?: string,
  userTimezone?: string | null,
): Promise<{ date: string; timezone: string; entries: DayBreakdownEntry[] }> {
  const tz = timezone || resolveTimezone(userTimezone);

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return { date, timezone: tz, entries: [] };
  }

  // Day boundary in the user's timezone, expressed as UTC instants.
  const [yearStr, monthStr, dayStr] = date.split("-");
  const year = Number(yearStr);
  const month = Number(monthStr);
  const day = Number(dayStr);

  // Use a probe datetime at noon in the target tz; the Intl roundtrip gives us the
  // UTC instant for that local-noon, which we then bracket ±24h for safety.
  const noonProbe = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
  const localParts = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(noonProbe);
  const get = (type: string) =>
    Number(localParts.find((p) => p.type === type)?.value ?? 0);
  const tzOffsetMinutes =
    (get("hour") * 60 + get("minute")) -
    (noonProbe.getUTCHours() * 60 + noonProbe.getUTCMinutes());
  if (noonProbe.getUTCDate() !== day) {
    // Day rolled due to tz offset; fall back to a wider ±24h window.
  }
  const dayStart = new Date(
    Date.UTC(year, month - 1, day, 0, 0, 0) - tzOffsetMinutes * 60 * 1000,
  );
  const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);

  const rows = await db()
    .select({
      logId: exerciseLogs.id,
      exerciseId: exercises.id,
      exerciseName: exercises.name,
      measurementType: exercises.measurementType,
      unit: exercises.unit,
      value: exerciseLogs.value,
      bodyweightKg: exerciseLogs.bodyweightKg,
      performedAt: exerciseLogs.performedAt,
      note: exerciseLogs.note,
    })
    .from(exerciseLogs)
    .innerJoin(exercises, eq(exercises.id, exerciseLogs.exerciseId))
    .where(
      and(
        eq(exerciseLogs.userId, userId),
        gte(exerciseLogs.performedAt, dayStart),
        lte(exerciseLogs.performedAt, dayEnd),
      ),
    )
    .orderBy(asc(exerciseLogs.performedAt));

  return {
    date,
    timezone: tz,
    entries: rows.map((r) => ({
      logId: r.logId,
      exerciseId: r.exerciseId,
      exerciseName: r.exerciseName,
      measurementType: r.measurementType,
      unit: r.unit,
      value: Number(r.value),
      bodyweightKg: r.bodyweightKg ? Number(r.bodyweightKg) : null,
      performedAt: r.performedAt,
      note: r.note,
    })),
  };
}
