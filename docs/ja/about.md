---
title: openapi-typescriptについて
description: このプロジェクトに関する追加情報
---

<script setup>
  import { VPTeamMembers } from 'vitepress/theme';
  import Contributors from '../.vitepress/theme/Contributors.vue'
  import data from '../data/contributors.json';
</script>

# openapi-typescriptについて

## 利用者

- [**Bigcommerce**](https://github.com/bigcommerce/bigcommerce-api-node): BigCommerce API 用の Node SDK
- [**Budibase**](https://github.com/Budibase/budibase): 内部ツール、ワークフロー、および管理ダッシュボードを作成するためのローコードプラットフォーム
- [**Fedora `fmn`**](https://github.com/fedora-infra/fmn): Fedora メッセージインフラストラクチャのツールと API
- [**Fingerprint**](https://github.com/fingerprintjs/fingerprintjs-pro-server-api-node-sdk): 大規模なアプリケーション向けのデバイスフィンガープリンティング
- [**Google Firebase CLI**](https://github.com/firebase/firebase-tools): Google Firebase プラットフォーム用の公式 CLI
- [**GitHub Octokit**](https://github.com/octokit): GitHub API の公式 SDK
- [**Lotus**](https://github.com/uselotus/lotus): オープンソースの価格設定およびパッケージングインフラストラクチャ
- [**Jitsu**](https://github.com/jitsucom/jitsu): モダンでオープンソースのデータ収集/データパイプライン
- [**Medusa**](https://github.com/medusajs/medusa): デジタルコマースの構築ブロック
- [**Netlify**](https://netlify.com): モダンな開発プラットフォーム
- [**Nuxt**](https://github.com/unjs/nitro): 直感的な Vue フレームワーク
- [**Relevance AI**](https://github.com/RelevanceAI/relevance-js-sdk): AI チェーンの構築と展開
- [**Revolt**](https://github.com/revoltchat/api): オープンソースのユーザー優先チャットプラットフォーム
- [**Spacebar**](https://github.com/spacebarchat): 無料でオープンソースの自ホスト可能な Discord 互換のチャット/音声/ビデオプラットフォーム
- [**Supabase**](https://github.com/supabase/supabase): オープンソースの Firebase 代替

## プロジェクトの目標

### openapi-typescript

1. 任意の有効な OpenAPI スキーマを TypeScript 型に変換できるようにすること。どんなに複雑なスキーマでも対応可能です。
2. 生成される型は静的に解析可能で、実行時の依存関係がない（ただし、[enums](https://www.typescriptlang.org/docs/handbook/enums.html) のような例外はあります）。
3. 生成された型は、元のスキーマにできるだけ一致し、元の大文字形式などを保持します。
4. 型の生成 は Node.js だけで実行可能であり、（Java、Python などは不要）どんな環境でも実行できます。
5. ファイルからの OpenAPI スキーマのフェッチや、ローカルおよびリモートサーバーからのフェッチをサポートします。

### openapi-fetch

1. 型は厳密で、最小限のジェネリクスで OpenAPI スキーマから自動的に推論されるべきです。
2. ネイティブの Fetch API を尊重しつつ、（`await res.json()` などの）ボイラープレートを削減すること。
3. 可能な限り軽量で高性能であること。

### openapi-react-query

1. 型は厳格であり、必要最小限のジェネリクスでOpenAPIスキーマから自動的に推論されるべきです。
2. 元の `@tanstack/react-query` API を尊重しつつ、ボイラープレートを減らします。
3. できるだけ軽量でパフォーマンスが高くなるようにします。

## メインテナー

This library is currently maintained by these amazing individuals:

<VPTeamMembers size="small" :members="data.maintainers" />

## 貢献者

And thanks to 100+ amazing contributors, without whom these projects wouldn’t be possible:

<Contributors :contributors="data.contributors" />
