---
title: useMutation
---

# {{ $frontmatter.title }}

`useMutation` メソッドを使用すると、react-query本来の [useMutation](https://tanstack.com/query/latest/docs/framework/react/guides/mutations) を利用できます。

- resultは本来の関数と同じです。
- `mutationKey` は `[method, path]`です。
- `data` と `error` は完全に型付けされています。

::: tip
`useMutation` に関する詳細は、[@tanstack/react-query ドキュメント](https://tanstack.com/query/latest/docs/framework/react/guides/mutations) で確認できます。
:::

## 使用例

::: code-group

```tsx [src/app.tsx]
import { $api } from "./api";

export const App = () => {
  const { mutate } = $api.useMutation("patch", "/users");

  return (
    <button onClick={() => mutate({ body: { firstname: "John" } })}>
      Update
    </button>
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
const query = $api.useQuery(method, path, options, queryOptions, queryClient);
```

**引数**

- `method` **(必須)**
  - リクエストに使用するHTTPメソッド
  - このメソッドがキーとして使用されます。詳細については [Query Keys](https://tanstack.com/query/latest/docs/framework/react/guides/query-keys) を参照してください。
- `path` **(必須)**
  - リクエストに使用するパス名
  - スキーマ内で指定されたメソッドに対応する利用可能なパスでなければなりません。
  - パス名はキーとして使用されます。詳細については [Query Keys](https://tanstack.com/query/latest/docs/framework/react/guides/query-keys) を参照してください。
- `queryOptions`
  - 本来の useMutation オプション
  - [See more information](https://tanstack.com/query/latest/docs/framework/react/reference/useMutation)
- `queryClient`
  - 本来の queryClient オプション
  - [See more information](https://tanstack.com/query/latest/docs/framework/react/reference/useMutation)
