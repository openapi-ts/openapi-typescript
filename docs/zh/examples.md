---
title: 示例
description: Using openapi-typescript in real-world applications
---

# 示例

openapi-typescript生成的类型是通用的，可以以各种方式使用。虽然这些示例不够全面，但希望它们能激发你如何在应用程序中使用这些类型的想法。

## 数据获取

可以使用**自动生成类型的fetch包装器**简单而安全地获取数据：

- [openapi-fetch](/openapi-fetch/)（推荐）
- [openapi-typescript-fetch](https://www.npmjs.com/package/openapi-typescript-fetch) 由 [@ajaishankar](https://github.com/ajaishankar)

::: tip
一个良好的fetch包装器**不应使用泛型**。泛型需要更多的输入，并且可能隐藏错误！
:::

## Hono

[Hono](https://hono.dev/) 是一个现代的用于 Node.js 的服务器框架，可以轻松部署到网络中（例如 [Cloudflare Workers](https://developers.cloudflare.com/workers/)），就像部署到标准容器一样。它还内置了 TypeScript，因此非常适合生成的类型。

在[使用 CLI 生成类型之后](/zh/introduction)，为每个端点传递适当的 `paths` 响应：

```ts
import { Hono } from "hono";
import { components, paths } from "./path/to/my/types";

const app = new Hono();

/** /users */
app.get("/users", async (ctx) => {
  try {
    const users = db.get("SELECT * from users");
    return ctx.json<
      paths["/users"]["responses"][200]["content"]["application/json"]
    >(users);
  } catch (err) {
    return ctx.json<components["schemas"]["Error"]>({
      status: 500,
      message: err ?? "An error occurred",
    });
  }
});

export default app;
```

::: tip
在服务器环境中进行类型检查可能很棘手，因为通常会查询数据库并与 TypeScript 无法内省的其他端点通信。但是使用泛型将使你能够注意到 TypeScript **能够** 捕获的明显错误（在你的堆栈中可能有更多具有类型的东西，而你并不了解！）。
:::

## Mock-Service-Worker (MSW)

如果你正在使用 Mock Service Worker (MSW) 来定义 API 的模拟数据，你可以使用一个 小巧、自动类型化的封装 来包裹 MSW，这样当你的 OpenAPI 规范发生变化时，你可以轻松解决 API 模拟数据中的冲突。最终，你可以对应用程序的 API 客户端和 API 模拟数据具有相同的信心水平。

使用 `openapi-typescript` 和一个 fetch 的包装器，比如 `openapi-fetch`，可以确保我们应用程序的 API 客户端不会与 OpenAPI 规范冲突。

然而，虽然你可以轻松解决 API 客户端的问题，但你必须手动记住调整 API 模拟，因为没有机制提醒你有冲突。

我们推荐使用以下的包装器，它与 `openapi-typescript` 完美配合：

- [openapi-msw](https://www.npmjs.com/package/openapi-msw) by [@christoph-fricke](https://github.com/christoph-fricke)

## 测试模拟

测试出现误报的最常见原因之一是模拟数据与实际 API 响应不同步。

`openapi-typescript` 提供了一种极好的方法来防范这种情况，而且付出的努力很小。下面是一个示例，演示如何编写一个帮助函数，对所有模拟数据进行类型检查以符合你的 OpenAPI 架构（我们将使用 [vitest](https://vitest.dev/)/[vitest-fetch-mock](https://www.npmjs.com/package/vitest-fetch-mock)，但相同的原理也适用于任何设置）：

假设我们想要按照以下对象结构编写模拟数据，以便一次性模拟多个端点：

```ts
{
  [pathname]: {
    [HTTP method]: { status: [status], body: { …[some mock data] } };
  }
}
```

使用我们生成的类型，我们可以推断出任何给定路径 + HTTP 方法 + 状态码的**正确数据结构**。示例测试如下：

::: code-group [my-test.test.ts]

```ts
import { mockResponses } from "../test/utils";

describe("My API test", () => {
  it("mocks correctly", async () => {
    mockResponses({
      "/users/{user_id}": {
        // ✅ 正确的 200 响应
        get: { status: 200, body: { id: "user-id", name: "User Name" } },
        // ✅ 正确的 403 响应
        delete: { status: 403, body: { code: "403", message: "Unauthorized" } },
      },
      "/users": {
        // ✅ 正确的 201 响应
        put: { 201: { status: "success" } },
      },
    });

    // 测试 1: GET /users/{user_id}: 200
    await fetch("/users/user-123");

    // 测试 2: DELETE /users/{user_id}: 403
    await fetch("/users/user-123", { method: "DELETE" });

    // 测试 3: PUT /users: 200
    await fetch("/users", {
      method: "PUT",
      body: JSON.stringify({ id: "new-user", name: "New User" }),
    });

    // 测试清理
    fetchMock.resetMocks();
  });
});
```

:::

_注意：此示例使用原始的 `fetch()` 函数，但可以将任何 fetch 包装器（包括 [openapi-fetch](/openapi-fetch/)）直接替换，而不需要进行任何更改。_

而能够实现这一点的魔法将存储在 `test/utils.ts` 文件中，可以在需要的地方复制 + 粘贴（为简单起见进行隐藏）：

<details>
<summary>📄 <strong>test/utils.ts</strong></summary>

::: code-group [test/utils.ts]

```ts
import type { paths } from "./my-openapi-3-schema"; // 由openapi-typescript生成
// 设置
// ⚠️ 重要：请更改这个！这是所有 URL 的前缀
const BASE_URL = "https://myapi.com/v1";
// 结束设置
// 类型帮助程序 —— 忽略这些；这只是使 TS 查找更好的工具，无关紧要。
type FilterKeys<Obj, Matchers> = {
  [K in keyof Obj]: K extends Matchers ? Obj[K] : never;
}[keyof Obj];
type PathResponses<T> = T extends { responses: any } ? T["responses"] : unknown;
type OperationContent<T> = T extends { content: any } ? T["content"] : unknown;
type MediaType = `${string}/${string}`;
type MockedResponse<T, Status extends keyof T = keyof T> =
  FilterKeys<OperationContent<T[Status]>, MediaType> extends never
    ? { status: Status; body?: never }
    : {
        status: Status;
        body: FilterKeys<OperationContent<T[Status]>, MediaType>;
      };
/**
 * 模拟 fetch() 调用并根据 OpenAPI 架构进行类型检查
 */
export function mockResponses(responses: {
  [Path in keyof Partial<paths>]: {
    [Method in keyof Partial<paths[Path]>]: MockedResponse<
      PathResponses<paths[Path][Method]>
    >;
  };
}) {
  fetchMock.mockResponse((req) => {
    const mockedPath = findPath(
      req.url.replace(BASE_URL, ""),
      Object.keys(responses)
    )!;
    // 注意：这里的类型我们使用了懒惰的方式，因为推断是不好的，而且这有一个 `void` 返回签名。重要的是参数签名。
    if (!mockedPath || !(responses as any)[mockedPath])
      throw new Error(`No mocked response for ${req.url}`); // 如果未模拟响应，则抛出错误（如果希望有不同的行为，则删除或修改）
    const method = req.method.toLowerCase();
    if (!(responses as any)[mockedPath][method])
      throw new Error(`${req.method} called but not mocked on ${mockedPath}`); // 类似地，如果响应的其他部分没有模拟，则抛出错误
    if (!(responses as any)[mockedPath][method]) {
      throw new Error(`${req.method} called but not mocked on ${mockedPath}`);
    }
    const { status, body } = (responses as any)[mockedPath][method];
    return { status, body: JSON.stringify(body) };
  });
}
// 匹配实际 URL（/users/123）与 OpenAPI 路径（/users/{user_id} 的辅助函数）
export function findPath(
  actual: string,
  testPaths: string[]
): string | undefined {
  const url = new URL(
    actual,
    actual.startsWith("http") ? undefined : "http://testapi.com"
  );
  const actualParts = url.pathname.split("/");
  for (const p of testPaths) {
    let matched = true;
    const testParts = p.split("/");
    if (actualParts.length !== testParts.length) continue; // 如果长度不同，则自动不匹配
    for (let i = 0; i < testParts.length; i++) {
      if (testParts[i]!.startsWith("{")) continue; // 路径参数（{user_id}）始终算作匹配
      if (actualParts[i] !== testParts[i]) {
        matched = false;
        break;
      }
    }
    if (matched) return p;
  }
}
```

:::

::: info 补充说明
上面的代码相当复杂！在大多数情况下，这是大量的实现细节，你可以忽略。 `mockResponses（…）` 函数签名是所有重要的魔法发生的地方，你会注意到这个结构与我们的设计之间有直接的链接。从那里，代码的其余部分只是使运行时按预期工作。
:::

```ts
export function mockResponses(responses: {
  [Path in keyof Partial<paths>]: {
    [Method in keyof Partial<paths[Path]>]: MockedResponse<
      PathResponses<paths[Path][Method]>
    >;
  };
});
```

</details>

现在，每当你的架构更新时，所有的模拟数据都将得到正确的类型检查 🎉。这是确保测试具有弹性和准确性的重要步骤。
