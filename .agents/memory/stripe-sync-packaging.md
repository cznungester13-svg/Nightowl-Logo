---
name: Stripe sync packaging
description: Why the Stripe synchronization library must stay external to the API server bundle.
---

Keep `stripe-replit-sync` external in the API server's esbuild configuration.

**Why:** The library loads SQL migration files from its installed package directory at runtime. Bundling its JavaScript without those sibling files makes migration startup appear to run while leaving the managed Stripe tables absent.

**How to apply:** Preserve this externalization when changing the API build or deployment packaging, and verify startup reaches schema migration, managed webhook setup, and backfill before the server listens.