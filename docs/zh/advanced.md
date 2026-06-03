---
title: 高级用法
description: Advanced usage as well as tips, tricks, and best practices
---

# 高级用法

高级用法和各种主题。将此解释为对**大多数**人的松散建议，如果它不适合您的设置，请随意忽略!

## 调试

要启用调试，请设置环境变量`DEBUG=openapi-ts:*`，如下所示：

```sh
$ DEBUG=openapi-ts:* npx openapi-typescript schema.yaml -o my-types.ts
```

要仅查看某些类型的调试消息，可以设置`DEBUG=openapi-ts:[scope]`。有效的范围包括`redoc`、`lint`、`bundle`和`ts`。

请注意，如果输出为`stdout`，将抑制调试消息。

## 枚举扩展

`x-enum-varnames`可用于为相应的值定义另一个枚举名称。这用于定义枚举项的名称。

`x-enum-descriptions`可用于为每个值提供个别描述。这用于代码中的注释（如果目标语言是Java，则类似于javadoc）。

`x-enum-descriptions`和`x-enum-varnames`各自都被期望是包含与枚举相同数量的项的项目列表。列表中项的顺序很重要：它们的位置用于将它们组合在一起。

示例：

```yaml
ErrorCode:
  type: integer
  format: int32
  enum:
    - 100
    - 200
    - 300
  x-enum-varnames:
    - Unauthorized
    - AccessDenied
    - Unknown
  x-enum-descriptions:
    - "User is not authorized"
    - "User has no access to this resource"
    - "Something went wrong"
```

将导致：

```ts
enum ErrorCode {
  // User is not authorized
  Unauthorized = 100
  // User has no access to this resource
  AccessDenied = 200
  // Something went wrong
  Unknown = 300
}
```

或者，您还可以使用`x-enumNames`和`x-enumDescriptions` ([NSwag/NJsonSchema](https://github.com/RicoSuter/NJsonSchema/wiki/Enums#enum-names-and-descriptions))。

## 风格指南

改进类型生成的一些建议。

### Redocly 规则

为了减少TypeScript生成中的错误，建议在[Redocly配置](https://redocly.com/docs/cli/rules/built-in-rules/)中强制执行以下内置规则：

| 规则                                                         |      设置      | 原因               |
| :----------------------------------------------------------- | :------------: | :----------------- |
| [operation-operationId-unique](https://redocly.com/docs/cli/rules/built-in-rules/#operations) |    `error`     | 防止无效的TS生成   |
| [operation-parameters-unique](https://redocly.com/docs/cli/rules/built-in-rules/#parameters) |    `error`     | 防止丢失参数       |
| [path-not-include-query](https://redocly.com/docs/cli/rules/built-in-rules/#parameters) |    `error`     | 防止丢失参数       |
| [spec](https://redocly.com/docs/cli/rules/built-in-rules/#special-rules) | `3.0` 或 `3.1` | 启用更好的模式检查 |

### 支持在 JS 中使用 `snake_case`

不同的语言有不同的首选语法风格。举几个例子：

- `snake_case`
- `SCREAMING_SNAKE_CASE`
- `camelCase`
- `PascalCase`
- `kebab-case`

希望将 API 响应重命名为大多数 JS 风格指南鼓励的`camelCase`。然而，**避免重命名**，因为除了是一个时间浪费外，还引入以下维护问题：

- ❌ 生成的类型（例如由 openapi-typescript 生成的类型）现在必须手动键入
- ❌ 重命名必须在运行时发生，这意味着您正在减慢应用程序进行隐藏的更改
- ❌ 必须构建和维护（以及测试！）名称转换工具
- ❌ API 可能需要 `snake_case` 用于 `requestBodies`，因此现在必须为每个 API 请求撤消所有这项工作

相反，将“一致性”视为更全面的概念，认识到保留 API 架构的原样比遵循 JS 样式约定更好。

### 在 TSConfig 中启用 `noUncheckedIndexedAccess`

在 TSConfig 中启用 `compilerOptions.noUncheckedIndexedAccess`（[文档](https://www.typescriptlang.org/tsconfig#noUncheckedIndexedAccess)），以便将 `additionalProperties` 键类型化为 `T | undefined`。

[Additional Properties](https://swagger.io/docs/specification/data-models/dictionaries/)（字典）的默认行为将生成类型 `Record<string, T>`，这可能会很容易产生空引用错误。 TypeScript 允许您在不先检查键是否存在的情况下访问任何任意键，因此它不能防止拼写错误或事件键确实丢失。

### 在模式中具体说明

openapi-typescript **永远不会生成 `any` 类型**。任何未在模式中明确说明的内容实际上都不存在。因此，始终尽可能具体。以下是如何充分利用 `additionalProperties` 的方法：

<table>
  <thead>
    <tr>
      <td style="width:10%"></td>
      <th scope="col" style="width:40%">模式</th>
      <th scope="col" style="width:40%">生成的类型</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <th scope="row">
        ❌ 不好
      </th>
      <td>


```yaml
type: object
```

</td>
      <td>

```ts
Record<string, never>;
```

</td>
    </tr>
    <tr>
      <th scope="row">
        ❌ 较差
      </th>
      <td>

```yaml
type: object
additionalProperties: true
```

</td>
      <td>

```ts
Record<string, unknown>;
```

</td>
    </tr>
    <tr>
      <th scope="row">
        ✅ 最佳
      </th>
      <td>

```yaml
type: object
additionalProperties:
  type: string
```

</td>
      <td>

```ts
Record<string, string>;
```

</td>
    </tr>

  </tbody>
</table>

至于**元组类型**，通过在模式中表示该类型，您还将获得更好的结果。这是类型化 `[x, y]` 坐标元组的最佳方法：

<table>
  <thead>
    <tr>
      <td style="width:10%">&nbsp;</td>
      <th scope="col" style="width:40%">模式</th>
      <th scope="col" style="width:40%">生成的类型</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <th scope="row">
        ❌ 不好
      </th>
      <td>


```yaml
type: array
```

</td>
      <td>

```ts
unknown[]
```

</td>
    </tr>
    <tr>
      <th scope="row">
        ❌ 较差
      </th>
      <td>

```yaml
type: array
items:
  type: number
```

</td>
      <td>

```ts
number[]
```

</td>
    </tr>
    <tr>
      <th scope="row">
        ✅ 最佳
      </th>
      <td>

```yaml
type: array
items:
  type: number
maxItems: 2
minItems: 2
```

— 或 —

```yaml
type: array
items:
  type: number
prefixItems:
  - number
  - number
```

</td>
      <td>

```ts
[number, number];
```

</td>
    </tr>

  </tbody>
</table>

### 单独使用 `oneOf`

OpenAPI 的组合工具（`oneOf`/`anyOf`/`allOf`）是减少模式中的代码量的强大工具，同时最大化灵活性。然而，TypeScript 联合类型不提供[XOR行为](https://en.wikipedia.org/wiki/Exclusive_or)，这意味着它们不能直接映射到 `oneOf`。因此，建议单

独使用 `oneOf`，而不与其他组合方法或其他属性结合使用。例如：

#### ❌ 不好

```yaml
Pet:
  type: object
  properties:
    type:
      type: string
      enum:
        - cat
        - dog
        - rabbit
        - snake
        - turtle
    name:
      type: string
  oneOf:
    - $ref: "#/components/schemas/Cat"
    - $ref: "#/components/schemas/Dog"
    - $ref: "#/components/schemas/Rabbit"
    - $ref: "#/components/schemas/Snake"
    - $ref: "#/components/schemas/Turtle"
```

这将生成以下类型，混合了 TypeScript 联合和交叉。虽然这是有效的 TypeScript，但它很复杂，推断可能不会按您打算的那样工作。但最大的问题是 TypeScript 无法通过 `type` 属性进行区分：

```ts
  Pet: ({
    /** @enum {string} */
    type?: "cat" | "dog" | "rabbit" | "snake" | "turtle";
    name?: string;
  }) & (components["schemas"]["Cat"] | components["schemas"]["Dog"] | components["schemas"]["Rabbit"] | components["schemas"]["Snake"] | components["schemas"]["Turtle"]);
```

#### ✅ 更好

```yaml
Pet:
  oneOf:
    - $ref: "#/components/schemas/Cat"
    - $ref: "#/components/schemas/Dog"
    - $ref: "#/components/schemas/Rabbit"
    - $ref: "#/components/schemas/Snake"
    - $ref: "#/components/schemas/Turtle"
PetCommonProperties:
  type: object
  properties:
    name:
      type: string
Cat:
  allOf:
    - "$ref": "#/components/schemas/PetCommonProperties"
  type:
    type: string
    enum:
      - cat
```

生成的类型不仅更简单；TypeScript 现在可以使用 `type` 进行区分（注意 `Cat` 具有单个枚举值 `"cat"` 的 `type`）。

```ts
Pet: components["schemas"]["Cat"] | components["schemas"]["Dog"] | components["schemas"]["Rabbit"] | components["schemas"]["Snake"] | components["schemas"]["Turtle"];
Cat: { type?: "cat"; } & components["schemas"]["PetCommonProperties"];
```

_注意：您可以选择在 `Pet` 上提供 `discriminator.propertyName: "type"`（[文档](https://spec.openapis.org/oas/v3.1.0#discriminator-object)），以自动生成 `type` 键，但这样做不够明确。_

虽然模式允许您以任何方式使用组合，但总是要查看生成的类型，看看是否有更简单的表达方式。限制使用 `oneOf` 不是唯一的方法，但通常产生最大的好处。

## JSONSchema $defs 注意事项

[JSONSchema $defs](https://json-schema.org/understanding-json-schema/structuring.html#defs) 可以用于在任何地方提供子模式定义。然而，这些可能无法干净地转换为 TypeScript。例如，这样可以：

```yaml
components:
  schemas:
    DefType:
      type: object # ✅ `type: "object"` 是可以在上面定义 $defs 的
      $defs:
        myDefType:
          type: string
    MyType:
      type: object
      properties:
        myType:
          $ref: "#/components/schemas/DefType/$defs/myDefType"
```

这将转换为以下 TypeScript：

```ts
export interface components {
  schemas: {
    DefType: {
      $defs: {
        myDefType: string;
      };
    };
    MyType: {
      myType?: components["schemas"]["DefType"]["$defs"]["myDefType"]; // ✅ 可以工作
    };
  };
}
```

但这样不能：

```yaml
components:
  schemas:
    DefType:
      type: string # ❌ 这将失去其 $defs
      $defs:
        myDefType:
          type: string
    MyType:
      properties:
        myType:
          $ref: "#/components/schemas/DefType/$defs/myDefType"
```

因为它将转换为：

```ts
export interface components {
  schemas: {
    DefType: string;
    MyType: {
      myType?: components["schemas"]["DefType"]["$defs"]["myDefType"]; // ❌ 类型 'String' 上不存在属性 '$defs'。
    };
  };
}
```

因此，请注意在何处定义 `$defs`，因为它们可能在最终生成的类型中丢失。

::: tip

有疑问时，您始终可以在根模式级别定义 `$defs`。

:::