import { auth } from "@/lib/auth";

type Scope = "read" | "write";

function permissionsForScope(scope: Scope) {
  if (scope === "read") {
    return {
      exercises: ["read"],
      progress: ["read"],
      profile: ["read"],
      bodyweight: ["read"],
    };
  }

  return {
    exercises: ["read", "write"],
    progress: ["read"],
    profile: ["read"],
    bodyweight: ["read", "write"],
  };
}

export async function GET(request: Request) {
  const session = await auth.api.getSession({
    headers: request.headers,
  });

  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await auth.api.listApiKeys({
    headers: request.headers,
  });

  return Response.json({
    apiKeys: result.apiKeys,
  });
}

export async function POST(request: Request) {
  const session = await auth.api.getSession({
    headers: request.headers,
  });

  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as {
    name?: string;
    scope?: Scope;
  };

  const result = await auth.api.createApiKey({
    body: {
      userId: session.user.id,
      name: body.name || "Agent token",
      permissions: permissionsForScope(body.scope === "read" ? "read" : "write"),
    },
  });

  return Response.json(
    {
      id: result.id,
      key: result.key,
    },
    { status: 201 },
  );
}
