---
title: About openapi-typescript
description: Additional info about this project
---

<script setup>
  import { VPTeamMembers } from 'vitepress/theme';
  import Contributors from './.vitepress/theme/Contributors.vue'
  import data from './data/contributors.json';
</script>

# About openapi-typescript

## Used by

- [**Bigcommerce**](https://github.com/bigcommerce/bigcommerce-api-node): Node SDK for the BigCommerce API
- [**Budibase**](https://github.com/Budibase/budibase): low code platform for creating internal tools, workflows, and admin panels
- [**Fedora `fmn`**](https://github.com/fedora-infra/fmn): tools and APIs for Fedora’s messaging infra
- [**Fingerprint**](https://github.com/fingerprintjs/fingerprintjs-pro-server-api-node-sdk): device fingerprinting for high-scale applications
- [**Google Firebase CLI**](https://github.com/firebase/firebase-tools): Official CLI for Google’s Firebase platform
- [**GitHub Octokit**](https://github.com/octokit): Official SDK for the GitHub API
- [**Lotus**](https://github.com/uselotus/lotus): open source pricing & packaging infra
- [**Jitsu**](https://github.com/jitsucom/jitsu): modern, open source data ingestion / data pipelines
- [**Medusa**](https://github.com/medusajs/medusa): building blocks for digital commerce
- [**Netlify**](https://netlify.com): the modern development platform
- [**Nuxt**](https://github.com/unjs/nitro): The Intuitive Vue framework
- [**Relevance AI**](https://github.com/RelevanceAI/relevance-js-sdk): build and deploy AI chains
- [**Revolt**](https://github.com/revoltchat/api): open source user-first chat platform
- [**Spacebar**](https://github.com/spacebarchat): a free, open source, self-hostable Discord-compatible chat/voice/video platform
- [**Supabase**](https://github.com/supabase/supabase): The open source Firebase alternative.

## Project goals

### openapi-typescript

1. Support converting any valid OpenAPI schema to TypeScript types, no matter how complicated.
1. Generated types should be statically-analyzable and runtime-free (with minor exceptions like [enums](https://www.typescriptlang.org/docs/handbook/enums.html).
1. Generated types should match your original schema as closely as possible, preserving original capitalization, etc.
1. Typegen only needs Node.js to run (no Java, Python, etc.) and works in any environment.
1. Support fetching OpenAPI schemas from files as well as local and remote servers.

### openapi-fetch

1. Types should be strict and inferred automatically from OpenAPI schemas with the absolute minimum number of generics needed.
2. Respect the native Fetch API while reducing boilerplate (such as `await res.json()`).
3. Be as light and performant as possible.

### openapi-react-query

1. Types should be strict and inferred automatically from OpenAPI schemas with the absolute minimum number of generics needed.
2. Respect the original `@tanstack/react-query` APIs while reducing boilerplate.
3. Be as light and performant as possible.

### openapi-metadata

1. Must respect the OpenAPI V3 specification
2. Be extensible and easily integrated inside backend frameworks
3. Be focused around developer experience

## Maintainers

This library is currently maintained by these amazing individuals:

<VPTeamMembers size="small" :members="data.maintainers" />

## Contributors

And thanks to 100+ amazing contributors, without whom these projects wouldn’t be possible:

<Contributors :contributors="data.contributors" />
