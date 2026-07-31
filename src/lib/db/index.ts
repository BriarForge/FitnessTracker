import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";

import * as appSchema from "./app-schema";
import * as authSchema from "./auth-schema";

const schema = {
  ...appSchema,
  ...authSchema,
};

// ── Primary: Neon PostgreSQL ─────────────────────────────────────────────────

let db: ReturnType<typeof drizzle<typeof schema>> | null = null;

/**
 * Read DATABASE_URL directly from process.env without full Zod validation.
 * Used by local/cron scripts that only need DB access and don't need the
 * full app env (APP_BASE_URL, BETTER_AUTH_SECRET, etc.).
 */
export function getDatabaseUrl(): string {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is not set in process.env");
  }
  return url;
}

export function getDb() {
  if (!db) {
    db = drizzle(neon(getDatabaseUrl()), { schema });
  }

  return db;
}

// ── Local: SQLite backup (OneDrive) ─────────────────────────────────────────

export { getLocalDb, isServerless } from "./local-index";
export {
  createFullLocalDbSnapshot,
  createUserScopedLocalDbSnapshot,
  getLocalDbHandle,
  resolveLocalDbPath,
} from "./local-index";

// ── Convenience re-exports ────────────────────────────────────────────────────

export type { SyncResult } from "./sync";
export {
  reconcileFromNeon,
  reconcileFromNeonWithOptions,
  mirrorProfileUpsert,
  mirrorExerciseUpsert,
  mirrorExerciseLogUpsert,
  mirrorBodyweightEntryUpsert,
  mirrorExerciseLogDelete,
  mirrorExerciseDelete,
} from "./sync";

export * from "./app-schema";
export * from "./auth-schema";
export * from "./schema";
