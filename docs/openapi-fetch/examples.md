---
title: openapi-fetch Examples
---

# Examples

Example code of using openapi-fetch with other frameworks and libraries.

## React + React Query

See [openapi-react-query](/openapi-react-query/)

## Next.js

[Next.js](https://nextjs.org/) is the most popular SSR framework for React. While [React Query](#react--react-query) is recommended for all clientside fetching with openapi-fetch (not SWR), this example shows how to take advantage of Next.js’s [server-side fetching](https://nextjs.org/docs/app/building-your-application/data-fetching/fetching-caching-and-revalidating#fetching-data-on-the-server-with-fetch) with built-in caching.

[View a code example in GitHub](https://github.com/openapi-ts/openapi-typescript/tree/main/packages/openapi-fetch/examples/nextjs)

## Svelte / SvelteKit

[SvelteKit](https://svelte.dev/docs/kit)’s automatic type inference can easily pick up openapi-fetch’s types in both clientside fetching and [Page Data](https://svelte.dev/docs/kit/load#Page-data) fetching. And it doesn’t need any additional libraries to work. SvelteKit also advises to use their [custom fetch](https://svelte.dev/docs/kit/load#Making-fetch-requests) in load functions. This can be achieved with [fetch options](/openapi-fetch/api#fetch-options).

_Note: if you’re using Svelte without SvelteKit, the root example in `src/routes/+page.svelte` doesn’t use any SvelteKit features and is generally-applicable to any setup._

[View a code example in GitHub](https://github.com/openapi-ts/openapi-typescript/tree/main/packages/openapi-fetch/examples/sveltekit)

## Vue 3

[Vue 3](https://vuejs.org/) is a popular framework with a large ecosystem. Vue 3’s Composition API is a perfect match for openapi-fetch, as it allows for easy separation of concerns and reactivity.

[View a code example in GitHub](https://github.com/openapi-ts/openapi-typescript/tree/main/packages/openapi-fetch/examples/vue-3)

## Nuxt 3

[Nuxt 3](https://nuxtjs.org/) is a popular SSR framework for Vue 3. By combining Nuxt's built-in [useAsyncData](https://nuxt.com/docs/api/composables/use-async-data) composable with openapi-fetch, you can easily implement type-safe API communication with server-side rendering.

[View a code example in GitHub](https://github.com/HasutoSasaki/nuxt3-openapi-typescript-example)

---

Additional examples are always welcome! Please [open a PR](https://github.com/openapi-ts/openapi-typescript/pulls) with your examples.
