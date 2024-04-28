---
title: openapi-fetch
---

<img src="/assets/openapi-fetch.svg" alt="openapi-fetch" width="216" height="40" />

`openapi-fetch`是一个类型安全的`fetch`客户端，用于拉取您的OpenAPI模式。大小为**5 kb**，几乎没有运行时。适用于React、Vue、Svelte或纯JS。

| 库                         | 大小（最小） | “GET” 请求                  |
| :------------------------- | -----------: | :-------------------------- |
| openapi-fetch              |       `5 kB` | `278k` 操作/秒（最快）      |
| openapi-typescript-fetch   |       `4 kB` | `130k` 操作/秒（2.1× 较慢） |
| axios                      |      `32 kB` | `217k` 操作/秒（1.3× 较慢） |
| superagent                 |      `55 kB` | `63k` 操作/秒（4.4× 较慢）  |
| openapi-typescript-codegen |     `367 kB` | `106k` 操作/秒（2.6× 较慢） |

语法灵感来自流行的库，如`react-query`或`Apollo client`，但没有所有这些功能，并且包大小仅为5 kb。

::: code-group

```ts [src/my-project.ts]
import createClient from "openapi-fetch";
import type { paths } from "./my-openapi-3-schema"; // 由openapi-typescript生成

const client = createClient<paths>({ baseUrl: "https://myapi.dev/v1/" });

const {
  data, // 仅在2XX响应存在时出现
  error, // 仅在4XX或5XX响应存在时出现
} = await client.GET("/blogposts/{post_id}", {
  params: {
    path: { post_id: "123" },
  },
});

await client.PUT("/blogposts", {
  body: JSON.stringify({
    title: "My New Post",
  }),
});
```

:::

`data`和`error`经过类型检查，并将其类型暴露给VS Code（以及任何其他支持TypeScript的IDE）的智能感知。同样，请求`body`也将检查其字段，如果缺少任何必需的参数或存在类型不匹配，则会出错。

`GET()`、`PUT()`、`POST()`等是对原生 [fetch API](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API) 的轻量包装（您可以 [替换为任何调用](/zh/openapi-fetch/api#create-client)）。

请注意，没有泛型，也没有手动类型化。您的端点的请求和响应已自动推断。这对于端点的类型安全性是一个巨大的改进，因为**每个手动断言都可能导致错误**！这消除了以下所有问题：

- ✅ URL 或参数中的拼写错误
- ✅ 所有参数、请求体和响应均经过类型检查，并且与您的模式完全匹配
- ✅ 无需手动输入API
- ✅ 消除隐藏错误的 `any` 类型
- ✅ 还消除了可能隐藏错误的 `as` 类型覆盖
- ✅ 所有这些都在一个 **5 kb** 的客户端包中 🎉

## 安装

::: warning

当前版本的 `openapi-fetch` 需要 `openapi-typescript@6.x`（最新版本）。即将发布的破坏性更新将支持 `openapi-typescript@7.x`。

:::

安装此库以及 [openapi-typescript](/introduction)：

```bash
npm i openapi-fetch
npm i -D openapi-typescript typescript
```

::: tip 强烈推荐

在 `tsconfig.json` 中启用 [noUncheckedIndexedAccess](https://www.typescriptlang.org/tsconfig#noUncheckedIndexedAccess)（[文档](/advanced#enable-nouncheckedindexaccess-in-your-tsconfigjson)）

:::

接下来，使用 `openapi-typescript` 从您的 OpenAPI 模式生成 TypeScript 类型：

```bash
npx openapi-typescript ./path/to/api/v1.yaml -o ./src/lib/api/v1.d.ts
```

最后，请确保在您的项目中 **运行类型检查**。这可以通过在您的 [npm 脚本](https://docs.npmjs.com/cli/v9/using-npm/scripts) 中添加 `tsc --noEmit` 来完成，如下所示：

```json
{
  "scripts": {
    "test:ts": "tsc --noEmit"
  }
}
```

并在您的 CI 中运行 `npm run test:ts` 以捕获类型错误。

::: tip
使用 `tsc --noEmit` 来检查类型错误，而不要依赖于您的 linter 或构建命令。没有什么比 TypeScript 编译器本身更能准确地检查类型。
:::

## 基本用法

使用 `openapi-fetch` 而不是传统的代码生成的最大优点是不需要文档。`openapi-fetch` 鼓励使用现有的 OpenAPI 文档，而不是试图找出要导入的函数或该函数需要哪些参数：

![OpenAPI 模式示例](/assets/openapi-schema.png)

::: code-group

```ts [src/my-project.ts]
import createClient from "openapi-fetch";
import type { paths } from "./my-openapi-3-schema"; // 由openapi-typescript生成

const client = createClient<paths>({ baseUrl: "https://myapi.dev/v1/" });

const { data, error } = await client.GET("/blogposts/{post_id}", {
  params: {
    path: { post_id: "my-post" },
    query: { version: 2 },
  },
});

const { data, error } = await client.PUT("/blogposts", {
  body: JSON.stringify({
    title: "New Post",
    body: "<p>New post body</p>",
    publish_date: new Date("2023-03-01T12:00:00Z").getTime(),
  }),
});
```

:::

1. HTTP 方法直接从 `createClient()` 中提取
2. 将所需的 `path` 传递给 `GET()`、`PUT()` 等
3. TypeScript 接管其余部分，并为任何缺失或无效的内容返回有帮助的错误

### 路径名

`GET()`、`PUT()`、`POST()` 等的路径名**必须与您的模式完全匹配**。请注意，在示例中，URL 为 `/blogposts/{post_id}`。此库将快速替换所有 `path` 参数（以便进行类型检查）。

::: tip

`openapi-fetch` 从 URL 推断类型。请使用静态字符串值而不是动态运行时值，例如：

- ✅ `"/blogposts/{post_id}"`
- ❌ `[...pathParts].join("/") + "{post_id}"`

:::

该库还自动支持**标签**和**矩阵**序列化样式（[文档](https://swagger.io/docs/specification/serialization/#path)）。

### 请求

`GET()` 请求所示需要 `params` 对象，该对象按类型（`path` 或 `query`）分组 [参数](https://spec.openapis.org/oas/latest.html#parameter-object)。如果缺少必需的参数或参数类型不正确，将引发类型错误。

`POST()` 请求需要一个 `body` 对象，该对象提供了所有必需的 [requestBody](https://spec.openapis.org/oas/latest.html#request-body-object) 数据。

### 响应

所有方法都返回一个包含 **data**、**error** 和 **response** 的对象。

```ts
const { data, error, response } = await client.GET("/url");
```

| 对象       | 响应                                                                                              |
| :--------- | :------------------------------------------------------------------------------------------------ |
| `data`     | 如果 OK 则为 `2xx` 响应；否则为 `undefined`                                                       |
| `error`    | 如果不是 OK，则为 `5xx`、`4xx` 或 `default` 响应；否则为 `undefined`                              |
| `response` | [原始响应](https://developer.mozilla.org/en-US/docs/Web/API/Response) 包含 `status`、`headers` 等 |

## 支持

| 平台           | 支持                                                                                                                                  |
| :------------- | :------------------------------------------------------------------------------------------------------------------------------------ |
| **浏览器**     | [查看 fetch API 支持](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API#browser_compatibility)（在所有主流浏览器中广泛可用） |
| **Node**       | >= 18.0.0                                                                                                                             |
| **TypeScript** | >= 4.7（建议使用 >= 5.0）                                                                                                             |
