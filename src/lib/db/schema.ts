/**
 * SQLite schema for local backup using better-sqlite3 + drizzle-orm.
 * Table shapes mirror src/lib/db/app-schema.ts and auth-schema.ts so the
 * local SQLite file stays in sync with the Neon PostgreSQL primary.
 *
 * Only the fitness app tables are mirrored (user_profiles, exercises,
 * exercise_logs, bodyweight_entries). Auth tables (user, session, account,
 * passkey, apikey, verification) are server-side only and not stored locally.
 */

import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";

// ── Fitness app tables ───────────────────────────────────────────────────────

export const sqliteUserProfiles = sqliteTable("user_profiles", {
  userId: text("user_id").primaryKey(),
  displayName: text("display_name"),
  currentBodyweightKg: real("current_bodyweight_kg"),
  timezone: text("timezone"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const sqliteExercises = sqliteTable("exercises", {
  id: text("id").primaryKey(), // UUID stored as text
  userId: text("user_id").notNull(),
  name: text("name").notNull(),
  measurementType: text("measurement_type").notNull(), // reps | distance | duration | weight
  unit: text("unit").notNull(),
  trackBodyweight: integer("track_bodyweight", { mode: "boolean" })
    .default(false)
    .notNull(),
  notes: text("notes"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const sqliteExerciseLogs = sqliteTable("exercise_logs", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  exerciseId: text("exercise_id")
    .notNull()
    .references(() => sqliteExercises.id, { onDelete: "cascade" }),
  value: real("value").notNull(),
  bodyweightKg: real("bodyweight_kg"),
  note: text("note"),
  performedAt: integer("performed_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const sqliteBodyweightEntries = sqliteTable("bodyweight_entries", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  weightKg: real("weight_kg").notNull(),
  recordedAt: integer("recorded_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

// ── Sync tracking ─────────────────────────────────────────────────────────────

export const sqliteSyncMeta = sqliteTable(
  "sync_meta",
  {
    key: text("key").primaryKey(),
    value: text("value").notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
);

// ── Types ─────────────────────────────────────────────────────────────────────

export type SqliteUserProfile = typeof sqliteUserProfiles.$inferSelect;
export type SqliteExercise = typeof sqliteExercises.$inferSelect;
export type SqliteExerciseLog = typeof sqliteExerciseLogs.$inferSelect;
export type SqliteBodyweightEntry = typeof sqliteBodyweightEntries.$inferSelect;
export type SqliteSyncMetaRow = typeof sqliteSyncMeta.$inferSelect;
