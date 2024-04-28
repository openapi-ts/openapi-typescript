---
title: 中间件 & 身份认证
---

# 中间件 & 身份认证

中间件允许您修改所有获取的请求、响应或两者之间的内容。其中一个最常见的用例是身份验证，但也可以用于日志记录/性能监控、抛出错误或处理特定的边缘情况。

## 中间件

每个中间件都可以提供 `onRequest()` 和 `onResponse()` 回调，用于观察/变更请求和响应。

::: code-group

```ts [src/my-project.ts]
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

:::

::: tip

中间件注册的顺序很重要。对于请求，`onRequest()` 将按注册的顺序调用。对于响应，`onResponse()` 将以**反向**顺序调用。这样，第一个中间件获取第一个请求的“权利”，并对最终响应具有最终控制权。

:::

### 跳过

如果您想在某些条件下跳过中间件，只需尽早`return`：

```ts
onRequest(req) {
  if (req.schemaPath !== "/projects/{project_id}") {
    return undefined;
  }
  // …
}
```

这将使请求/响应保持不变，并将事务传递给下一个中间件处理程序（如果有的话）。不需要内部回调或观察者库。

### 抛出

中间件还可以用于抛出 `fetch()` 通常不会抛出的错误，在像 [TanStack Query](https://tanstack.com/query/latest) 这样的库中很有用：

```ts
onResponse(res) {
  if (res.error) {
    throw new Error(res.error.message);
  }
}
```

### 移除中间件

要移除中间件，请调用 `client.eject(middleware)`：

```ts{9}
const myMiddleware = {
  // …
};

// 注册中间件
client.use(myMiddleware);

// 移除中间件
client.eject(myMiddleware);
```

### 处理状态性

由于中间件使用本机 `Request` 和 `Response` 实例，重要的是要记住 [bodies are stateful](https://developer.mozilla.org/en-US/docs/Web/API/Response/bodyUsed)。这意味着：

- 当进行修改时**创建新实例**（`new Request()` / `new Response()`）
- 当**不修改**时**克隆**（`res.clone().json()`）

默认情况下，`openapi-fetch` **不会**为了性能而任意克隆请求/响应；由您负责创建干净的副本。

<!-- prettier-ignore -->
```ts
const myMiddleware: Middleware = {
  onResponse(res) {
    if (res) {
      const data = await res.json(); // [!code --]
      const data = await res.clone().json(); // [!code ++]
      return undefined;
    }
  },
};
```

## 身份验证

这个库是非常开放的，并且可以与任何 [Authorization](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Authorization) 设置一起使用。但是这里有一些建议，可能会身份验证更容易。

### 基本身份验证

这个基本示例使用中间件在每个请求时检索最新的令牌。在我们的示例中，访问令牌保存在JavaScript模块状态中，这对于客户端应用程序是安全的，但对于服务器应用程序应该避免。

```ts
import createClient, { type Middleware } from "openapi-fetch";
import type { paths } from "./my-openapi-3-schema"; // 由openapi-typescript生成

let accessToken: string | undefined = undefined;

const authMiddleware: Middleware = {
  async onRequest(req) {
    // 获取令牌，如果不存在
    if (!accessToken) {
      const authRes = await someAuthFunc();
      if (authRes.accessToken) {
        accessToken = authRes.accessToken;
      } else {
        // 处理身份验证错误
      }
    }

    // (可选) 在此添加逻辑以在令牌过期时刷新令牌

    // 在每个请求中添加 Authorization 标头
    req.headers.set("Authorization", `Bearer ${accessToken}`);
    return req;
  },
};

const client = createClient<paths>({ baseUrl: "https://myapi.dev/v1/" });
client.use(authMiddleware);

const authRequest = await client.GET("/some/auth/url");
```

### 条件身份认证

如果某些路由不需要授权，您也可以使用中间件处理：

```ts
const UNPROTECTED_ROUTES = ["/v1/login", "/v1/logout", "/v1/public/"];

const authMiddleware = {
  onRequest(req) {
    if (UNPROTECTED_ROUTES.some((pathname) => req.url.startsWith(pathname))) {
      return undefined; // 不要修改某些路径的请求
    }

    // 对于所有其他路径，按预期设置 Authorization 标头
    req.headers.set("Authorization", `Bearer ${accessToken}`);
    return req;
  },
};
```
