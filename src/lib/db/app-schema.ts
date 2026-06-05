import {
  boolean,
  index,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

export const measurementTypeEnum = pgEnum("measurement_type", [
  "reps",
  "distance",
  "duration",
  "weight",
]);

export const userProfiles = pgTable("user_profiles", {
  userId: text("user_id").primaryKey(),
  displayName: text("display_name"),
  currentBodyweightKg: numeric("current_bodyweight_kg", {
    precision: 7,
    scale: 2,
    mode: "number",
  }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const bodyweightEntries = pgTable(
  "bodyweight_entries",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id").notNull(),
    weightKg: numeric("weight_kg", {
      precision: 7,
      scale: 2,
      mode: "number",
    }).notNull(),
    recordedAt: timestamp("recorded_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    userRecordedAtIdx: index("bodyweight_entries_user_recorded_at_idx").on(
      table.userId,
      table.recordedAt,
    ),
  }),
);

export const exercises = pgTable(
  "exercises",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id").notNull(),
    name: text("name").notNull(),
    measurementType: measurementTypeEnum("measurement_type").notNull(),
    unit: text("unit").notNull(),
    trackBodyweight: boolean("track_bodyweight").default(false).notNull(),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    userNameUnique: uniqueIndex("exercises_user_name_unique").on(
      table.userId,
      table.name,
    ),
    userCreatedAtIdx: index("exercises_user_created_at_idx").on(
      table.userId,
      table.createdAt,
    ),
  }),
);

export const exerciseLogs = pgTable(
  "exercise_logs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id").notNull(),
    exerciseId: uuid("exercise_id")
      .notNull()
      .references(() => exercises.id, { onDelete: "cascade" }),
    value: numeric("value", {
      precision: 10,
      scale: 2,
      mode: "number",
    }).notNull(),
    bodyweightKg: numeric("bodyweight_kg", {
      precision: 7,
      scale: 2,
      mode: "number",
    }),
    note: text("note"),
    performedAt: timestamp("performed_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    exercisePerformedIdx: index("exercise_logs_exercise_performed_idx").on(
      table.exerciseId,
      table.performedAt,
    ),
    userPerformedIdx: index("exercise_logs_user_performed_idx").on(
      table.userId,
      table.performedAt,
    ),
  }),
);
