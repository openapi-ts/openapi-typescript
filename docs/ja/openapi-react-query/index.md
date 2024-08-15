---
title: openapi-react-query
---

# Introduction

openapi-react-queryは、[@tanstack/react-query](https://tanstack.com/query/latest/docs/framework/react/overview) と連携してOpenAPIスキーマを扱うための、1kbの型安全な軽量ラッパーです。

これは [openapi-fetch](../openapi-fetch/)] および [openapi-typescript](../introduction) を使用することで、以下のすべての機能が提供されます：

- ✅ URLやパラメータのタイプミスが起こらない
- ✅ すべてのパラメータ、リクエストボディ、レスポンスが型チェックされ、スキーマと100%一致する
- ✅ APIの手動での型指定が不要
- ✅ バグを隠す可能性がある `any` 型の排除
- ✅ バグを隠す可能性がある `as` 型の上書きも排除

::: code-group

```tsx [src/my-component.ts]
import createFetchClient from "openapi-fetch";
import createClient from "openapi-react-query";
import type { paths } from "./my-openapi-3-schema"; // openapi-typescriptで生成された型

const fetchClient = createFetchClient<paths>({
  baseUrl: "https://myapi.dev/v1/",
});
const $api = createClient(fetchClient);

const MyComponent = () => {
  const { data, error, isLoading } = $api.useQuery(
    "get",
    "/blogposts/{post_id}",
    {
      params: {
        path: { post_id: 5 },
      },
    }
  );

  if (isLoading || !data) return "Loading...";

  if (error) return `An error occured: ${error.message}`;

  return <div>{data.title}</div>;
};
```

:::

## セットアップ

このライブラリを [openapi-fetch](../openapi-fetch/) および [openapi-typescript](../introduction) と一緒にインストールします：

```bash
npm i openapi-react-query openapi-fetch
npm i -D openapi-typescript typescript
```

::: tip 強く推奨

`tsconfig.json`で [noUncheckedIndexedAccess](https://www.typescriptlang.org/tsconfig#noUncheckedIndexedAccess) を有効にしてください ([ドキュメント](/advanced#enable-nouncheckedindexaccess-in-your-tsconfigjson))

:::

次に、openapi-typescript を使用してOpenAPIスキーマからTypeScriptの型を生成します：

```bash
npx openapi-typescript ./path/to/api/v1.yaml -o ./src/lib/api/v1.d.ts
```

## 基本的な使い方

スキーマから型が生成されたら、[fetchクライアント](../introduction.md)とreact-queryクライアントを作成し、APIにクエリを実行できます。

::: code-group

```tsx [src/my-component.ts]
import createFetchClient from "openapi-fetch";
import createClient from "openapi-react-query";
import type { paths } from "./my-openapi-3-schema"; // openapi-typescriptで生成された型

const fetchClient = createFetchClient<paths>({
  baseUrl: "https://myapi.dev/v1/",
});
const $api = createClient(fetchClient);

const MyComponent = () => {
  const { data, error, isLoading } = $api.useQuery(
    "get",
    "/blogposts/{post_id}",
    {
      params: {
        path: { post_id: 5 },
      },
    }
  );

  if (isLoading || !data) return "Loading...";

  if (error) return `An error occured: ${error.message}`;

  return <div>{data.title}</div>;
};
```

:::

::: tip
`createFetchClient` に関する詳細は [openapi-fetch ドキュメント](../openapi-fetch/index.md) をご覧ください。
:::
