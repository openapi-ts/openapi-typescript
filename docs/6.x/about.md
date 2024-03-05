---
title: About
description: Additional info about this project
---

<script setup>
  import { VPTeamMembers } from 'vitepress/theme';
  import contributors from '../data/contributors.json';
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
- [**Twitter API**](https://github.com/twitterdev/twitter-api-typescript-sdk): Official SDK for the Twitter API

## Project goals

1. Support converting any valid OpenAPI schema to TypeScript types, no matter how complicated.
1. Generated types should be statically-analyzable and runtime-free (with minor exceptions like [enums](https://www.typescriptlang.org/docs/handbook/enums.html).
1. Don’t validate schemas; there are existing libraries for that like [Redocly](https://redocly.com/docs/cli/commands/lint/).
1. Generated types should match your original schema as closely as possible, preserving original capitalization, etc.
1. Typegen only needs Node.js to run (no Java, Python, etc.) and works in any environment.
1. Support fetching OpenAPI schemas from files as well as local and remote servers.

## Differences

### vs. swagger-codegen

openapi-typescript was created specifically to be a lighterweight, easier-to-use alternative to swagger-codegen that doesn’t require the Java runtime or running an OpenAPI server. Nor does it generate heavyweight clientside code. In fact, all the code openapi-typescript generates is **runtime free static types** for maximum performance and minimum client weight.

### vs. openapi-typescript-codegen

These 2 projects are unrelated. openapi-typescript-codegen is a Node.js alternative to the original swagger-codegen, but ends up being the same in practice. openapi-typescript has the same advantage of being **runtime free** whereas openapi-typescript-codegen can generate some pretty heavy bundles, up to `250 kB` or more depending on the schema complexity.

### vs. tRPC

[tRPC](https://trpc.io/) is an opinionated type-safe framework for both server and client. It demands both your server and client be written in tRPC (which means Node.js for the backend).

If you fit into this usecase, it’s a great experience! But for everyone else, openapi-typescript (and openapi-fetch) is a more flexible, lower-level solution that can work for any technology choice (or even be incrementally-adopted without any cost).

## Contributors

This library wouldn’t be possible without all these amazing contributors:

<VPTeamMembers size="small" :members="contributors['openapi-typescript']" />
