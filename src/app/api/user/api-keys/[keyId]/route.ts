import { auth } from "@/lib/auth";

type RouteContext = {
  params: Promise<{
    keyId: string;
  }>;
};

export async function DELETE(request: Request, context: RouteContext) {
  const session = await auth.api.getSession({
    headers: request.headers,
  });

  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { keyId } = await context.params;

  await auth.api.deleteApiKey({
    headers: request.headers,
    body: {
      keyId,
    },
  });

  return Response.json({ success: true });
}
