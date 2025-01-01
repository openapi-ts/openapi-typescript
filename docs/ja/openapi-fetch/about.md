---
title: openapi-fetch について
description: openapi-fetch プロジェクトの目標、比較など
---

<script setup>
  import { VPTeamMembers } from 'vitepress/theme';
  import contributors from '../../data/contributors.json';
</script>

# openapi-fetch について

## プロジェクトの目標

1. 型は厳密で、最小限のジェネリクスで OpenAPI スキーマから自動的に推論されるべきです。
2. ネイティブの Fetch API を尊重しつつ、（`await res.json()` などの）ボイラープレートを削減すること。
3. 可能な限り軽量で高性能であること。

## 比較

### vs. Axios

[Axios](https://axios-http.com) は、OpenAPI スキーマに対して自動的に型チェックを行うことはできません。さらに、それを実現する簡単な方法もありません。Axios は、インターセプターや高度なキャンセルなど、openapi-fetch よりも多くの機能を備えています。

### vs. tRPC

[tRPC](https://trpc.io/) は、バックエンドとフロントエンドが両方とも TypeScript (Node.js) で書かれているプロジェクト向けです。openapi-fetch はユニバーサルであり、OpenAPI 3.x スキーマに従う任意のバックエンドと連携することができます。

### vs. openapi-typescript-fetch

[openapi-typescript-fetch](https://github.com/ajaishankar/openapi-typescript-fetch) は、openapi-fetch よりも前に開発され、目的はほぼ同じですが、主に構文が異なります（つまり、選択は好みに依存します）:

- openapi-typescript-fetch は非 OK 応答の場合に例外を投げます（そのため、`try/catch` でラップする必要があります）。これに対して openapi-fetch は Fetch API 仕様に従い、例外を投げません。
- openapi-typescript-fetch の構文は冗長で、チェーン（`.path(…).method(…).create()`）に依存します。

### vs. openapi-typescript-codegen

[openapi-typescript-codegen](https://github.com/ferdikoomen/openapi-typescript-codegen) はコード生成ライブラリであり、openapi-fetch の「コード生成なし」アプローチとは根本的に異なります。openapi-fetch は、ビルド時に静的な TypeScript 型チェックを行い、クライアントの負担を増やさず、ランタイムでのパフォーマンスに影響を与えません。従来のコード生成は、クライアントの負担を増やし、ランタイムを遅くする何百（あるいは何千）もの異なる関数を生成します。

### vs. Swagger Codegen

Swagger Codegen は Swagger/OpenAPI の元祖のコード生成プロジェクトであり、他のコード生成アプローチと同様にサイズの膨張やランタイムのパフォーマンス問題があります。さらに、Swagger Codegen は Java ランタイムが必要ですが、openapi-typescript/openapi-fetch はネイティブの Node.js プロジェクトとしてその必要がありません。

## 貢献者

これらの素晴らしい貢献者がいなければ、このライブラリは存在しなかったでしょう：

<VPTeamMembers size="small" :members="contributors['openapi-fetch']" />
