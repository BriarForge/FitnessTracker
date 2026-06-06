/**
 * Local SQLite sync layer.
 *
 * Strategy:
 * 1. WRITE MIRROR — after every Neon mutation (insert/update/delete), the same
 *    change is applied to the local SQLite file synchronously. This keeps the
 *    local file current with no background worker needed.
 *
 * 2. FULL RECONCILE — a background (or on-demand) full table diff that pulls
 *    all rows from Neon and upserts them into SQLite. This handles any rows
 *    that were missed by the write mirror (e.g. direct DB edits, edge cases).
 *
 * The sync_meta table tracks "last_sync_at" so reconcile only fetches rows
 * changed since the last run.
 */

import { and, eq, gte, desc } from "drizzle-orm";

import { getDb } from "./index";
import { getLocalDb, getLocalDbHandle } from "./local-index";
import {
  userProfiles,
  exercises,
  exerciseLogs,
  bodyweightEntries,
} from "./app-schema";
import {
  sqliteUserProfiles,
  sqliteExercises,
  sqliteExerciseLogs,
  sqliteBodyweightEntries,
  sqliteSyncMeta,
} from "./schema";

// ── Types ────────────────────────────────────────────────────────────────────

export type SyncDirection = "pull" | "push";
export interface SyncResult {
  direction: SyncDirection;
  tables: {
    user_profiles: number;
    exercises: number;
    exercise_logs: number;
    bodyweight_entries: number;
  };
  durationMs: number;
  errors: string[];
}

// ── Sync meta helpers ────────────────────────────────────────────────────────

const META_KEY = "last_reconcile_at";

async function getLastReconcileTime(): Promise<Date | null> {
  const local = getLocalDb();
  const [row] = await local
    .select({ value: sqliteSyncMeta.value })
    .from(sqliteSyncMeta)
    .where(eq(sqliteSyncMeta.key, META_KEY))
    .limit(1);
  if (!row) return null;
  return new Date(row.value);
}

async function setLastReconcileTime(date: Date): Promise<void> {
  const local = getLocalDb();
  await local
    .insert(sqliteSyncMeta)
    .values({ key: META_KEY, value: date.toISOString(), updatedAt: new Date() })
    .onConflictDoUpdate({
      target: sqliteSyncMeta.key,
      set: { value: date.toISOString(), updatedAt: new Date() },
    });
}

// ── Write mirror helpers ─────────────────────────────────────────────────────

async function upsertLocalProfile(userId: string, data: {
  displayName?: string | null;
  currentBodyweightKg?: number | null;
  timezone?: string | null;
  updatedAt: Date;
}) {
  const local = getLocalDb();
  await local
    .insert(sqliteUserProfiles)
    .values({
      userId,
      displayName: data.displayName ?? null,
      currentBodyweightKg: data.currentBodyweightKg ?? null,
      timezone: data.timezone ?? null,
      updatedAt: data.updatedAt,
    })
    .onConflictDoUpdate({
      target: sqliteUserProfiles.userId,
      set: {
        displayName: data.displayName ?? null,
        currentBodyweightKg: data.currentBodyweightKg ?? null,
        timezone: data.timezone ?? null,
        updatedAt: data.updatedAt,
      },
    });
}

async function upsertLocalExercise(data: {
  id: string;
  userId: string;
  name: string;
  measurementType: string;
  unit: string;
  trackBodyweight: boolean;
  notes?: string | null;
  createdAt: Date;
  updatedAt: Date;
}) {
  const local = getLocalDb();
  await local
    .insert(sqliteExercises)
    .values({
      id: data.id,
      userId: data.userId,
      name: data.name,
      measurementType: data.measurementType,
      unit: data.unit,
      trackBodyweight: data.trackBodyweight,
      notes: data.notes ?? null,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    })
    .onConflictDoUpdate({
      target: sqliteExercises.id,
      set: {
        name: data.name,
        measurementType: data.measurementType,
        unit: data.unit,
        trackBodyweight: data.trackBodyweight,
        notes: data.notes ?? null,
        updatedAt: data.updatedAt,
      },
    });
}

async function upsertLocalExerciseLog(data: {
  id: string;
  userId: string;
  exerciseId: string;
  value: number;
  bodyweightKg?: number | null;
  note?: string | null;
  performedAt: Date;
  createdAt: Date;
}) {
  const local = getLocalDb();
  await local
    .insert(sqliteExerciseLogs)
    .values({
      id: data.id,
      userId: data.userId,
      exerciseId: data.exerciseId,
      value: data.value,
      bodyweightKg: data.bodyweightKg ?? null,
      note: data.note ?? null,
      performedAt: data.performedAt,
      createdAt: data.createdAt,
    })
    .onConflictDoUpdate({
      target: sqliteExerciseLogs.id,
      set: {
        value: data.value,
        bodyweightKg: data.bodyweightKg ?? null,
        note: data.note ?? null,
        performedAt: data.performedAt,
      },
    });
}

async function upsertLocalBodyweightEntry(data: {
  id: string;
  userId: string;
  weightKg: number;
  recordedAt: Date;
  createdAt: Date;
}) {
  const local = getLocalDb();
  await local
    .insert(sqliteBodyweightEntries)
    .values({
      id: data.id,
      userId: data.userId,
      weightKg: data.weightKg,
      recordedAt: data.recordedAt,
      createdAt: data.createdAt,
    })
    .onConflictDoUpdate({
      target: sqliteBodyweightEntries.id,
      set: {
        weightKg: data.weightKg,
        recordedAt: data.recordedAt,
      },
    });
}

async function deleteLocalExerciseLog(id: string) {
  const local = getLocalDb();
  await local.delete(sqliteExerciseLogs).where(eq(sqliteExerciseLogs.id, id));
}

async function deleteLocalExercise(id: string) {
  const local = getLocalDb();
  await local.delete(sqliteExercises).where(eq(sqliteExercises.id, id));
}

// ── Public write-mirror API ───────────────────────────────────────────────────

/** Call after a user_profile insert or update on Neon. */
export async function mirrorProfileUpsert(
  userId: string,
  data: {
    displayName?: string | null;
    currentBodyweightKg?: number | null;
    timezone?: string | null;
    updatedAt: Date;
  },
) {
  try {
    await upsertLocalProfile(userId, data);
  } catch (err) {
    console.error("[local-sync] mirrorProfileUpsert failed:", err);
  }
}

/** Call after an exercise insert or update on Neon. */
export async function mirrorExerciseUpsert(data: {
  id: string;
  userId: string;
  name: string;
  measurementType: string;
  unit: string;
  trackBodyweight: boolean;
  notes?: string | null;
  createdAt: Date;
  updatedAt: Date;
}) {
  try {
    await upsertLocalExercise(data);
  } catch (err) {
    console.error("[local-sync] mirrorExerciseUpsert failed:", err);
  }
}

/** Call after an exercise log insert or update on Neon. */
export async function mirrorExerciseLogUpsert(data: {
  id: string;
  userId: string;
  exerciseId: string;
  value: number;
  bodyweightKg?: number | null;
  note?: string | null;
  performedAt: Date;
  createdAt: Date;
}) {
  try {
    await upsertLocalExerciseLog(data);
  } catch (err) {
    console.error("[local-sync] mirrorExerciseLogUpsert failed:", err);
  }
}

/** Call after a bodyweight entry insert on Neon. */
export async function mirrorBodyweightEntryUpsert(data: {
  id: string;
  userId: string;
  weightKg: number;
  recordedAt: Date;
  createdAt: Date;
}) {
  try {
    await upsertLocalBodyweightEntry(data);
  } catch (err) {
    console.error("[local-sync] mirrorBodyweightEntryUpsert failed:", err);
  }
}

/** Call after deleting an exercise log on Neon. */
export async function mirrorExerciseLogDelete(id: string) {
  try {
    await deleteLocalExerciseLog(id);
  } catch (err) {
    console.error("[local-sync] mirrorExerciseLogDelete failed:", err);
  }
}

/** Call after deleting an exercise on Neon. */
export async function mirrorExerciseDelete(id: string) {
  try {
    await deleteLocalExercise(id);
  } catch (err) {
    console.error("[local-sync] mirrorExerciseDelete failed:", err);
  }
}

// ── Full reconcile ────────────────────────────────────────────────────────────

/**
 * Pull all rows from Neon (optionally since last sync) and upsert into SQLite.
 * Safe to run concurrently with live writes — it only adds/updates, never
 * deletes local rows that are stale on Neon (that's a deliberate design choice
 * to preserve any local-only rows).
 */
export async function reconcileFromNeon(): Promise<SyncResult> {
  const start = Date.now();
  const errors: string[] = [];
  const counts = { user_profiles: 0, exercises: 0, exercise_logs: 0, bodyweight_entries: 0 };

  const neon = getDb();
  const lastSync = await getLastReconcileTime();

  try {
    // ── user_profiles ─────────────────────────────────────────────────────
    const profileRows = lastSync
      ? await neon.select().from(userProfiles).where(gte(userProfiles.updatedAt, lastSync))
      : await neon.select().from(userProfiles);
    for (const row of profileRows) {
      await upsertLocalProfile(row.userId, {
        displayName: row.displayName,
        currentBodyweightKg: row.currentBodyweightKg ? Number(row.currentBodyweightKg) : null,
        timezone: row.timezone,
        updatedAt: row.updatedAt,
      });
      counts.user_profiles++;
    }

    // ── exercises ──────────────────────────────────────────────────────────
    const exerciseRows = lastSync
      ? await neon.select().from(exercises).where(gte(exercises.updatedAt, lastSync))
      : await neon.select().from(exercises);
    for (const row of exerciseRows) {
      await upsertLocalExercise({
        id: row.id,
        userId: row.userId,
        name: row.name,
        measurementType: row.measurementType,
        unit: row.unit,
        trackBodyweight: row.trackBodyweight,
        notes: row.notes,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      });
      counts.exercises++;
    }

    // ── exercise_logs ──────────────────────────────────────────────────────
    const logRows = lastSync
      ? await neon.select().from(exerciseLogs).where(gte(exerciseLogs.createdAt, lastSync))
      : await neon.select().from(exerciseLogs);
    for (const row of logRows) {
      await upsertLocalExerciseLog({
        id: row.id,
        userId: row.userId,
        exerciseId: row.exerciseId,
        value: Number(row.value),
        bodyweightKg: row.bodyweightKg ? Number(row.bodyweightKg) : null,
        note: row.note,
        performedAt: row.performedAt,
        createdAt: row.createdAt,
      });
      counts.exercise_logs++;
    }

    // ── bodyweight_entries ─────────────────────────────────────────────────
    const bwRows = lastSync
      ? await neon.select().from(bodyweightEntries).where(gte(bodyweightEntries.createdAt, lastSync))
      : await neon.select().from(bodyweightEntries);
    for (const row of bwRows) {
      await upsertLocalBodyweightEntry({
        id: row.id,
        userId: row.userId,
        weightKg: Number(row.weightKg),
        recordedAt: row.recordedAt,
        createdAt: row.createdAt,
      });
      counts.bodyweight_entries++;
    }

    await setLastReconcileTime(new Date());
  } catch (err) {
    errors.push(String(err));
    console.error("[local-sync] reconcileFromNeon error:", err);
  }

  return {
    direction: "pull",
    tables: counts,
    durationMs: Date.now() - start,
    errors,
  };
}

// ── Bulk upsert for performance ───────────────────────────────────────────────

/**
 * Fast bulk upsert for exercise_logs — used during reconcile when there are
 * many rows. Batches into transactions of 500 using raw SQL for speed.
 */
export async function bulkUpsertExerciseLogs(
  logs: Array<{
    id: string;
    userId: string;
    exerciseId: string;
    value: number;
    bodyweightKg: number | null;
    note: string | null;
    performedAt: Date;
    createdAt: Date;
  }>,
) {
  let total = 0;
  const BATCH = 500;

  for (let i = 0; i < logs.length; i += BATCH) {
    const batch = logs.slice(i, i + BATCH);
    const dbh = getLocalDbHandle();
    const placeholders = batch
      .map((_, idx) =>
        `($${idx * 8 + 1}, $${idx * 8 + 2}, $${idx * 8 + 3}, $${idx * 8 + 4}, $${idx * 8 + 5}, $${idx * 8 + 6}, $${idx * 8 + 7}, $${idx * 8 + 8})`
      )
      .join(", ");

    const values: (string | number | null)[] = batch.flatMap((log) => [
      log.id,
      log.userId,
      log.exerciseId,
      log.value,
      log.bodyweightKg,
      log.note,
      Math.floor(log.performedAt.getTime() / 1000),
      Math.floor(log.createdAt.getTime() / 1000),
    ]);

    try {
      dbh.prepare(
        `INSERT INTO exercise_logs (id, user_id, exercise_id, value, bodyweight_kg, note, performed_at, created_at)
         VALUES ${placeholders}
         ON CONFLICT(id) DO UPDATE SET
           value=excluded.value,
           bodyweight_kg=excluded.bodyweight_kg,
           note=excluded.note,
           performed_at=excluded.performed_at`,
      ).run(...values);
      total += batch.length;
    } catch (err) {
      console.error(`[local-sync] bulkUpsertExerciseLogs batch ${i}-${i + BATCH} failed:`, err);
    }
  }

  return total;
}

// ── Legacy alias ─────────────────────────────────────────────────────────────
export { reconcileFromNeon as reconcile };