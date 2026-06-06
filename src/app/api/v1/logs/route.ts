import { z } from "zod";

import { addExerciseLog } from "@/lib/fitness";
import { getRequestActor } from "@/lib/token-auth";

const logBodySchema = z.object({
  exerciseId: z.uuid(),
  value: z.coerce.number().positive(),
  performedAt: z.string().datetime().optional(),
  note: z.string().trim().max(280).optional(),
});

function isExerciseNotFound(err: unknown) {
  return err instanceof Error && /exercise not found/i.test(err.message);
}

export async function POST(request: Request) {
  const actor = await getRequestActor(request.headers, {
    exercises: ["write"],
  });

  if (!actor) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = logBodySchema.safeParse(rawBody);
  if (!parsed.success) {
    return Response.json(
      { error: "Invalid log entry", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  try {
    const log = await addExerciseLog(actor.userId, {
      exerciseId: parsed.data.exerciseId,
      value: parsed.data.value,
      performedAt: parsed.data.performedAt
        ? new Date(parsed.data.performedAt)
        : undefined,
      note: parsed.data.note,
    });
    return Response.json({ log }, { status: 201 });
  } catch (err) {
    if (isExerciseNotFound(err)) {
      return Response.json({ error: "Exercise not found" }, { status: 404 });
    }
    const message = err instanceof Error ? err.message : "Unknown error";
    return Response.json(
      { error: "Internal error", detail: message },
      { status: 500 },
    );
  }
}
