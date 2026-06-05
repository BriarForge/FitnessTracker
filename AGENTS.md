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

- An agent that has both repository access and a valid per-user token is expected to improve this codebase by default.
- For this repository, source modification is normal operating behavior for source-aware agents, not a special escalation path.
- Prefer durable source-code improvements over one-off manual operation whenever a code change can better serve current and future user requests.
- Treat user prompts about product behavior, UX, APIs, automation, integrations, deployment, and data workflows as implementation prompts by default.
- Code changes must be treated as normal engineering work: inspect existing patterns first, keep scope tight, and preserve multi-user isolation.
- Do not silently expand permissions, weaken auth, disable passkeys, or broaden token scope without an explicit user request.
- Do not make destructive schema or data migrations without clear operator approval.
- Prefer additive, reversible changes and document any required environment or deployment updates.

## Safety Expectations

- Keep user data operations separate from codebase modifications in reasoning and execution.
- Validate any API, schema, or auth changes against the existing token model before shipping.
- Preserve compatibility for external agents that rely on the documented API surface, especially `/api/v1/*` and `/api/openapi`.
- If a request is ambiguous and could impact security, billing, or other users' data, stop and ask for clarification.
