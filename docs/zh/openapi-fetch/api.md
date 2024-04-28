---
title: API
description: openapi-fetch API
---

# API

## createClient

**createClient** 接受以下选项，这些选项设置所有后续 fetch 调用的默认设置。

```ts
createClient<paths>(options);
```

| 名称              | 类型            | 描述                                                                                                                                       |
| :---------------- | :-------------- | :----------------------------------------------------------------------------------------------------------------------------------------- |
| `baseUrl`         | `string`        | 使用此选项为所有 fetch URL 添加前缀（例如 `"https://myapi.dev/v1/"`）                                                                      |
| `fetch`           | `fetch`         | 用于请求的 Fetch 实例（默认值：`globalThis.fetch`）                                                                                        |
| `querySerializer` | QuerySerializer | (可选) 提供一个 [querySerializer](#queryserializer)                                                                                        |
| `bodySerializer`  | BodySerializer  | (可选) 提供一个 [bodySerializer](#bodyserializer)                                                                                          |
| (Fetch 选项)      |                 | 任何有效的 fetch 选项（`headers`、`mode`、`cache`、`signal` 等）（[文档](https://developer.mozilla.org/en-US/docs/Web/API/fetch#options)） |

## Fetch 选项

以下选项适用于所有请求方法（`.GET()`、`.POST()` 等）。

```ts
client.GET("/my-url", options);
```

| 名称              | 类型                                                              | 描述                                                                                                                                                                       |
| :---------------- | :---------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `params`          | ParamsObject                                                      | [path](https://swagger.io/specification/#parameter-locations) 和 [query](https://swagger.io/specification/#parameter-locations) 参数。                                     |
| `body`            | `{ [name]:value }`                                                | [requestBody](https://spec.openapis.org/oas/latest.html#request-body-object) 数据。                                                                                        |
| `querySerializer` | QuerySerializer                                                   | (可选) 提供一个 [querySerializer](#queryserializer)                                                                                                                        |
| `bodySerializer`  | BodySerializer                                                    | (可选) 提供一个 [bodySerializer](#bodyserializer)                                                                                                                          |
| `parseAs`         | `"json"` \| `"text"` \| `"arrayBuffer"` \| `"blob"` \| `"stream"` | (可选) 使用 [内置实例方法](https://developer.mozilla.org/en-US/docs/Web/API/Response#instance_methods) 解析响应（默认值: `"json"`）。`"stream"` 跳过解析，直接返回原始流。 |
| `fetch`           | `fetch`                                                           | 用于请求的 Fetch 实例（默认：`createClient` 的 fetch）                                                                                                                     |
| `middleware`      | `Middleware[]`                                                    | [查看文档](/zh/openapi-fetch/middleware-auth)                                                                                                                              |
| (Fetch 选项)      |                                                                   | 任何有效的 fetch 选项（`headers`、`mode`、`cache`、`signal` 等）（[文档](https://developer.mozilla.org/en-US/docs/Web/API/fetch#options)）                                 |

## querySerializer

OpenAPI 支持[不同的对象和数组序列化方式](https://swagger.io/docs/specification/serialization/#query)。默认情况下，此库使用 `style: "form", explode: true` 序列化数组，使用 `style: "deepObject", explode: true` 序列化对象，但你可以使用 `querySerializer` 选项自定义此行为（在 `createClient()` 上控制每个请求，或在单个请求上为一个请求控制）。

### 对象语法

openapi-fetch 提供了常见的序列化方法：

| 选项            |       类型        | 描述                                                                                                                                                      |
| :-------------- | :---------------: | :-------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `array`         | SerializerOptions | 设置数组的 `style` 和 `explode`（[文档](https://swagger.io/docs/specification/serialization/#query)）。默认值：`{ style: "form", explode: true }`。       |
| `object`        | SerializerOptions | 设置对象的 `style` 和 `explode`（[文档](https://swagger.io/docs/specification/serialization/#query)）。默认值：`{ style: "deepObject", explode: true }`。 |
| `allowReserved` |     `boolean`     | 设置为 `true` 以跳过 URL 编码（⚠️ 可能会破坏请求）（[文档](https://swagger.io/docs/specification/serialization/#query)）。默认值：`false`。               |

```ts
const client = createClient({
  querySerializer: {
    array: {
      style: "pipeDelimited", // "form" (默认) | "spaceDelimited" | "pipeDelimited"
      explode: true,
    },
    object: {
      style: "form", // "form" | "deepObject" (默认)
      explode: true,
    },
  },
});
```

#### 数组样式

| 样式                      | 数组 `id = [3, 4, 5]`   |
| :------------------------ | :---------------------- |
| form                      | `/users?id=3,4,5`       |
| **form (exploded, 默认)** | `/users?id=3&id=4&id=5` |
| spaceDelimited            | `/users?id=3%204%205`   |
| spaceDelimited (exploded) | `/users?id=3&id=4&id=5` |
| pipeDelimited             | `/users?id=3\|4\|5`     |
| pipeDelimited (exploded)  | `/users?id=3&id=4&id=5` |

#### 对象样式

| 样式                  | 对象 `id = {"role": "admin", "firstName": "Alex"}` |
| :-------------------- | :------------------------------------------------- |
| form                  | `/users?id=role,admin,firstName,Alex`              |
| form (exploded)       | `/users?role=admin&firstName=Alex`                 |
| **deepObject (默认)** | `/users?id[role]=admin&id[firstName]=Alex`         |

::: tip

对于 **deepObject** 这种复杂的对象结构, 无论你设置 `explode: true` 还是 `explode: false`，它都会生成相同的输出。

:::

### 替代函数语法

有时候你的后端不使用标准的序列化方法之一，此时你可以将一个函数传递给 `querySerializer`，自己序列化整个字符串。如果你处理你的参数中的深度嵌套对象和数组，也需要使用此方法：

```ts
const client = createClient({
  querySerializer(queryParams) {
    const search = [];
    for (const name in queryParams) {
      const value = queryParams[name];
      if (Array.isArray(value)) {
        for (const item of value) {
          s.push(`${name}[]=${encodeURIComponent(item)}`);
        }
      } else {
        s.push(`${name}=${encodeURLComponent(value)}`);
      }
    }
    return search.join(","); // ?tags[]=food,tags[]=california,tags[]=healthy
  },
});
```

::: warning

当自己序列化时，字符串将保持与作者编写的内容完全一样，因此你必须调用 [encodeURI](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/encodeURI) 或 [encodeURIComponent](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/encodeURIComponent) 来转义特殊字符。

:::

## bodySerializer

类似于 [querySerializer](#queryserializer)，bodySerializer 允许你自定义 requestBody 在你不想要默认 [JSON.stringify()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/stringify) 行为的情况下的序列化方式。当使用 `multipart/form-data` 时可能会用到：

```ts
const { data, error } = await client.PUT("/submit", {
  body: {
    name: "",
    query: { version: 2 },
  },
  bodySerializer(body) {
    const fd = new FormData();
    for (const name in body) {
      fd.append(name, body[name]);
    }
    return fd;
  },
});
```

## 路径序列化

openapi-fetch 支持根据你的 OpenAPI 架构中的具体格式自动进行[路径序列化](https://swagger.io/docs/specification/serialization/#path)：

| 模板              | 样式              | 基础类型 `id = 5` | 数组 `id = [3, 4, 5]`    | 对象 `id = {"role": "admin", "firstName": "Alex"}` |
| :---------------- | :---------------- | :---------------- | :----------------------- | :------------------------------------------------- |
| **`/users/{id}`** | **simple (默认)** | **`/users/5`**    | **`/users/3,4,5`**       | **`/users/role,admin,firstName,Alex`**             |
| `/users/{id*}`    | simple (爆炸)     | `/users/5`        | `/users/3,4,5`           | `/users/role=admin,firstName=Alex`                 |
| `/users/{.id}`    | label             | `/users/.5`       | `/users/.3,4,5`          | `/users/.role,admin,firstName,Alex`                |
| `/users/{.id*}`   | label (爆炸)      | `/users/.5`       | `/users/.3.4.5`          | `/users/.role=admin.firstName=Alex`                |
| `/users/{;id}`    | matrix            | `/users/;id=5`    | `/users/;id=3,4,5`       | `/users/;id=role,admin,firstName,Alex`             |
| `/users/{;id*}`   | matrix (爆炸)     | `/users/;id=5`    | `/users/;id=3;id=4;id=5` | `/users/;role=admin;firstName=Alex`                |

## 中间件

中间件是具有 `onRequest()` 和 `onResponse()` 回调的对象，可以观察和修改请求和响应。

```ts
import createClient from "openapi-fetch";
import type { paths } from "./my-openapi-3-schema"; // 由openapi-typescript生成

const myMiddleware: Middleware = {
  async onRequest(req, options) {
    // 设置 "foo" 标头
    req.headers.set("foo", "bar");
    return req;
  },
  async onResponse(res, options) {
    const { body, ...resOptions } = res;
    // 更改响应的状态
    return new Response(body, { ...resOptions, status: 200 });
  },
};

const client = createClient<paths>({ baseUrl: "https://myapi.dev/v1/" });

// 注册中间件
client.use(myMiddleware);
```

### onRequest

```ts
onRequest(req, options) {
  // …
}
```

`onRequest()` 接受 2 个参数：

| 名称      |        类型         | 描述                                                                                                                                                                        |
| :-------- | :-----------------: | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `req`     | `MiddlewareRequest` | 带有 `schemaPath`（OpenAPI 路径名）和 `params`（[params](/openapi-fetch/api#fetch-options) 对象）的标准 [Request](https://developer.mozilla.org/en-US/docs/Web/API/Request) |
| `options` |   `MergedOptions`   | [createClient](/openapi-fetch/api#create-client) 选项 + [fetch 覆盖](/openapi-fetch/api#fetch-options) 的组合                                                               |

它期望的结果要么是：

- **如果修改请求：** 一个 [Request](https://developer.mozilla.org/en-US/docs/Web/API/Request)
- **如果不修改：** `undefined`（void）

### onResponse

```ts
onResponse(res, options) {
  // …
}
```

`onResponse()` 也接受 2 个参数：

| 名称      |        类型         | 描述                                                                                                          |
| :-------- | :-----------------: | :------------------------------------------------------------------------------------------------------------ |
| `req`     | `MiddlewareRequest` | 一个标准的 [Response](https://developer.mozilla.org/en-US/docs/Web/API/Response)。                            |
| `options` |   `MergedOptions`   | [createClient](/openapi-fetch/api#create-client) 选项 + [fetch 覆盖](/openapi-fetch/api#fetch-options) 的组合 |

它期望的结果要么是：

- **如果修改响应：** 一个 [Response](https://developer.mozilla.org/en-US/docs/Web/API/Response)
- **如果不修改：** `undefined`（void）

### 跳过

如果你想要在某些条件下跳过中间件，只需尽早 `return`：

```ts
onRequest(req) {
  if (req.schemaPath !== "/projects/{project_id}") {
    return undefined;
  }
  // …
}
```

这将保持请求/响应不变，并将其传递给下一个中间件处理程序（如果有的话）。不需要内部回调或观察器库。

### 移除中间件

要移除中间件，请调用 `client.eject(middleware)`：

```ts{9}
const myMiddleware = {
  // …
};

// 注册中间件
client.use(myMiddleware);

// 删除中间件
client.eject(myMiddleware);
```

有关附加指南和示例，请参阅 [中间件 & 身份认证](/zh/openapi-fetch/middleware-auth)
