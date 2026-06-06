import { z } from "zod";

import { createExercise, listExercisesForUser } from "@/lib/fitness";
import { getRequestActor } from "@/lib/token-auth";

export async function GET(request: Request) {
  const actor = await getRequestActor(request.headers, {
    exercises: ["read"],
  });

  if (!actor) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const exercises = await listExercisesForUser(actor.userId);
  return Response.json({ exercises });
}

const exerciseBodySchema = z.object({
  name: z.string().trim().min(2).max(80),
  measurementType: z.enum(["reps", "distance", "duration", "weight"]),
  unit: z.string().trim().min(1).max(16),
  trackBodyweight: z.boolean().default(false),
  notes: z.string().trim().max(280).optional(),
});

function isUniqueViolation(err: unknown) {
  if (!(err instanceof Error)) return false;
  const message = err.message;
  return (
    message.includes("23505") ||
    message.toLowerCase().includes("unique constraint")
  );
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

  const parsed = exerciseBodySchema.safeParse(rawBody);
  if (!parsed.success) {
    return Response.json(
      { error: "Invalid exercise", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  try {
    const exercise = await createExercise(actor.userId, parsed.data);
    return Response.json({ exercise }, { status: 201 });
  } catch (err) {
    if (isUniqueViolation(err)) {
      return Response.json(
        { error: "An exercise with that name already exists" },
        { status: 409 },
      );
    }
    const message = err instanceof Error ? err.message : "Unknown error";
    return Response.json(
      { error: "Internal error", detail: message },
      { status: 500 },
    );
  }
}
