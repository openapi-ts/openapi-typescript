---
title: useSuspenseQuery
---

# {{ $frontmatter.title }}

`useSuspenseQuery` メソッドを使用すると、react-query 本来の [useSuspenseQuery](https://tanstack.com/query/latest/docs/framework/react/guides/suspense) を利用できます。

- result は本来の関数と同じです。
- `functionKey` は `[method, path, params]` です。
- `data` と `error` は完全に型付けされています。
- 第4引数としてクエリオプションを渡すことができます。

::: tip
`useSuspenseQuery` に関する詳細は、[@tanstack/react-query ドキュメント](https://tanstack.com/query/latest/docs/framework/react/guides/suspense) で確認できます。
:::

## 使用例

::: code-group

```tsx [src/app.tsx]
import { ErrorBoundary } from "react-error-boundary";
import { $api } from "./api";

const MyComponent = () => {
  const { data } = $api.useSuspenseQuery("get", "/users/{user_id}", {
    params: {
      path: { user_id: 5 },
    },
  });

  return <div>{data.firstname}</div>;
};

export const App = () => {
  return (
    <ErrorBoundary fallbackRender={({ error }) => `Error: ${error.message}`}>
      <MyComponent />
    </ErrorBoundary>
  );
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
const query = $api.useSuspenseQuery(
  method,
  path,
  options,
  queryOptions,
  queryClient
);
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
  - 本来の `useSuspenseQuery` オプション
  - [詳細はこちら](https://tanstack.com/query/latest/docs/framework/react/reference/useSuspenseQuery)
- `queryClient`
  - 本来の `queryClient` オプション
  - [詳細はこちら](https://tanstack.com/query/latest/docs/framework/react/reference/useSuspenseQuery)
