---
title: useQuery
---

# {{ $frontmatter.title }}

`useQuery` メソッドを使用すると、react-query 本来の [useQuery](https://tanstack.com/query/latest/docs/framework/react/guides/queries) を利用できます。

- result は本来の関数と同じです。
- `functionKey` は `[method, path, params]` です。
- `data` と `error` は完全に型付けされています。
- 第4引数としてクエリオプションを渡すことができます。

::: tip
`useQuery` に関する詳細は、[@tanstack/react-query ドキュメント](https://tanstack.com/query/latest/docs/framework/react/guides/queries) で確認できます。
:::

## 使用例

::: code-group

```tsx [src/app.tsx]
import { $api } from "./api";

export const App = () => {
  const { data, error, isLoading } = $api.useQuery("get", "/users/{user_id}", {
    params: {
      path: { user_id: 5 },
    },
  });

  if (!data || isLoading) return "読み込み中...";
  if (error) return `エラーが発生しました: ${error.message}`;

  return <div>{data.firstname}</div>;
};
```

```ts [src/api.ts]
import createFetchClient from "openapi-fetch";
import createClient from "openapi-react-query";
import type { paths } from "./my-openapi-3-schema"; // openapi-typescriptで生成された型

const fetchClient = createFetchClient<paths>({
  baseUrl: "https://myapi.dev/v1/",
});
export const $api = createClient(fetchClient);
```

:::

## Api

```tsx
const query = $api.useQuery(method, path, options, queryOptions, queryClient);
```

**引数**

- `method` **(必須)**
  - リクエストに使用する HTTP メソッド
  - このメソッドがキーとして使用されます。詳細については [Query Keys](https://tanstack.com/query/latest/docs/framework/react/guides/query-keys) を参照してください。
- `path` **(必須)**
  - リクエストに使用するパス名
  - スキーマ内で指定されたメソッドに対応する利用可能なパスでなければなりません。
  - パス名はキーとして使用されます。詳細については [Query Keys](https://tanstack.com/query/latest/docs/framework/react/guides/query-keys) を参照してください。
- `options`
  - リクエストに使用する fetch オプション
  - OpenAPI スキーマがパラメータを要求する場合のみ必要です。
  - オプションの `params` はキーとして使用されます。詳細については [Query Keys](https://tanstack.com/query/latest/docs/framework/react/guides/query-keys) を参照してください。
- `queryOptions`
  - 本来の `useQuery` オプション
  - [詳細はこちら](https://tanstack.com/query/latest/docs/framework/react/reference/useQuery)
- `queryClient`
  - 本来の `queryClient` オプション
  - [詳細はこちら](https://tanstack.com/query/latest/docs/framework/react/reference/useQuery)
