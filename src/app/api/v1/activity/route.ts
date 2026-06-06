import { getDayBreakdown, getWeeklyActivity } from "@/lib/fitness";
import { getRequestActor } from "@/lib/token-auth";
import { z } from "zod";

const querySchema = z.object({
  weeks: z.coerce.number().int().min(1).max(52).optional(),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Expected YYYY-MM-DD")
    .optional(),
  timezone: z.string().min(1).max(64).optional(),
});

export async function GET(request: Request) {
  const actor = await getRequestActor(request.headers, {
    progress: ["read"],
  });

  if (!actor) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const parsed = querySchema.safeParse({
    weeks: url.searchParams.get("weeks") ?? undefined,
    date: url.searchParams.get("date") ?? undefined,
    timezone: url.searchParams.get("timezone") ?? undefined,
  });

  if (!parsed.success) {
    return Response.json(
      { error: "Invalid query", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  try {
    if (parsed.data.date) {
      const breakdown = await getDayBreakdown(
        actor.userId,
        parsed.data.date,
        parsed.data.timezone,
      );
      return Response.json(breakdown);
    }
    const activity = await getWeeklyActivity(
      actor.userId,
      parsed.data.weeks ?? 12,
      parsed.data.timezone,
    );
    return Response.json(activity);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return Response.json(
      { error: "Internal error", detail: message },
      { status: 500 },
    );
  }
}
