import { revalidatePath } from "next/cache";

import { and, desc, eq, sql } from "drizzle-orm";
import { z } from "zod";

import { getDb } from "@/lib/db";
import {
  bodyweightEntries,
  exerciseLogs,
  exercises,
  userProfiles,
} from "@/lib/db/app-schema";

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
}

export async function listExercisesForUser(userId: string) {
  await ensureUserProfile(userId);

  const rows = await db()
    .select({
      id: exercises.id,
      name: exercises.name,
      measurementType: exercises.measurementType,
      unit: exercises.unit,
      trackBodyweight: exercises.trackBodyweight,
      notes: exercises.notes,
      createdAt: exercises.createdAt,
      latestValue: sql<number | null>`(
        select ${exerciseLogs.value}
        from ${exerciseLogs}
        where ${exerciseLogs.exerciseId} = ${exercises.id}
        order by ${exerciseLogs.performedAt} desc
        limit 1
      )`,
      latestPerformedAt: sql<Date | null>`(
        select ${exerciseLogs.performedAt}
        from ${exerciseLogs}
        where ${exerciseLogs.exerciseId} = ${exercises.id}
        order by ${exerciseLogs.performedAt} desc
        limit 1
      )`,
      bestValue: sql<number | null>`(
        select max(${exerciseLogs.value})
        from ${exerciseLogs}
        where ${exerciseLogs.exerciseId} = ${exercises.id}
      )`,
      totalEntries: sql<number>`(
        select count(*)
        from ${exerciseLogs}
        where ${exerciseLogs.exerciseId} = ${exercises.id}
      )`,
    })
    .from(exercises)
    .where(eq(exercises.userId, userId))
    .orderBy(desc(exercises.updatedAt), exercises.name);

  return rows;
}

export async function getDashboardData(userId: string) {
  await ensureUserProfile(userId);

  const [profile] = await db()
    .select()
    .from(userProfiles)
    .where(eq(userProfiles.userId, userId))
    .limit(1);

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

  await db().insert(bodyweightEntries).values({
    userId,
    weightKg: values.weightKg,
  });

  revalidatePath("/dashboard");
  revalidatePath("/settings");
  return profile;
}

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
