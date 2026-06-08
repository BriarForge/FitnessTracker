import { deleteExerciseLog } from "@/lib/fitness";
import { getRequestActor } from "@/lib/token-auth";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const actor = await getRequestActor(request.headers, {
    exercises: ["write"],
  });

  if (!actor) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const result = await deleteExerciseLog(actor.userId, id);
    return Response.json(result, { status: 200 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    if (message.includes("not found")) {
      return Response.json({ error: message }, { status: 404 });
    }
    return Response.json(
      { error: "Internal error", detail: message },
      { status: 500 },
    );
  }
}
