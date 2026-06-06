/**
 * POST /api/v1/sync — Trigger full reconcile from Neon → local SQLite
 * GET  /api/v1/sync — Return sync status (no auth required)
 */

import { NextResponse } from "next/server";

import { reconcileFromNeonWithOptions } from "@/lib/db";
import { getSyncRequestActor } from "@/lib/token-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const actor = await getSyncRequestActor(request.headers, {
    exercises: ["write"],
  });

  if (!actor) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const forceFull = url.searchParams.get("force") === "true";

  const result = await reconcileFromNeonWithOptions({ full: forceFull });

  return NextResponse.json(
    {
      ok: result.errors.length === 0,
      forceFull,
      ...result,
    },
    { status: result.errors.length > 0 ? 207 : 200 },
  );
}

export async function GET() {
  return NextResponse.json({
    message: "Use POST to trigger reconcile, GET /download to fetch the file",
  });
}
