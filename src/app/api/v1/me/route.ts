import { getDb } from "@/lib/db";
import { userProfiles } from "@/lib/db/app-schema";
import { getRequestActor } from "@/lib/token-auth";
import { eq } from "drizzle-orm";

export async function GET(request: Request) {
  const actor = await getRequestActor(request.headers);

  if (!actor) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [profile] = await getDb()
    .select()
    .from(userProfiles)
    .where(eq(userProfiles.userId, actor.userId))
    .limit(1);

  return Response.json({
    actor,
    profile,
  });
}
