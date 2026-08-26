# NightOwl

NightOwl is an AI operations landing site with a secure command center for managing leads, marketing settings, analytics, and billing readiness.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm --filter @workspace/nightowl run dev` — run the NightOwl web artifact
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes
- Required env: `DATABASE_URL`, Clerk keys, and `NIGHTOWL_ADMIN_EMAILS` (comma-separated allowlist)

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Web: React 19, Vite, Tailwind CSS, TanStack Query, Wouter
- Auth: Replit-managed Clerk with a same-origin production proxy
- Build: esbuild (API) and Vite (web)

## Where things live

- `artifacts/nightowl` — public site, Clerk routes, and responsive admin command center
- `artifacts/api-server` — public and admin APIs plus Clerk authorization/proxy middleware
- `lib/api-spec/openapi.yaml` — source of truth for the typed API contract
- `lib/db/src/schema` — leads, site settings, and privacy-conscious analytics tables

## Architecture decisions

- Admin authorization is enforced server-side by Clerk identity plus `NIGHTOWL_ADMIN_EMAILS`; an empty allowlist denies everyone.
- The browser and API are same-origin. Do not add reflected credentialed CORS.
- Contact submissions create their analytics event transactionally on the server to avoid double-counting.
- The API start command applies the Drizzle schema before serving so deployment databases are ready.
- Stripe is intentionally not connected; billing screens must remain explicit and non-transactional until integration work is completed.

## Product

- Public NightOwl marketing site with database-backed contact submissions
- Branded sign-in/sign-up and allowlisted administration
- Lead search, detail, and status management
- Editable hero/pricing/contact settings
- First-party page-view, CTA, and contact-conversion analytics
- Billing readiness view that clearly reports Stripe as not connected

## User preferences

None recorded.

## Gotchas

- Regenerate API clients after editing `lib/api-spec/openapi.yaml`.
- The Clerk proxy is production-only; Vite development must leave the frontend `proxyUrl` unset.
- Query-string values arrive as strings in Express even when OpenAPI declares integers; normalize before generated Zod validation.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
