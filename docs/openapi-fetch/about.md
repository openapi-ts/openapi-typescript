---
title: About openapi-fetch
description: openapi-fetch Project Goals, comparisons, and more
---

<script setup>
  import { VPTeamMembers } from 'vitepress/theme';
  import contributors from '../data/contributors.json';
</script>

# About

## Project Goals

1. Types should be strict and inferred automatically from OpenAPI schemas with the absolute minimum number of generics needed.
2. Respect the native Fetch API while reducing boilerplate (such as `await res.json()`).
3. Be as light and performant as possible.

## Differences

### vs. openapi-typescript-fetch

This library is identical in purpose to [openapi-typescript-fetch](https://github.com/ajaishankar/openapi-typescript-fetch), but has the following differences:

- This library has a built-in `error` type for `3xx`/`4xx`/`5xx` errors whereas openapi-typescript-fetch throws exceptions (requiring you to wrap things in `try/catch`)
- This library has a more terse syntax (`get(…)`) wheras openapi-typescript-fetch requires chaining (`.path(…).method(…).create()`)
- openapi-typescript-fetch supports middleware whereas this library doesn’t

### vs. openapi-typescript-codegen

This library is quite different from [openapi-typescript-codegen](https://github.com/ferdikoomen/openapi-typescript-codegen)

## Contributors

This library wouldn’t be possible without all these amazing contributors:

<VPTeamMembers size="small" :members="contributors['openapi-fetch']" />
