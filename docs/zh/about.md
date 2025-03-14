---
title: 关于 openapi-typescript
description: Additional info about this project
---

<script setup>
  import { VPTeamMembers } from 'vitepress/theme';
  import Contributors from '../.vitepress/theme/Contributors.vue'
  import data from '../data/contributors.json';
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

## 项目目标

### openapi-typescript

1. 支持将任何有效的 OpenAPI 模式转换为 TypeScript 类型，无论多么复杂。
2. 生成的类型应该是静态分析的、无运行时依赖的（有一些例外，比如 [enums](https://www.typescriptlang.org/docs/handbook/enums.html)）。
3. 生成的类型应尽可能与原始模式匹配，保留原始的大写形式等。
4. Typegen 只需要 Node.js 来运行（不需要 Java、Python 等），可以在任何环境中运行。
5. 支持从文件以及本地和远程服务器获取 OpenAPI 模式。

### openapi-fetch

1. 类型应该严格，并且应该从 OpenAPI 模式中自动推断出绝对最少数量的泛型。
2. 使用原生的 Fetch API，同时减少样板代码（例如 `await res.json()`）。
3. 尽可能轻巧和高性能。

## Maintainers

This library is currently maintained by these amazing individuals:

<VPTeamMembers size="small" :members="data.maintainers" />

## Contributors

And thanks to 100+ amazing contributors, without whom these projects wouldn’t be possible:

<Contributors :contributors="data.contributors" />
