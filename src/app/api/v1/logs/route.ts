import { addExerciseLog } from "@/lib/fitness";
import { getRequestActor } from "@/lib/token-auth";

export async function POST(request: Request) {
  const actor = await getRequestActor(request.headers, {
    exercises: ["write"],
  });

  if (!actor) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as {
    exerciseId: string;
    value: number;
    performedAt?: string;
    note?: string;
  };

  const log = await addExerciseLog(actor.userId, {
    exerciseId: body.exerciseId,
    value: body.value,
    performedAt: body.performedAt ? new Date(body.performedAt) : undefined,
    note: body.note,
  });

  return Response.json({ log }, { status: 201 });
}
