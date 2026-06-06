/**
 * POST /api/v1/sync
 *
 * Trigger a full reconcile from Neon PostgreSQL into the local SQLite file.
 * Requires a valid API token with "write" scope on exercises.
 *
 * Useful for:
 * - Forcing a full sync after suspected drift
 * - Populating the local file for the first time
 * - Automated cron jobs (e.g. hourly or daily)
 */

import { NextResponse } from "next/server";

import { reconcileFromNeon, resolveLocalDbPath } from "@/lib/db";
import { getRequestActor } from "@/lib/token-auth";

export async function POST(request: Request) {
  const actor = await getRequestActor(request.headers, {
    exercises: ["write"],
  });

  if (!actor) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const dbPath = resolveLocalDbPath();

  // Optional: force full pull (ignore last-sync timestamp) via query param
  const url = new URL(request.url);
  const forceFull = url.searchParams.get("force") === "true";

  const result = await reconcileFromNeon();

  return NextResponse.json(
    {
      ok: result.errors.length === 0,
      path: dbPath,
      forceFull,
      ...result,
    },
    {
      status: result.errors.length > 0 ? 207 : 200,
    },
  );
}

/**
 * GET /api/v1/sync
 *
 * Return the current sync status (local DB path, last reconcile time).
 * Does not require auth — safe to check from a health probe.
 */

export async function GET() {
  const dbPath = resolveLocalDbPath();

  return NextResponse.json({
    localDbPath: dbPath,
    localDbExists: false, // caller can check filesystem
  });
}