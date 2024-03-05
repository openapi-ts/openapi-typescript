---
title: 关于 openapi-typescript
description: Additional info about this project
---

<script setup>
  import { VPTeamMembers } from 'vitepress/theme';
  import contributors from '../data/contributors.json';
</script>

# 关于 openapi-typescript

## 使用者

- [**Bigcommerce**](https://github.com/bigcommerce/bigcommerce-api-node): 用于 BigCommerce API 的 Node SDK
- [**Budibase**](https://github.com/Budibase/budibase): 用于创建内部工具、工作流和管理面板的低代码平台
- [**Fedora `fmn`**](https://github.com/fedora-infra/fmn): Fedora 消息基础设施的工具和 API
- [**Fingerprint**](https://github.com/fingerprintjs/fingerprintjs-pro-server-api-node-sdk): 高规模应用的设备指纹技术
- [**Google Firebase CLI**](https://github.com/firebase/firebase-tools): 用于 Google Firebase 平台的官方 CLI
- [**GitHub Octokit**](https://github.com/octokit): GitHub API 的官方 SDK
- [**Lotus**](https://github.com/uselotus/lotus): 开源定价和打包基础设施
- [**Jitsu**](https://github.com/jitsucom/jitsu): 现代、开源的数据摄取/数据流水线
- [**Medusa**](https://github.com/medusajs/medusa): 数字商务的构建模块
- [**Netlify**](https://netlify.com): 现代开发平台
- [**Nuxt**](https://github.com/unjs/nitro): 直观的 Vue 框架
- [**Relevance AI**](https://github.com/RelevanceAI/relevance-js-sdk): 构建和部署 AI 链
- [**Revolt**](https://github.com/revoltchat/api): 开源用户优先的聊天平台
- [**Spacebar**](https://github.com/spacebarchat): 免费、开源、可自托管的与 Discord 兼容的聊天/语音/视频平台
- [**Supabase**](https://github.com/supabase/supabase): 开源的 Firebase 替代方案
- [**Twitter API**](https://github.com/twitterdev/twitter-api-typescript-sdk): Twitter API 的官方 SDK

## 项目目标

1. 支持将任何有效的 OpenAPI 模式转换为 TypeScript 类型，无论多么复杂。
2. 生成的类型应该是静态分析的、无运行时依赖的（有一些例外，比如 [enums](https://www.typescriptlang.org/docs/handbook/enums.html)）。
3. 生成的类型应尽可能与原始模式匹配，保留原始的大写形式等。
4. Typegen 只需要 Node.js 来运行（不需要 Java、Python 等），可以在任何环境中运行。
5. 支持从文件以及本地和远程服务器获取 OpenAPI 模式。

## 差异

### 与 swagger-codegen 比较

openapi-typescript 专门为 swagger-codegen 的轻量、易于使用的替代方案而创建，它不需要 Java 运行时或运行 OpenAPI 服务器。它也不生成庞大的客户端端代码。实际上，openapi-typescript 生成的所有代码都是**无运行时的静态类型**，以实现最大性能和最小的客户端体积。

### 与 openapi-typescript-codegen 比较

这两个项目无关。openapi-typescript-codegen 是原始 swagger-codegen 的 Node.js 替代方案，但实际上是一样的。openapi-typescript 具有与 openapi-typescript-codegen 相同的优势，即**无运行时**，而 openapi-typescript-codegen 可以生成相当庞大的捆绑包，取决于模式的复杂性，可以达到 `250 kB` 或更多。

### 与 tRPC 比较

[tRPC](https://trpc.io/) 是一个对服务器和客户端都进行类型安全的框架。它要求服务器和客户端都使用 tRPC 编写（这意味着后端使用 Node.js）。

如果您符合此用例，那么这将是一次很好的体验！但对于其他所有人，openapi-typescript（和 openapi-fetch）是一个更灵活、更低级的解决方案，可以适用于任何技术选择（甚至可以在没有任何成本的情况下逐步采用）。

## 贡献者

没有这些出色的贡献者，这个库将不可能存在：

<VPTeamMembers size="small" :members="contributors['openapi-typescript']" />