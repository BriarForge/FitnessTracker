/**
 * POST /api/v1/sync — Trigger full reconcile from Neon → local SQLite
 * GET  /api/v1/sync — Return sync status (no auth required)
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
    { status: result.errors.length > 0 ? 207 : 200 },
  );
}

export async function GET() {
  const dbPath = resolveLocalDbPath();

  return NextResponse.json({
    localDbPath: dbPath,
    message: "Use POST to trigger reconcile, GET /download to fetch the file",
  });
}
