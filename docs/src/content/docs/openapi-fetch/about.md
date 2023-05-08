---
title: About
description: openapi-fetch About
---

## Project Goals

1. Infer types automatically from OpenAPI schemas **without generics** (or, only the absolute minimum needed)
2. Respect the native Fetch API while reducing boilerplate (such as `await res.json()`)
3. Be as small and light as possible

## Differences from openapi-typescript-fetch

This library is identical in purpose to [openapi-typescript-fetch](https://github.com/ajaishankar/openapi-typescript-fetch), but has the following differences:

- This library has a built-in `error` type for `3xx`/`4xx`/`5xx` errors whereas openapi-typescript-fetch throws exceptions (requiring you to wrap things in `try/catch`)
- This library has a more terse syntax (`get(…)`) wheras openapi-typescript-fetch requires chaining (`.path(…).method(…).create()`)
- openapi-typescript-fetch supports middleware whereas this library doesn’t

## Contributors

This library wouldn’t be possible without all these amazing contributors:
