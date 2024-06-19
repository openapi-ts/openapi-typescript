---
title: openapi-fetch 示例
---

# 示例

使用 openapi-fetch 与其他框架和库的示例代码。

## React + React Query

[React Query](https://tanstack.com/query/latest) 是在 React 中完美封装 openapi-fetch 的工具。仅有 13 kB 的大小，提供了客户端缓存而没有太多的客户端负担。其出色的类型推断通过最小的设置完美地保留了 openapi-fetch 的类型。

[在 GitHub 中查看代码示例](https://github.com/openapi-ts/openapi-typescript/tree/main/packages/openapi-fetch/examples/react-query)

## Next.js

[Next.js](https://nextjs.org/) 是 React 的最流行的 SSR 框架。虽然对于所有客户端获取 openapi-fetch，推荐使用 [React Query](#react--react-query)（而不是 SWR），但该示例展示了如何利用 Next.js 的[服务器端获取](https://nextjs.org/docs/app/building-your-application/data-fetching/fetching-caching-and-revalidating#fetching-data-on-the-server-with-fetch)并内建缓存。

[在 GitHub 中查看代码示例](https://github.com/openapi-ts/openapi-typescript/tree/main/packages/openapi-fetch/examples/nextjs)

## Svelte / SvelteKit

[SvelteKit](https://kit.svelte.dev) 的自动类型推断可以轻松地在客户端获取和 [Page Data](https://kit.svelte.dev/docs/load#page-data) 获取中捕获 openapi-fetch 的类型。而且它不需要任何额外的库。SvelteKit 还建议使用它们的[自定义 fetch](https://kit.svelte.dev/docs/load#making-fetch-requests)在 load 函数中工作。这可以通过 [fetch options](/openapi-fetch/api#fetch-options) 实现。

_注意：如果你在没有 SvelteKit 的情况下使用 Svelte，`src/routes/+page.svelte` 中的根示例不使用任何 SvelteKit 特性，通常适用于任何设置。_

[在 GitHub 中查看代码示例](https://github.com/openapi-ts/openapi-typescript/tree/main/packages/openapi-fetch/examples/sveltekit)

## Vue

目前还没有 Vue 的示例应用。你在 Vue 中使用吗？请[提交 PR 添加！](https://github.com/openapi-ts/openapi-typescript/pulls)

---

欢迎提供更多示例！请[提交 PR](https://github.com/openapi-ts/openapi-typescript/pulls)添加你的示例。
