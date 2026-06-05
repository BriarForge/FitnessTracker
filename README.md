# Fitness Tracker

Multi-user fitness tracking with:

- passkeys for normal sign-in
- magic-link recovery/bootstrap
- per-user agent tokens
- append-only exercise logs for reps, weight, duration, and distance
- a small bearer-auth API for OpenClaw, Hermes, or any other agent

## Stack

- `Next.js 16` App Router
- `Better Auth`
- `Neon Postgres`
- `Drizzle ORM`
- `Resend` for magic-link email delivery
- `Vercel` for deployment

## Local Setup

1. Copy `.env.example` to `.env.local`.
2. Fill in:
   - `DATABASE_URL`
   - `BETTER_AUTH_SECRET`
   - `APP_BASE_URL`
   - `NEXT_PUBLIC_APP_BASE_URL`
   - `PASSKEY_RP_ID`
   - `RESEND_API_KEY`
   - `AUTH_FROM_EMAIL`
3. Install dependencies:

```bash
npm install
```

4. Generate auth schema if it changes:

```bash
npm run auth:generate
```

5. Generate SQL migrations:

```bash
npm run db:generate
```

6. Apply migrations to the target database.
7. Start the app:

```bash
npm run dev
```

## Production Plan

### Vercel

- Create a Vercel project for this repo.
- Set the production domain to `fitness.delpach.com`.
- Prefer `syd1` as the execution region.

### Neon

- Provision a Neon Postgres database through the Vercel integration if available.
- Choose the closest APAC region offered by your Neon/Vercel setup.
- Add the Neon connection string as `DATABASE_URL`.

### Resend

- Verify a sending domain.
- Configure `AUTH_FROM_EMAIL` with that domain.
- Add `RESEND_API_KEY` to Vercel env vars.

### Better Auth

- Generate a strong `BETTER_AUTH_SECRET`.
- Set `APP_BASE_URL=https://fitness.delpach.com`
- Set `NEXT_PUBLIC_APP_BASE_URL=https://fitness.delpach.com`
- Set `PASSKEY_RP_ID=fitness.delpach.com`

## Verification

```bash
npm run lint
npm run typecheck
npm run build
```

## Agent API

OpenAPI document:

```text
/api/openapi
```

Bearer token endpoints:

- `GET /api/v1/me`
- `GET /api/v1/exercises`
- `POST /api/v1/exercises`
- `POST /api/v1/logs`
- `GET /api/v1/exercises/{id}/progress`

Example:

```bash
curl -X POST https://fitness.delpach.com/api/v1/logs \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "exerciseId": "YOUR_EXERCISE_ID",
    "value": 5,
    "note": "added by agent"
  }'
```

## Notes

- Magic-link email is required if you want recovery/bootstrap without passwords.
- Passkeys are per-user, not per-app, so this is already safe for your wife and friends to use with separate accounts.
- Tokens are created by each user under `/settings` and act only for that user.
