---
title: openapi-typescript Node.js API
description: Programmatic usage and unlimited flexibility.
---

# Node.js API

Node.js API 对于处理动态创建的模式或在较大应用程序上下文中使用时可能很有用。传递一个 JSON 友好对象以从内存加载模式，或传递一个字符串以从本地文件或远程 URL 加载模式。

## 安装

```bash
npm i --save-dev openapi-typescript@next typescript
```

::: tip 推荐

为了获得最佳体验，请在 `package.json` 中添加 `"type": "module"`，以使用 Node ESM ([文档](https://nodejs.org/api/esm.html#enabling))。

:::

## 使用

Node.js API 接受 `URL`、`string` 或 JSON 对象作为输入：

|   类型   | 描述                  | 示例                                                                                                                             |
| :------: | :-------------------- | :------------------------------------------------------------------------------------------------------------------------------- |
|  `URL`   | 读取本地或远程文件    | `await openapiTS(new URL('./schema.yaml', import.meta.url))`<br/>`await openapiTS(new URL('https://myapi.com/v1/openapi.yaml'))` |
| `string` | 读取动态 YAML 或 JSON | `await openapiTS('openapi: "3.1" … ')`                                                                                           |
|  `JSON`  | 读取动态 JSON         | `await openapiTS({ openapi: '3.1', … })`                                                                                         |

它还接受 `Readable` 流和 `Buffer` 类型，这些类型将被解析并视为字符串（无法在没有整个文档的情况下进行验证、捆绑和类型生成）。

Node API 返回一个带有 TypeScript AST 的 `Promise`。然后，您可以按需遍历/操作/修改 AST。

要将 TypeScript AST 转换为字符串，可以使用 `astToString()` 辅助函数，它是对 [TypeScript’s printer](https://github.com/microsoft/TypeScript/wiki/Using-the-Compiler-API#re-printing-sections-of-a-typescript-file) 的简单封装：

::: code-group

```ts [src/my-project.ts]
import fs from "node:fs";
import openapiTS, { astToString } from "openapi-typescript";

const ast = await openapiTS(new URL("./my-schema.yaml", import.meta.url));
const contents = astToString(ast);

// （可选）写入文件
fs.writeFileSync("./my-schema.ts", contents);
```

:::

### Redoc 配置

使用 openapi-typescript 不需要 Redoc 配置。默认情况下，它扩展了内置配置 `"minimal"`。但如果要修改默认设置，您需要向 Node API 提供完全初始化的 Redoc 配置。您可以使用 `@redocly/openapi-core` 中的辅助函数完成这个任务：

::: code-group

```ts [src/my-project.ts]
import { createConfig, loadConfig } from "@redocly/openapi-core";
import openapiTS from "openapi-typescript";

// 选项 1：在内存中创建配置
const redoc = await createConfig(
  {
    apis: {
      "core@v2": { … },
      "external@v1": { … },
    },
  },
  { extends: ["recommended"] },
);

// 选项 2：从 redocly.yaml 文件加载
const redoc = await loadConfig({ configPath: "redocly.yaml" });

const ast = await openapiTS(mySchema, { redoc });
```

:::

## 选项

Node API 支持所有 [CLI 参数](/zh/cli#命令行参数)（采用 `camelCase` 格式），以及以下额外选项：

| 名称            |      类型       |     默认值      | 描述                                                            |
| :-------------- | :-------------: | :-------------: | :-------------------------------------------------------------- |
| `transform`     |   `Function`    |                 | 在某些情况下覆盖默认的 Schema Object ➝ TypeScript 转换器        |
| `postTransform` |   `Function`    |                 | 与 `transform` 相同，但在 TypeScript 转换之后运行               |
| `silent`        |    `boolean`    |     `false`     | 静默警告消息（致命错误仍将显示）                                |
| `cwd`           | `string \| URL` | `process.cwd()` | （可选）提供当前工作目录以帮助解析远程 `$ref`（如果需要的话）。 |

### transform / postTransform

使用 `transform()` 和 `postTransform()` 选项覆盖默认的 Schema Object 转换器。这对于为模式的特定部分提供非标准修改很有用。

- `transform()` 在转换为 TypeScript 之前运行（您正在使用原始 OpenAPI 节点）
- `postTransform()` 在转换为 TypeScript 之后运行（您正在使用 TypeScript AST）

#### 示例：`Date` 类型

例如，假设您的模式具有以下属性：

::: code-group

```yaml [my-openapi-3-schema.yaml]
properties:
  updated_at:
    type: string
    format: date-time
```

:::

默认情况下，openapiTS 将生成 `updated_at?: string;`，因为它不确定您希望按照 `"date-time"`（格式是非标准的，可以是任何您喜欢的东西）的哪种格式。但我们可以通过提供自己的自定义格式化程序来增强此功能，如下所示：

::: code-group

```ts [src/my-project.ts]
import openapiTS from "openapi-typescript";
import ts from "typescript";

const DATE = ts.factory.createIdentifier("Date"); // `Date`
const NULL = ts.factory.createLiteralTypeNode(ts.factory.createNull()); // `null`

const ast = await openapiTS(mySchema, {
  transform(schemaObject, metadata) {
    if (schemaObject.format === "date-time") {
      return schemaObject.nullable
        ? ts.factory.createUnionTypeNode([DATE, NULL])
        : DATE;
    }
  },
});
```

:::

这将导致以下更改：

::: code-group

```ts [my-openapi-3-schema.d.ts]
updated_at?: string; // [!code --]
updated_at: Date | null; // [!code ++]
```

:::

#### 示例：`Blob` 类型

另一种常见的转换是对文件上传的处理，其中请求的 `body` 是 `multipart/form-data`，带有一些 `Blob` 字段的情况。以下是一个示例模式：

::: code-group

```yaml [my-openapi-3-schema.yaml]
Body_file_upload:
  type: object;
  properties:
    file:
      type: string;
      format: binary;
```

:::

使用相同的模式来转换类型：

::: code-group

```ts [src/my-project.ts]
import openapiTS from "open

api-typescript";
import ts from "typescript";

const BLOB = ts.factory.createIdentifier("Blob"); // `Blob`
const NULL = ts.factory.createLiteralTypeNode(ts.factory.createNull()); // `null`

const ast = await openapiTS(mySchema, {
  transform(schemaObject, metadata) {
    if (schemaObject.format === "binary") {
      return schemaObject.nullable
        ? ts.factory.createUnionTypeNode([BLOB, NULL])
        : BLOB;
    }
  },
});
```

:::

具有正确类型的 `file` 属性的结果差异：

::: code-group

```ts [my-openapi-3-schema.d.ts]
file?: string; // [!code --]
file: Blob | null; // [!code ++]
```

:::

#### 示例：向属性添加 "?" 标记

使用上述 `transform` 函数不能创建带有可选 "?" 标记的属性。`transform` 函数还接受不同的返回对象，该对象允许向属性添加 "?" 标记。以下是一个示例模式：

::: code-group

```yaml [my-openapi-3-schema.yaml]
Body_file_upload:
  type: object;
  properties:
    file:
      type: string;
      format: binary;
      required: true;
```

:::

在这里，我们返回一个带有模式属性的对象，与上面的示例相同，但我们还添加了 `questionToken` 属性，这将在属性中添加 "?" 标记。

::: code-group

```ts [src/my-project.ts]
import openapiTS from "openapi-typescript";
import ts from "typescript";

const BLOB = ts.factory.createIdentifier("Blob"); // `Blob`
const NULL = ts.factory.createLiteralTypeNode(ts.factory.createNull()); // `null`

const ast = await openapiTS(mySchema, {
  transform(schemaObject, metadata) {
    if (schemaObject.format === "binary") {
      return {
        schema: schemaObject.nullable
          ? ts.factory.createUnionTypeNode([BLOB, NULL])
          : BLOB,
        questionToken: true,
      };
    }
  },
});
```

:::

带有正确类型和 "?" 标记的 `file` 属性的结果差异：

::: code-group

```ts [my-openapi-3-schema.d.ts]
file: Blob; // [!code --]
file?: Blob | null; // [!code ++]
```

:::

您的模式中的任何 [Schema Object](https://spec.openapis.org/oas/latest.html#schema-object) 都将通过此格式化程序（甚至是远程的！）。还请务必检查 `metadata` 参数，以获取可能有用的其他上下文。

除了检查 `format` 之外，还有许多其他用途。由于此必须返回一个 **字符串**，因此您可以生成任何您想要的任意 TypeScript 代码（甚至是您自己的自定义类型）。
