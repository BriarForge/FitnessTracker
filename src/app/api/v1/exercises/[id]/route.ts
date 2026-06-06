import { getExerciseForUser } from "@/lib/fitness";
import { getDb } from "@/lib/db";
import { exercises } from "@/lib/db/app-schema";
import { getRequestActor } from "@/lib/token-auth";
import { and, eq } from "drizzle-orm";

type RouteContext = {
  params: Promise<{ id: string }>;
};

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    value,
  );
}

export async function DELETE(request: Request, context: RouteContext) {
  const actor = await getRequestActor(request.headers, {
    exercises: ["write"],
  });

  if (!actor) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;

  if (!isUuid(id)) {
    return Response.json({ error: "Invalid exercise id" }, { status: 400 });
  }

  const exercise = await getExerciseForUser(actor.userId, id);
  if (!exercise) {
    return Response.json({ error: "Exercise not found" }, { status: 404 });
  }

  try {
    await getDb().delete(exercises).where(
      and(eq(exercises.id, id), eq(exercises.userId, actor.userId)),
    );
    return new Response(null, { status: 204 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return Response.json(
      { error: "Internal error", detail: message },
      { status: 500 },
    );
  }
}
