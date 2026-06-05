import { getEnv } from "@/lib/env";

export async function GET() {
  const env = getEnv();

  return Response.json({
    openapi: "3.1.0",
    info: {
      title: "Fitness Tracker Agent API",
      version: "1.0.0",
      description:
        "Bearer-token API for exercises and progress. Tokens are created by each signed-in user in Settings.",
    },
    servers: [{ url: env.APP_BASE_URL }],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
        },
      },
    },
    security: [{ bearerAuth: [] }],
    paths: {
      "/api/v1/me": {
        get: {
          summary: "Inspect the current actor",
          responses: {
            200: { description: "Authenticated actor details" },
          },
        },
      },
      "/api/v1/exercises": {
        get: {
          summary: "List exercises for the current user",
          responses: {
            200: { description: "Exercise list" },
          },
        },
        post: {
          summary: "Create a new exercise",
          responses: {
            201: { description: "Exercise created" },
          },
        },
      },
      "/api/v1/logs": {
        post: {
          summary: "Append a log entry to an exercise",
          responses: {
            201: { description: "Log created" },
          },
        },
      },
      "/api/v1/exercises/{id}/progress": {
        get: {
          summary: "Get progress history for one exercise",
          parameters: [
            {
              in: "path",
              name: "id",
              required: true,
              schema: { type: "string" },
            },
          ],
          responses: {
            200: { description: "Exercise and progress history" },
          },
        },
      },
    },
  });
}
