/**
 * Local SQLite database backed by better-sqlite3.
 * Database file lives at LOCAL_DB_PATH (defaults to OneDrive path).
 *
 * Uses better-sqlite3 synchronously for reliability — the file is the
 * backup, not the primary datastore, so blocking I/O on writes is acceptable.
 */

import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { join, dirname } from "path";
import { existsSync, mkdirSync, readFileSync, rmSync } from "fs";
import { randomUUID } from "crypto";
import { tmpdir } from "os";

import * as schema from "./schema";

let _localDb: ReturnType<typeof drizzle<typeof schema>> | null = null;
let _sqliteHandle: Database.Database | null = null;

/** Resolve the local DB file path, with sensible default. */
export function resolveLocalDbPath(): string {
  if (process.env.LOCAL_DB_PATH) {
    return process.env.LOCAL_DB_PATH;
  }
  // OneDrive default: same folder hierarchy as shw-michael and financial
  const home = process.env.HOME ?? "/Users/mike";
  return join(
    home,
    "Library/CloudStorage/OneDrive-Personal/AI/shw-michael/FitnessTracker",
    "fitness-local.db",
  );
}

/** Lazily initialise (or return cached) SQLite connection. */
export function getLocalDb() {
  if (_localDb) return _localDb;

  const dbPath = resolveLocalDbPath();

  // Ensure the parent directory exists
  const dir = dirname(dbPath);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }

  // better-sqlite3: open in WAL mode for safer concurrent access
  _sqliteHandle = new Database(dbPath);
  _sqliteHandle.pragma("journal_mode = WAL");
  _sqliteHandle.pragma("foreign_keys = ON");

  _localDb = drizzle(_sqliteHandle, { schema });

  // Run schema migrations on first open
  initLocalSchema(_sqliteHandle);

  return _localDb;
}

/** Get the raw better-sqlite3 handle (for raw SQL access). */
export function getLocalDbHandle(): Database.Database {
  if (!_sqliteHandle) {
    getLocalDb();
  }
  if (!_sqliteHandle) {
    throw new Error("Local SQLite database was not initialized.");
  }
  return _sqliteHandle;
}

function initLocalSchema(db: Database.Database) {
  // Create tables if they don't exist (idempotent)
  // Matches the schema defined in ./schema.ts
  db.exec(`
    CREATE TABLE IF NOT EXISTS user_profiles (
      user_id        TEXT PRIMARY KEY,
      display_name   TEXT,
      current_bodyweight_kg REAL,
      timezone       TEXT,
      created_at     INTEGER NOT NULL DEFAULT (unixepoch()),
      updated_at     INTEGER NOT NULL DEFAULT (unixepoch())
    );

    CREATE TABLE IF NOT EXISTS exercises (
      id               TEXT PRIMARY KEY,
      user_id          TEXT NOT NULL,
      name             TEXT NOT NULL,
      measurement_type TEXT NOT NULL,
      unit             TEXT NOT NULL,
      track_bodyweight INTEGER NOT NULL DEFAULT 0,
      notes            TEXT,
      created_at       INTEGER NOT NULL DEFAULT (unixepoch()),
      updated_at       INTEGER NOT NULL DEFAULT (unixepoch())
    );

    CREATE TABLE IF NOT EXISTS exercise_logs (
      id            TEXT PRIMARY KEY,
      user_id       TEXT NOT NULL,
      exercise_id   TEXT NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
      value         REAL NOT NULL,
      bodyweight_kg REAL,
      note          TEXT,
      performed_at  INTEGER NOT NULL DEFAULT (unixepoch()),
      created_at    INTEGER NOT NULL DEFAULT (unixepoch())
    );

    CREATE TABLE IF NOT EXISTS bodyweight_entries (
      id          TEXT PRIMARY KEY,
      user_id     TEXT NOT NULL,
      weight_kg   REAL NOT NULL,
      recorded_at INTEGER NOT NULL DEFAULT (unixepoch()),
      created_at  INTEGER NOT NULL DEFAULT (unixepoch())
    );

    CREATE TABLE IF NOT EXISTS sync_meta (
      key         TEXT PRIMARY KEY,
      value       TEXT NOT NULL,
      updated_at  INTEGER NOT NULL DEFAULT (unixepoch())
    );

    CREATE INDEX IF NOT EXISTS idx_exercise_logs_user_performed
      ON exercise_logs(user_id, performed_at);
    CREATE INDEX IF NOT EXISTS idx_exercise_logs_exercise_performed
      ON exercise_logs(exercise_id, performed_at);
    CREATE INDEX IF NOT EXISTS idx_exercises_user_name
      ON exercises(user_id, name);
    CREATE INDEX IF NOT EXISTS idx_bodyweight_entries_user_recorded
      ON bodyweight_entries(user_id, recorded_at);
  `);
}

/** Graceful close — call during dev server shutdown if needed. */
export function closeLocalDb() {
  _sqliteHandle?.close();
  _sqliteHandle = null;
  _localDb = null;
}

export async function createUserScopedLocalDbSnapshot(userId: string): Promise<Buffer> {
  const source = getLocalDbHandle();
  source.pragma("wal_checkpoint(FULL)");

  const tempPath = join(tmpdir(), `fitness-local-user-${randomUUID()}.db`);
  await source.backup(tempPath);

  const scoped = new Database(tempPath);
  try {
    scoped.pragma("foreign_keys = ON");
    scoped.transaction(() => {
      scoped.prepare("DELETE FROM exercise_logs WHERE user_id <> ?").run(userId);
      scoped.prepare("DELETE FROM bodyweight_entries WHERE user_id <> ?").run(userId);
      scoped.prepare("DELETE FROM exercises WHERE user_id <> ?").run(userId);
      scoped.prepare("DELETE FROM user_profiles WHERE user_id <> ?").run(userId);
      scoped.prepare("DELETE FROM sync_meta").run();
    })();
    scoped.exec("VACUUM");
  } finally {
    scoped.close();
  }

  try {
    return readFileSync(tempPath);
  } finally {
    rmSync(tempPath, { force: true });
  }
}

export async function createFullLocalDbSnapshot(): Promise<Buffer> {
  const source = getLocalDbHandle();
  source.pragma("wal_checkpoint(FULL)");

  const tempPath = join(tmpdir(), `fitness-local-full-${randomUUID()}.db`);
  await source.backup(tempPath);

  try {
    return readFileSync(tempPath);
  } finally {
    rmSync(tempPath, { force: true });
  }
}
