import { apiKeyClient } from "@better-auth/api-key/client";
import { passkeyClient } from "@better-auth/passkey/client";
import { createAuthClient } from "better-auth/react";
import { magicLinkClient } from "better-auth/client/plugins";

const baseURL = process.env.NEXT_PUBLIC_APP_BASE_URL;

export const authClient = createAuthClient({
  ...(baseURL ? { baseURL } : {}),
  plugins: [magicLinkClient(), passkeyClient(), apiKeyClient()],
});
