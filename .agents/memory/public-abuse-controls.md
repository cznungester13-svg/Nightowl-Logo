---
name: Public abuse controls
description: Durable rules for protecting public NightOwl endpoints without corrupting analytics.
---

Public endpoint quotas must be shared and atomic across API instances, and blocked-request reporting must use bounded aggregate counters rather than one row per rejected request.

**Why:** Process-local quotas reset on deploys and can be bypassed across instances, while per-rejection audit rows let an attacker amplify database writes and reporting work.

**How to apply:** For future public endpoints, key short-lived quota buckets by a one-way client identifier, keep blocked traffic separate from first-party events, and aggregate abuse counts by a bounded reporting period.