# Changelog

This document tracks notable version history for Fitness Tracker.

## Unreleased

### Added

- `DELETE /api/v1/exercises/{id}` endpoint, gated on the same `exercises:write` permission used for create. Returns 204 on success, 404 when the id is not owned by the caller, 400 on a malformed id. Cascades to child log entries via the existing schema.

### Changed

- `POST /api/v1/exercises` and `POST /api/v1/logs` now validate the request body with explicit Zod schemas and return structured error envelopes (`400` for invalid input, `409` for unique-violation, `404` for missing exercise, `500` with detail for everything else) instead of opaque empty-body failures.
- Unique-violation detection inspects both `err.code` and `err.cause.code` so the Neon serverless driver's nested error shape is recognised.

### Notes

- Clarified repository instructions for source-aware agents so self-improvement is the default operating mode when agents have both repository access and a valid user token.

## 0.1.0 - 2026-06-06

### Added

- Initial Next.js 16 application scaffold with TypeScript, Tailwind, ESLint, and Drizzle tooling.
- Better Auth integration with passkeys, magic-link sign-in, and per-user API key support for agents.
- Neon Postgres schema and append-only exercise logging for reps, weight, distance, duration, and bodyweight.
- Dashboard, exercise detail, settings, passkey management, and token management UI.
- Agent-facing API surface including `/api/openapi` and `/api/v1/*` endpoints for profile, exercises, logs, and progress.

### Changed

- Configured Vercel to build and route the application as a Next.js project in production.
