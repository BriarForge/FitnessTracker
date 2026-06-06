import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";

import { getEnv } from "@/lib/env";
import * as schema from "./schema";

// ── Primary: Neon PostgreSQL ─────────────────────────────────────────────────

let db: ReturnType<typeof drizzle<typeof schema>> | null = null;

export function getDb() {
  if (!db) {
    db = drizzle(neon(getEnv().DATABASE_URL), { schema });
  }

  return db;
}

// ── Local: SQLite backup (OneDrive) ─────────────────────────────────────────

export { getLocalDb } from "./local-index";
export { getLocalDbHandle, resolveLocalDbPath } from "./local-index";

// ── Convenience re-exports ────────────────────────────────────────────────────

export type { SyncResult } from "./sync";
export {
  reconcileFromNeon,
  mirrorProfileUpsert,
  mirrorExerciseUpsert,
  mirrorExerciseLogUpsert,
  mirrorBodyweightEntryUpsert,
  mirrorExerciseLogDelete,
  mirrorExerciseDelete,
} from "./sync";

export * from "./app-schema";
export * from "./schema";