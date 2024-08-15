---
title: openapi-fetch 使用例
---

# 使用例

openapi-fetchを他のフレームワークやライブラリと組み合わせて使用するコード例

## React + React Query

[React Query](https://tanstack.com/query/latest) は、Reactでopenapi-fetchを使用するための理想的なラッパーです。わずか13 kBのサイズで、クライアントサイドのキャッシュ機能を提供し、クライアントの負担を増やすことなく利用できます。また、その優れた型推論機能により、openapi-fetchの型が最小限の設定で完全に保持されます。

[GitHubでコード例を見る](https://github.com/openapi-ts/openapi-typescript/tree/main/packages/openapi-fetch/examples/react-query)

## Next.js

[Next.js](https://nextjs.org/) は、React向けの最も人気のあるSSR（サーバーサイドレンダリング）フレームワークです。[React Query](#react--react-query) はクライアントサイドでのデータ取得に推奨されていますが、この例では、Next.jsの[サーバーサイドでのデータ取得機能](https://nextjs.org/docs/app/building-your-application/data-fetching/fetching-caching-and-revalidating#fetching-data-on-the-server-with-fetch)を利用し、ビルトインのキャッシュ機能を活用する方法を示しています。

[GitHubでコード例を見る](https://github.com/openapi-ts/openapi-typescript/tree/main/packages/openapi-fetch/examples/nextjs)

## Svelte / SvelteKit

[SvelteKit](https://kit.svelte.dev) の自動型推論機能は、クライアントサイドでのデータ取得や[ページデータの取得](https://kit.svelte.dev/docs/load#page-data)において、openapi-fetchの型を簡単に活用できます。また、追加のライブラリを必要とせずに動作します。SvelteKitは、ロード関数内で[カスタムフェッチ](https://kit.svelte.dev/docs/load#making-fetch-requests)を使用することを推奨しており、これは[フェッチオプション](/openapi-fetch/api#fetch-options)で実現できます。

_注: SvelteKitを使用しない場合でも、`src/routes/+page.svelte` 内のルート例は、SvelteKitの機能を使用しておらず、どのようなセットアップにも適用可能です。_

[GitHubでコード例を見る](https://github.com/openapi-ts/openapi-typescript/tree/main/packages/openapi-fetch/examples/sveltekit)

## Vue 3

[Vue 3](https://vuejs.org/) は大規模なエコシステムを持つ人気のフレームワークです。Vue 3のComposition APIは、関心の分離やリアクティビティを容易にするため、openapi-fetchと非常に相性が良いです。

[GitHubでコード例を見る](https://github.com/openapi-ts/openapi-typescript/tree/main/packages/openapi-fetch/examples/vue-3)

---

他の例も歓迎しています！あなたの使用例を[PRとして提出](https://github.com/openapi-ts/openapi-typescript/pulls)してください。