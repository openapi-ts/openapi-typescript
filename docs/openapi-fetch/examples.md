---
title: openapi-fetch Examples
---

# Examples

Example code of using openapi-fetch with other frameworks and libraries.

## React + React Query

[React Query](https://tanstack.com/query/latest) is a perfect wrapper for openapi-fetch in React. At only 13 kB, it provides clientside caching and request deduping across async React components without too much client weight in return. And its type inference preserves openapi-fetch types perfectly with minimal setup.

[View a code example in GitHub](https://github.com/drwpow/openapi-typescript/tree/main/packages/openapi-fetch/examples/react-query)

## Next.js

[Next.js](https://nextjs.org/) is the most popular SSR framework for React. While [React Query](#react--react-query) is recommended for all clientside fetching with openapi-fetch (not SWR), this example shows how to take advantage of Next.js’s [server-side fetching](https://nextjs.org/docs/app/building-your-application/data-fetching/fetching-caching-and-revalidating#fetching-data-on-the-server-with-fetch) with built-in caching.

[View a code example in GitHub](https://github.com/drwpow/openapi-typescript/tree/main/packages/openapi-fetch/examples/nextjs)

## Svelte / SvelteKit

[SvelteKit](https://kit.svelte.dev)’s automatic type inference can easily pick up openapi-fetch’s types in both clientside fetching and [Page Data](https://kit.svelte.dev/docs/load#page-data) fetching. And it doesn’t need any additional libraries to work. SvelteKit also advises to use their [custom fetch](https://kit.svelte.dev/docs/load#making-fetch-requests) in load functions. This can be achieved with [fetch options](/openapi-fetch/api#fetch-options).

_Note: if you’re using Svelte without SvelteKit, the root example in `src/routes/+page.svelte` doesn’t use any SvelteKit features and is generally-applicable to any setup._

[View a code example in GitHub](https://github.com/drwpow/openapi-typescript/tree/main/packages/openapi-fetch/examples/sveltekit)

## Vue

There isn’t an example app in Vue yet. Are you using it in Vue? Please [open a PR to add it!](https://github.com/drwpow/openapi-typescript/pulls)

---

Additional examples are always welcome! Please [open a PR](https://github.com/drwpow/openapi-typescript/pulls) with your examples.
