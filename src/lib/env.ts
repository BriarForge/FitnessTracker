import { z } from "zod";

const envSchema = z.object({
  APP_BASE_URL: z.url(),
  NEXT_PUBLIC_APP_BASE_URL: z.url().optional(),
  BETTER_AUTH_SECRET: z.string().min(32),
  DATABASE_URL: z.string().min(1),
  PASSKEY_RP_ID: z.string().min(1),
  RESEND_API_KEY: z.string().optional(),
  AUTH_FROM_EMAIL: z.string().optional(),
  FITNESS_TIMEZONE: z.string().optional(),
});

export type AppEnv = z.infer<typeof envSchema>;

let parsedEnv: AppEnv | null = null;

export function getEnv(): AppEnv {
  if (parsedEnv) {
    return parsedEnv;
  }

  parsedEnv = envSchema.parse(process.env);
  return parsedEnv;
}
