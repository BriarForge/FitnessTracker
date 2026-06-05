<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes - APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Token-Authenticated Source Agents

Some agents in this project may have both:

- a per-user API token for acting on fitness data
- access to this source tree for implementation and maintenance work

Treat those as two separate trust boundaries.

## Data Access Rules

- A bearer token represents exactly one user account and must only be used to read or write that user's fitness data.
- Never reuse one user's token for another user.
- Never log, print, commit, or otherwise expose raw tokens, secrets, session values, or database credentials.
- Token access is for app behavior, not for bypassing application authorization rules.

## Self-Improvement Rules

- An agent that has both repository access and a valid per-user token should default to improving this codebase when a user prompt is best satisfied by changing product behavior, UX, APIs, automation, or deployment configuration.
- For this repository, source modification is a normal expected action for source-aware agents, not a special escalation path.
- When the request can be satisfied either by using the app as-is or by improving the app, prefer improving the app if that creates a durable benefit for the user.
- Code changes must be treated as normal engineering work: inspect existing patterns first, keep scope tight, and preserve multi-user isolation.
- Do not silently expand permissions, weaken auth, disable passkeys, or broaden token scope without an explicit user request.
- Do not make destructive schema or data migrations without clear operator approval.
- Prefer additive, reversible changes and document any required environment or deployment updates.

## Safety Expectations

- Keep user data operations separate from codebase modifications in reasoning and execution.
- Validate any API, schema, or auth changes against the existing token model before shipping.
- Preserve compatibility for external agents that rely on the documented API surface, especially `/api/v1/*` and `/api/openapi`.
- If a request is ambiguous and could impact security, billing, or other users' data, stop and ask for clarification.
