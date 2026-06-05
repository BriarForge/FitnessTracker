import { apiKey } from "@better-auth/api-key";
import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { passkey } from "@better-auth/passkey";
import { betterAuth } from "better-auth";
import { magicLink } from "better-auth/plugins";

import { getDb } from "@/lib/db";
import { sendMagicLinkEmail } from "@/lib/email";
import { getEnv } from "@/lib/env";

const env = getEnv();

export const auth = betterAuth({
  appName: "Fitness Tracker",
  baseURL: env.APP_BASE_URL,
  secret: env.BETTER_AUTH_SECRET,
  trustedOrigins: [env.APP_BASE_URL],
  database: drizzleAdapter(getDb(), {
    provider: "pg",
  }),
  plugins: [
    passkey({
      rpID: env.PASSKEY_RP_ID,
      rpName: "Fitness Tracker",
      origin: [env.APP_BASE_URL],
    }),
    magicLink({
      expiresIn: 60 * 15,
      storeToken: "hashed",
      sendMagicLink: async ({ email, url }) =>
        sendMagicLinkEmail({ email, url }),
    }),
    apiKey({
      defaultPrefix: "fit_",
      requireName: true,
      enableMetadata: true,
      keyExpiration: {
        defaultExpiresIn: 1000 * 60 * 60 * 24 * 90,
        minExpiresIn: 1,
        maxExpiresIn: 365,
      },
      permissions: {
        defaultPermissions: {
          exercises: ["read", "write"],
          progress: ["read"],
          profile: ["read"],
          bodyweight: ["read", "write"],
        },
      },
      rateLimit: {
        enabled: true,
        timeWindow: 1000 * 60 * 60 * 24,
        maxRequests: 5000,
      },
    }),
  ],
});
