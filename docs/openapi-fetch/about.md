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

### vs. Axios

[Axios](https://axios-http.com) doesn’t automatically typecheck against your OpenAPI schema. Further, there’s no easy way to do that. Axios does have more features than openapi-fetch such as interceptors and advanced cancellation.

### vs. tRPC

[tRPC](https://trpc.io/) is meant for projects where both the backend and frontend are written in TypeScript (Node.js). openapi-fetch is universal, and can work with any backend that follows an OpenAPI 3.x schema.

### vs. openapi-typescript-fetch

[openapi-typescript-fetch](https://github.com/ajaishankar/openapi-typescript-fetch) predates openapi-fetch, and is nearly identical in purpose, but differs mostly in syntax (so it’s more of an opinionated choice):

- openapi-typescript-fetch throws exceptions for non-OK responses (requiring you to wrap things in `try/catch`) rather than follow the fetch API spec of not throwing.
- openapi-typescript-fetch’s syntax is more verbose, and relies on chaining (`.path(…).method(…).create()`).

### vs. openapi-typescript-codegen

[openapi-typescript-codegen](https://github.com/ferdikoomen/openapi-typescript-codegen) is a codegen library, which is fundamentally different from openapi-fetch’s “no codegen” approach. openapi-fetch uses static TypeScript typechecking that all happens at build time with no client weight and no performance hit to runtime. Traditional codegen generates hundreds (if not thousands) of different functions that all take up client weight and slow down runtime.

### vs. Swagger Codegen

Swagger Codegen is the original codegen project for Swagger/OpenAPI, and has the same problems of other codgen approaches of size bloat and runtime performance problems. Further, Swagger Codegen require the Java runtime to work, whereas openapi-typescript/openapi-fetch don’t as native Node.js projects.

## Contributors

This library wouldn’t be possible without all these amazing contributors:

<VPTeamMembers size="small" :members="contributors['openapi-fetch']" />
