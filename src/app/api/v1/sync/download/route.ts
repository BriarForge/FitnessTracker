/**
 * GET /api/v1/sync/download
 *
 * Download a user-scoped SQLite snapshot from the current local backup file.
 * Requires a valid API token with "write" scope.
 *
 * Usage in cron job:
 *   curl -H "Authorization: Bearer <token> \
 *        https://fitness.delpach.com/api/v1/sync/download \
 *        -o fitness-local.db
 */

import {
  createFullLocalDbSnapshot,
  createUserScopedLocalDbSnapshot,
} from "@/lib/db";
import { getSyncRequestActor } from "@/lib/token-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const actor = await getSyncRequestActor(request.headers, {
    exercises: ["write"],
  });

  if (!actor) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (process.env.VERCEL === "1") {
    return Response.json(
      {
        error:
          "Local SQLite download is disabled on Vercel serverless. Run the backup job from a durable local agent environment.",
      },
      { status: 501 },
    );
  }

  try {
    const snapshot =
      actor.kind === "static-key"
        ? await createFullLocalDbSnapshot()
        : await createUserScopedLocalDbSnapshot(actor.userId);
    const body = new ArrayBuffer(snapshot.byteLength);
    new Uint8Array(body).set(snapshot);

    return new Response(body, {
      headers: {
        "Content-Type": "application/vnd.sqlite3",
        "Content-Disposition": `attachment; filename="fitness-local.db"`,
        "Content-Length": String(snapshot.byteLength),
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
