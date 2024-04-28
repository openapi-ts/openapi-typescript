---
title: openapi-typescript
description: Quickstart
---

<img src="/assets/openapi-ts.svg" alt="openapi-typescript" width="200" height="40" />

::: warning

7.x 文档适用于尚未达到生产就绪状态的 beta 版本。请参阅 [6.x](/6.x/introduction) 文档以获取稳定版本的信息。

:::

openapi-typescript 使用 Node.js 快速将 [OpenAPI 3.0 & 3.1](https://spec.openapis.org/oas/latest.html) 模式转换为 TypeScript。无需 Java/node-gyp/运行 OpenAPI 服务器。

该代码受到 [MIT 许可](https://github.com/drwpow/openapi-typescript/blob/main/packages/openapi-typescript/LICENSE") 保护，可免费使用。

## 特性

- ✅ 支持 OpenAPI 3.0 和 3.1（包括高级功能，如[辨别器](https://spec.openapis.org/oas/v3.1.0#discriminator-object)）
- ✅ 生成**无运行时的类型**，性能优于老式代码生成
- ✅ 从本地或远程加载 YAML 或 JSON 模式
- ✅ 在毫秒内生成即使是庞大模式的类型

_注意：OpenAPI 2.x 在版本 `5.x` 及更早版本中受支持_

## 示例

👀 [查看示例](https://github.com/drwpow/openapi-typescript/blob/main/packages/openapi-typescript/examples/)

## 安装

此库需要安装最新版本的 [Node.js](https://nodejs.org)（建议使用 20.x 或更高版本）。安装完成后，在项目中运行以下命令：

```bash
npm i -D openapi-typescript@next typescript
```

::: tip 强烈推荐

在您的 `tsconfig.json` 中启用 [noUncheckedIndexedAccess](https://www.typescriptlang.org/tsconfig#noUncheckedIndexedAccess)（[文档](/zh/advanced#enable-nouncheckedindexaccess-in-your-tsconfigjson)）

:::

## 基本用法

首先，通过运行 `npx openapi-typescript` 生成本地类型文件，首先指定输入模式（JSON 或 YAML）以及您想保存 `--output`（`-o`） 的位置：

```bash
# 本地模式
npx openapi-typescript ./path/to/my/schema.yaml -o ./path/to/my/schema.d.ts
# 🚀 ./path/to/my/schema.yaml -> ./path/to/my/schema.d.ts [7ms]

# 远程模式
npx openapi-typescript https://myapi.dev/api/v1/openapi.yaml -o ./path/to/my/schema.d.ts
# 🚀 https://myapi.dev/api/v1/openapi.yaml -> ./path/to/my/schema.d.ts [250ms]
```

然后在您的 TypeScript 项目中，根据需要导入类型：

::: code-group

```ts [src/my-project.ts]
import type { paths, components } from "./my-openapi-3-schema"; // 由openapi-typescript生成

// 模式对象
type MyType = components["schemas"]["MyType"];

// 路径参数
type EndpointParams = paths["/my/endpoint"]["parameters"];

// 响应对象
type SuccessResponse =
  paths["/my/endpoint"]["get"]["responses"][200]["content"]["application/json"]["schema"];
type ErrorResponse =
  paths["/my/endpoint"]["get"]["responses"][500]["content"]["application/json"]["schema"];
```

:::

从这里开始，您可以将这些类型用于以下任何操作（但不限于）：

- 使用支持 OpenAPI 的 fetch 客户端（例如 [openapi-fetch](/zh/openapi-fetch/)）
- 断言其他 API 请求体和响应的类型
- 基于 API 类型构建核心业务逻辑
- 验证模拟测试数据是否与当前模式保持最新
- 将 API 类型打包到您发布的任何 npm 包中（例如客户端 SDK 等）
