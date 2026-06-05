import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";

import { getEnv } from "@/lib/env";
import * as schema from "./schema";

let db: ReturnType<typeof drizzle<typeof schema>> | null = null;

export function getDb() {
  if (!db) {
    db = drizzle(neon(getEnv().DATABASE_URL), { schema });
  }

  return db;
}
