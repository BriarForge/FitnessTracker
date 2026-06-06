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
 */

import { config } from "dotenv";
config({ path: ".env.local" });
import { reconcileFromNeonWithOptions } from "../src/lib/db/sync";

const isFull = process.argv.includes("--full");

console.log(`[sync-local] Starting ${isFull ? "FULL" : "incremental"} reconcile...`);

(async () => {
  const result = await reconcileFromNeonWithOptions({ full: isFull });

  const { user_profiles, exercises, exercise_logs, bodyweight_entries } = result.tables;
  const total = user_profiles + exercises + exercise_logs + bodyweight_entries;

  console.log(`[sync-local] Done in ${result.durationMs}ms`);
  console.log(`  user_profiles:    ${user_profiles}`);
  console.log(`  exercises:        ${exercises}`);
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

  console.log("[sync-local] Sync completed successfully.");
})();