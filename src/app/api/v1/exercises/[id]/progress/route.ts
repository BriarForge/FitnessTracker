import { getExerciseProgress } from "@/lib/fitness";
import { getRequestActor } from "@/lib/token-auth";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(request: Request, context: RouteContext) {
  const actor = await getRequestActor(request.headers, {
    progress: ["read"],
  });

  if (!actor) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const progress = await getExerciseProgress(actor.userId, id);

  if (!progress) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  return Response.json(progress);
}
