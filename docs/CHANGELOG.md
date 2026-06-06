# Changelog

This document tracks notable version history for Fitness Tracker.

## Unreleased

### Changed

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
