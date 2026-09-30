---
"openapi-fetch": patch
---

Replace `Math.random()` with a monotonic counter in `randomID()`. `Math.random()` is a non-deterministic side effect that can interfere with frameworks that cache or deduplicate `fetch()` calls (e.g. Next.js React Server Components). The counter produces unique IDs within a process while being deterministic across runs.
