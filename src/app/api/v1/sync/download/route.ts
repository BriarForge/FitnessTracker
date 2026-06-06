/**
 * GET /api/v1/sync/download
 *
 * Download the current local SQLite backup file.
 * Requires a valid API token with "write" scope.
 *
 * Usage in cron job:
 *   curl -H "Authorization: Bearer <token> \
 *        https://fitness.delpach.com/api/v1/sync/download \
 *        -o fitness-local.db
 */

import { createReadStream } from "fs";
import { statSync } from "fs";
import { join } from "path";

import { NextResponse } from "next/server";

import { resolveLocalDbPath } from "@/lib/db";
import { getRequestActor } from "@/lib/token-auth";

export async function GET(request: Request) {
  const actor = await getRequestActor(request.headers, {
    exercises: ["write"],
  });

  if (!actor) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const dbPath = resolveLocalDbPath();

  try {
    const stats = statSync(dbPath);
    const fileName = join(dbPath).split("/").pop() ?? "fitness-local.db";
    const stream = createReadStream(dbPath);

    return new Response(stream as unknown as ReadableStream, {
      headers: {
        "Content-Type": "application/vnd.sqlite3",
        "Content-Disposition": `attachment; filename="${fileName}"`,
        "Content-Length": String(stats.size),
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") {
      return Response.json(
        { error: "Local DB not found. Run POST /api/v1/sync first." },
        { status: 404 },
      );
    }
    throw err;
  }
}
