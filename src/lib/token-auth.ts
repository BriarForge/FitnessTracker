import { auth } from "@/lib/auth";

type PermissionStatement = Record<string, string[]>;

export type RequestActor =
  | {
      kind: "api-key";
      userId: string;
      keyId: string;
    }
  | {
      kind: "session";
      userId: string;
    };

function readApiKey(requestHeaders: Headers) {
  const authorization = requestHeaders.get("authorization");

  if (authorization?.startsWith("Bearer ")) {
    return authorization.slice("Bearer ".length).trim();
  }

  return requestHeaders.get("x-api-key");
}

export async function getRequestActor(
  requestHeaders: Headers,
  permissions?: PermissionStatement,
): Promise<RequestActor | null> {
  const key = readApiKey(requestHeaders);

  if (key) {
    const result = await auth.api.verifyApiKey({
      body: {
        key,
        permissions,
      },
    });

    if (!result.valid || !result.key) {
      return null;
    }

    return {
      kind: "api-key",
      userId: result.key.referenceId,
      keyId: result.key.id,
    };
  }

  const session = await auth.api.getSession({
    headers: requestHeaders,
  });

  if (!session) {
    return null;
  }

  return {
    kind: "session",
    userId: session.user.id,
  };
}
