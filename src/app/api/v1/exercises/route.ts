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

export async function POST(request: Request) {
  const actor = await getRequestActor(request.headers, {
    exercises: ["write"],
  });

  if (!actor) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as {
    name: string;
    measurementType: "reps" | "distance" | "duration" | "weight";
    unit: string;
    trackBodyweight?: boolean;
    notes?: string;
  };

  const exercise = await createExercise(actor.userId, {
    ...body,
    trackBodyweight: body.trackBodyweight ?? false,
  });
  return Response.json({ exercise }, { status: 201 });
}
