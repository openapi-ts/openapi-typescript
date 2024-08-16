---
title: マイグレーションガイド
description: openapi-typescript のバージョン間の移行
---

# 7.x への移行

7.x リリースには、注意すべきいくつかの軽微な破壊的変更があります：

### 認証 / リモートスキーマの取得

7.x では、すべてのリモートスキーマの取得が [Redocly CLI](https://redocly.com/docs/developer-portal/guides/reference-docs-integration-advanced/#authentication) によって処理されます。これにより、認証設定を `redocly.config.yml` 設定ファイルに[移行](https://redocly.com/docs/developer-portal/guides/reference-docs-integration-advanced/#authentication)する必要があります（[ドキュメント](https://redocly.com/docs/developer-portal/guides/reference-docs-integration-advanced/#authentication)を参照）。

### TypeScript AST

7.x では、単純な文字列変換の代わりに TypeScript AST が導入されました。これは、TypeScript ASTを返すようになったコアのNode.js API、および `transform()` や `postTransform()` オプションに適用されます。[Node.js API のドキュメントが、関連する例と共に更新されています](./node)。

### defaultNonNullableがデフォルトで true

CLI および Node.js API では、`--default-non-nullable` の動作がデフォルトで有効になりました。これにより、スキーマオブジェクトに `default` 値がある場合、それは `required` として扱われます（parametersを除く）。

### Redocly 設定ファイルによる globbing の置き換え

7.x では複数のスキーマを一度に生成することができますが、特定の命名スキーマに従うことを強制するグロビングの代わりに、`redocly.config.yaml` ファイルを宣言して、各入力スキーマとその関連する生成された型の保存場所を指定します。これにより、複数のスキーマの命名と整理に柔軟性が生まれます。

便利なことに、`redocly.config.yml` ファイルを宣言しておけば、引数なしで CLI コマンドを実行できます（[ドキュメント](./cli#redoc-config)参照）：

```sh
npx openapi-typescript
```

### Node.js API のinputの型

7.x ではinputの型が調整され、より予測可能で汎用的になりました。

```ts
import openapiTS from "openapi-typescript";

await openapiTS(input);
```

| Input         |       6.x       |   7.x    |
| :------------ | :-------------: | :------: |
| JSON (object) |    `Object`     | `Object` |
| JSON (string) | (未サポート) | `string` |
| YAML (string) | (未サポート) | `string` |
| Local file    | `string \| URL` |  `URL`   |
| Remote file   | `string \| URL` |  `URL`   |

最大の変更点は `string` の扱いです。6.x では、string はローカルまたはリモートのファイルパスを指す可能性がありましたが、これは予測不可能でした。というのも、ローカルファイルパスの場合、Node が呼び出された場所に依存していたからです。7.x では、**すべてのファイルパスは [URL](https://nodejs.org/api/url.html) である必要があります**（ローカルパスの場合、`new URL('./path/to/my/schema', import.meta.url)` または `new URL('file:///absolute/path/to/my/schema')` を使用）。これにより、 `string` 型がインライン YAML（または JSON）を扱えるようになりました（6.x ではサポートされていませんでした）。

[詳細は更新されたドキュメントを参照](./node#使用方法)。

---

[完全な変更履歴はこちら](https://github.com/openapi-ts/openapi-typescript/blob/6.x/packages/openapi-typescript/CHANGELOG.md)
