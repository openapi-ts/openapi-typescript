---
title: 关于 openapi-fetch
description: openapi-fetch Project Goals, comparisons, and more
---

<script setup>
  import { VPTeamMembers } from 'vitepress/theme';
  import contributors from '../../data/contributors.json';
</script>

# 关于

## 项目目标

1. 类型应该严格，并且应该从 OpenAPI 模式中自动推断出绝对最少数量的泛型。
2. 使用原生的 Fetch API，同时减少样板代码（例如 `await res.json()`）。
3. 尽可能轻巧和高性能。

## 差异

### 与 Axios 比较

[Axios](https://axios-http.com) 不会根据您的 OpenAPI 模式自动进行类型检查。此外，没有简单的方法来执行此操作。Axios 拥有比 openapi-fetch 更多的功能，如拦截器和取消请求。

### 与 tRPC 比较

[tRPC](https://trpc.io/) 适用于后端和前端都使用 TypeScript（Node.js）编写的项目。openapi-fetch 是通用的，可以与遵循 OpenAPI 3.x 模式的任何后端一起使用。

### 与 openapi-typescript-fetch 比较

[openapi-typescript-fetch](https://github.com/ajaishankar/openapi-typescript-fetch) 在 openapi-fetch 之前发布，基本上在目的上几乎相同，但在语法上有所不同（因此更多是一种有意见的选择）：

- openapi-typescript-fetch 对于非 OK 响应会抛出异常（需要您用 `try/catch` 包装），而不是遵循不抛出的 Fetch API 规范。
- openapi-typescript-fetch 的语法更冗长，并依赖链式调用（`.path(…).method(…).create()`）。

### 与 openapi-typescript-codegen 比较

[openapi-typescript-codegen](https://github.com/ferdikoomen/openapi-typescript-codegen) 是一个代码生成库，与 openapi-fetch 的“无代码生成”方法根本不同。openapi-fetch 使用静态 TypeScript 类型检查，所有这些都在构建时进行，没有客户端权重，也没有运行时性能损失。传统的代码生成会生成数百（如果不是数千）个不同的函数，所有这些都占用客户端权重并减慢运行时。

### 与 Swagger Codegen 比较

Swagger Codegen 是 Swagger/OpenAPI 的原始代码生成项目，与其他代码生成方法一样，存在大小膨胀和运行时性能问题。此外，Swagger Codegen 需要 Java 运行时才能工作，而 openapi-typescript/openapi-fetch 不需要，因为它们是本地的 Node.js 项目。

## 贡献者

没有这些令人惊奇的贡献者，这个库将无法实现：

<VPTeamMembers size="small" :members="contributors['openapi-fetch']" />