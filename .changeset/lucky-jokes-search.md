---
"openapi-typescript-helpers": minor
"openapi-typescript": minor
"openapi-fetch": minor
---

Add support for the HTTP `QUERY` method ([RFC 10008](https://www.rfc-editor.org/rfc/rfc10008)).

`query` is recognised as a path item verb in [OpenAPI 3.2](https://spec.openapis.org/oas/v3.2.0.html#path-item-object). openapi-typescript previously dropped it as an unknown property, so no types were emitted for it.

- `openapi-typescript` now emits a `query` operation for the path items that declare one. Path items without a `query` operation are unchanged, so existing generated output is not affected.
- `openapi-typescript-helpers` adds `"query"` to `HttpMethod`.
- `openapi-fetch` adds `client.QUERY()` (and `QUERY` on the path-based client), which sends a request body like `POST` while preserving QUERY's safe/idempotent semantics.
