---
title: openapi-typescriptについて
description: このプロジェクトに関する追加情報
---

<script setup>
  import { VPTeamMembers } from 'vitepress/theme';
  import contributors from '../data/contributors.json';
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
- [**Twitter API**](https://github.com/twitterdev/twitter-api-typescript-sdk): Twitter API の公式 SDK

## プロジェクトの目標

1. 任意の有効な OpenAPI スキーマを TypeScript 型に変換できるようにすること。どんなに複雑なスキーマでも対応可能です。
2. 生成される型は静的に解析可能で、実行時の依存関係がない（ただし、[enums](https://www.typescriptlang.org/docs/handbook/enums.html) のような例外はあります）。
3. 生成された型は、元のスキーマにできるだけ一致し、元の大文字形式などを保持します。
4. 型の生成 は Node.js だけで実行可能であり、（Java、Python などは不要）どんな環境でも実行できます。
5. ファイルからの OpenAPI スキーマのフェッチや、ローカルおよびリモートサーバーからのフェッチをサポートします。

## 比較

### vs. swagger-codegen

openapi-typescript は、swagger-codegen の軽量で使いやすい代替手段として作成されており、Java ランタイムや OpenAPI サーバーを実行する必要はありません。また、大規模なクライアントサイドコードも生成しません。実際、openapi-typescript が生成するすべてのコードは、**実行時の依存関係がない静的型** であり、最大のパフォーマンスと最小のクライアント負荷を実現します。

### vs. openapi-typescript-codegen

openapi-typescript-codegen は、元の swagger-codegen の Node.js 代替手段ですが、実際には同じものです。openapi-typescript は、openapi-typescript-codegen と同様に、**実行時の依存関係がない** という利点を持っていますが、openapi-typescript-codegen は、スキーマの複雑さに応じて `250 kB` 以上になるかなり大きなバンドルを生成する可能性があります。

### vs. tRPC

[tRPC](https://trpc.io/) は、強い設計方針を持ったサーバーとクライアントの両方で型の安全性を提供するフレームワークです。これは、サーバーとクライアントの両方が tRPC で記述されていることを要求します（つまり、バックエンドが Node.js を使用しています）。

このユースケースに合っているならば、素晴らしい体験ができるでしょう！しかし、他のすべての場合において、openapi-typescript（および openapi-fetch）は、あらゆる技術選択に適応できる、より柔軟で低レベルなソリューションです（コストなしで段階的に導入することさえできます）。

## 貢献者

これらの素晴らしい貢献者がいなければ、このライブラリは存在しなかったでしょう：

<VPTeamMembers size="small" :members="contributors['openapi-typescript']" />
