# Sentry MCP — local setup

The Sentry MCP server gives Claude Code (in a future session) read/write access
to live Sentry issues, releases and projects via HTTP transport with OAuth.

The actual config lives in `.mcp.json` at the repo root, **which is gitignored**
because it also stores the Supabase DB connection string used by the Postgres
MCP. So this file documents what to add — never commit secrets.

## What to put in `.mcp.json`

Add the `Sentry` server alongside the existing `postgres` one:

```json
{
  "mcpServers": {
    "postgres": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-postgres",
        "postgresql://<USER>:<PASSWORD>@<HOST>/<DB>"
      ]
    },
    "Sentry": {
      "url": "https://mcp.sentry.dev/mcp"
    }
  }
}
```

That's it. No PAT, no auth header. Sentry MCP uses HTTP Streamable transport
with **OAuth device-code authentication** — first time a tool is invoked, you
get a browser prompt, you authorise, you pick which tool groups to expose.

## How to activate it

1. Quit the current Claude Code session.
2. Re-launch `claude` from inside `C:\taxasge\` so the project-scoped
   `.mcp.json` is loaded.
3. The first call to a Sentry tool (e.g. `mcp__Sentry__list_issues`) opens
   the OAuth flow. Authorize with the same GitHub account that owns the
   Sentry org `taxasge`.
4. Choose the tool groups (issues, projects, releases, …) — leave them all
   on for full coverage.

After that, future Claude sessions can do things like:

- "Show me the top 5 unresolved issues on `react-native` for the last 24 h"
- "Create a release `mobile@1.0.1` and associate the commits since
  `92ba3f0c`"
- "Tag the issue with id `xyz` as resolved"

## What this does NOT change at runtime

The Sentry MCP server is a developer tooling layer. It has no effect on the
shipped APK/IPA. Production crash reporting still goes through
`@sentry/react-native` configured in `core/observability/sentry.ts`.

## Token revocation reminder

The PAT (`sntryu_…`) shared earlier in the conversation log was added to
GitHub Secrets as `SENTRY_AUTH_TOKEN` for future EAS sourcemap upload, but
**must be revoked + recreated** because it appeared in plaintext during a
chat. Do it from sentry.io → User Settings → Auth Tokens → Revoke, then
create a new one and run:

```bash
echo "<NEW_TOKEN>" | gh secret set SENTRY_AUTH_TOKEN --repo KouemouSah/taxasge
```

The MCP server itself does **not** use this PAT — its OAuth flow is
unrelated.

## Multi-platform Sentry projects (future)

Sentry can host crash reports for the whole stack under the same org. If you
want to wire web frontend + Python backend later, create separate projects
in sentry.io:

| Platform | Project name | SDK |
|----------|--------------|-----|
| Mobile (Expo/RN) — already wired in P9.2 | `react-native` | `@sentry/react-native` |
| Frontend web | `nextjs` | `@sentry/nextjs` |
| Backend FastAPI | `python-fastapi` | `sentry-sdk[fastapi]` |

Each gets its own DSN. The org-level "Insights" tab automatically aggregates
them. Cross-platform trace correlation works when a request shares a
`trace_id` (e.g. mobile → backend).
