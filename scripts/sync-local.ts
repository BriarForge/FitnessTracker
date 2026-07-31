/**
 * sync-local.ts — Durable local sync from Neon PostgreSQL to local SQLite.
 *
 * Runs as a standalone Node process (not inside Next.js/serverless).
 * Called by: npm run sync:local
 * Cron: fitness-tracker skill, daily at 02:00 Perth.
 *
 * Usage:
 *   npm run sync:local           — incremental sync (changed since last run)
 *   npm run sync:local -- --full — full reconcile
 *
 * Pitfalls:
 *   - OneDrive can leave stale *-wal/*-shm that wedge better-sqlite3 with
 *     "disk I/O error". We clear a zero-byte WAL pair before opening.
 *   - getLocalDb() falls back to a silent no-op proxy on open failure.
 *     This script MUST fail loudly if that happens — never report success
 *     with 0 rows while Neon still has data.
 */

import { config } from "dotenv";
config({ path: ".env.local" });
import { existsSync, statSync, unlinkSync } from "fs";
import {
  getLocalDbHandle,
  isServerless,
  resolveLocalDbPath,
} from "../src/lib/db/local-index";
import { reconcileFromNeonWithOptions } from "../src/lib/db/sync";
import { getDb } from "../src/lib/db/index";
import {
  bodyweightEntries,
  exerciseLogs,
  exercises,
  userProfiles,
} from "../src/lib/db/app-schema";

const isFull = process.argv.includes("--full");

/** Clear a wedged OneDrive WAL pair (empty WAL + SHM) before opening. */
function clearStaleWalArtifacts(dbPath: string): void {
  const wal = `${dbPath}-wal`;
  const shm = `${dbPath}-shm`;
  try {
    if (existsSync(wal) && existsSync(shm)) {
      const walSize = statSync(wal).size;
      // Zero-byte WAL with SHM present is the classic OneDrive wedge.
      if (walSize === 0) {
        unlinkSync(wal);
        unlinkSync(shm);
        console.warn(
          `[sync-local] Cleared stale zero-byte WAL/SHM at ${dbPath} (OneDrive I/O wedge).`,
        );
      }
    }
  } catch (err) {
    console.warn(
      `[sync-local] Could not clear WAL artifacts: ${err instanceof Error ? err.message : String(err)}`,
    );
  }
}

console.log(`[sync-local] Starting ${isFull ? "FULL" : "incremental"} reconcile...`);

(async () => {
  const dbPath = resolveLocalDbPath();
  console.log(`[sync-local] LOCAL_DB_PATH=${dbPath}`);
  clearStaleWalArtifacts(dbPath);

  // Force real SQLite open before reconcile. Fail if no-op fallback engaged.
  try {
    getLocalDbHandle();
  } catch (err) {
    console.error(
      `[sync-local] FAILED — local SQLite unavailable: ${err instanceof Error ? err.message : String(err)}`,
    );
    process.exit(1);
  }
  if (isServerless()) {
    console.error(
      "[sync-local] FAILED — better-sqlite3 fell into serverless/no-op mode. Local mirror not writable.",
    );
    process.exit(1);
  }

  const result = await reconcileFromNeonWithOptions({ full: isFull });

  const { user_profiles, exercises: exCount, exercise_logs, bodyweight_entries } =
    result.tables;
  const total = user_profiles + exCount + exercise_logs + bodyweight_entries;

  console.log(`[sync-local] Done in ${result.durationMs}ms`);
  console.log(`  user_profiles:    ${user_profiles}`);
  console.log(`  exercises:        ${exCount}`);
  console.log(`  exercise_logs:    ${exercise_logs}`);
  console.log(`  bodyweight_entries: ${bodyweight_entries}`);
  console.log(`  TOTAL rows:       ${total}`);

  if (result.errors.length > 0) {
    console.error("[sync-local] Errors encountered:");
    for (const err of result.errors) {
      console.error(`  - ${err}`);
    }
    process.exit(1);
  }

  // Sanity: mirror file must exist and be non-empty after a successful sync.
  try {
    const st = statSync(dbPath);
    if (st.size === 0) {
      console.error(`[sync-local] FAILED — DB file is 0 bytes at ${dbPath}`);
      process.exit(1);
    }
    console.log(`[sync-local] Mirror OK: ${dbPath} (${st.size} bytes)`);
  } catch (err) {
    console.error(
      `[sync-local] FAILED — cannot stat mirror: ${err instanceof Error ? err.message : String(err)}`,
    );
    process.exit(1);
  }

  // Sanity: if Neon has rows but local tables are empty, the no-op proxy
  // (or a broken open) swallowed the write. Fail the cron.
  try {
    const neon = getDb();
    const handle = getLocalDbHandle();
    const neonTotal =
      (await neon.select().from(userProfiles)).length +
      (await neon.select().from(exercises)).length +
      (await neon.select().from(exerciseLogs)).length +
      (await neon.select().from(bodyweightEntries)).length;
    const localTotal =
      (handle.prepare("SELECT COUNT(*) AS c FROM user_profiles").get() as { c: number }).c +
      (handle.prepare("SELECT COUNT(*) AS c FROM exercises").get() as { c: number }).c +
      (handle.prepare("SELECT COUNT(*) AS c FROM exercise_logs").get() as { c: number }).c +
      (handle.prepare("SELECT COUNT(*) AS c FROM bodyweight_entries").get() as { c: number }).c;

    console.log(`[sync-local] Post-check Neon=${neonTotal} local=${localTotal}`);

    if (neonTotal > 0 && localTotal === 0) {
      console.error(
        "[sync-local] FAILED — Neon has data but local mirror is empty (likely no-op DB or I/O wedge).",
      );
      process.exit(1);
    }
  } catch (err) {
    console.error(
      `[sync-local] FAILED — post-sync verification error: ${err instanceof Error ? err.message : String(err)}`,
    );
    process.exit(1);
  }

  console.log("[sync-local] Sync completed successfully.");
})().catch((err) => {
  console.error(
    `[sync-local] FAILED — unhandled: ${err instanceof Error ? err.message : String(err)}`,
  );
  process.exit(1);
});
