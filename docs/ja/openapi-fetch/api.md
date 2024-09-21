---
title: API
description: openapi-fetch API
---

# API

## createClient

**createClient** は、すべての後続のfetch呼び出しに対するデフォルト設定を以下のオプションで指定できます。

```ts
createClient<paths>(options);
```

| 名前              | 型              | 説明                                                                                                                                                                       |
| :---------------- | :-------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `baseUrl`         | `string`        | すべての fetch URL にこのオプションで指定されたプレフィックスを付与します (例.`"https://myapi.dev/v1/"`)                                                                   |
| `fetch`           | `fetch`         | リクエストに使用する Fetch インスタンス (デフォルト: `globalThis.fetch`)                                                                                                   |
| `querySerializer` | QuerySerializer | (任意) [querySerializer](#queryserializer) を提供します                                                                                                                    |
| `bodySerializer`  | BodySerializer  | (任意) [bodySerializer](#bodyserializer) を提供します                                                                                                                      |
| (Fetch options)   |                 | 有効なすべてのfetchオプション（`headers`, `mode`, `cache`, `signal` など）を指定可能です。([ドキュメント](https://developer.mozilla.org/en-US/docs/Web/API/fetch#options)) |

## Fetch オプション

以下のオプションは、すべてのリクエストメソッド（`.GET()`、`.POST()` など）に適用されます。

```ts
client.GET("/my-url", options);
```

| 名前              | 型                                                                | 説明                                                                                                                                                                                                                                       |
| :---------------- | :---------------------------------------------------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `params`          | ParamsObject                                                      | エンドポイントの [path](https://swagger.io/specification/#parameter-locations) と [query](https://swagger.io/specification/#parameter-locations) パラメータ。                                                                              |
| `body`            | `{ [name]:value }`                                                | エンドポイントの [requestBody](https://spec.openapis.org/oas/latest.html#request-body-object) データ。                                                                                                                                     |
| `querySerializer` | QuerySerializer                                                   | (任意) [querySerializer](#queryserializer) を提供します                                                                                                                                                                                    |
| `bodySerializer`  | BodySerializer                                                    | (任意) [bodySerializer](#bodyserializer) を提供します                                                                                                                                                                                      |
| `parseAs`         | `"json"` \| `"text"` \| `"arrayBuffer"` \| `"blob"` \| `"stream"` | (任意) [組み込みのインスタンスメソッド](https://developer.mozilla.org/en-US/docs/Web/API/Response#instance_methods) を使用してレスポンスを解析します (デフォルト: `"json"`). `"stream"` は解析をスキップし、未処理のストリームを返します。 |
| `fetch`           | `fetch`                                                           | リクエストに使用する Fetch インスタンス (デフォルト: `createClient` で指定された fetch )                                                                                                                                                   |
| `middleware`      | `Middleware[]`                                                    | [ドキュメントを参照](/openapi-fetch/middleware-auth)                                                                                                                                                                                       |
| (Fetch options)   |                                                                   | 有効なすべての fetch オプション(`headers`, `mode`, `cache`, `signal`など) ([ドキュメント](https://developer.mozilla.org/en-US/docs/Web/API/fetch#options))                                                                                 |

## wrapAsPathBasedClient

**wrapAsPathBasedClient** は、`createClient()` の結果を[Proxy](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy)ベースのクライアントにラップして、パスに基づく呼び出しを可能にします。

```ts
const client = createClient<paths>(clientOptions);
const pathBasedClient = wrapAsPathBasedClient(client);

pathBasedClient["/my-url"].GET(fetchOptions);
```

`fetchOptions` はベースクライアントと同じです。

Path ベースのクライアントは型推論の向上に役立ちますが、Proxy を使用するためランタイムのコストがかかります。

**createPathBasedClient** は `createClient` と `wrapAsPathBasedClient` を結合した便利なメソッドで、パスに基づく呼び出しスタイルを使用したい場合にのみ使用します。

```ts
const client = createPathBasedClient<paths>(clientOptions);

client["/my-url"].GET(fetchOptions);
```

これはミドルウェアを使用できないことに注意してください。ミドルウェアが必要な場合は、完全な形式を使用する必要があります。

```ts
const client = createClient<paths>(clientOptions);

client.use(...);

const pathBasedClient = wrapAsPathBasedClient(client);

client.use(...); // クライアント参照は共有されるため、ミドルウェアは伝播します。

pathBasedClient["/my-url"].GET(fetchOptions);
```

## querySerializer

OpenAPIは、パラメータに対してオブジェクトや配列をシリアライズする際に、[さまざまな方法をサポート](https://swagger.io/docs/specification/serialization/#query)しています（文字列、数値、ブール値などのプリミティブ型は常に同じ方法で処理されます）。デフォルトでは、このライブラリは配列を `style: "form", explode: true` でシリアライズし、オブジェクトを `style: "deepObject", explode: true` でシリアライズしますが、`querySerializer` オプションを使用して、この動作をカスタマイズすることができます（すべてのリクエストに対して `createClient()` で指定するか、個別のリクエストに対してのみ指定することができます）。

### オブジェクト構文

openapi-fetchは、一般的なシリアル化方法を標準で提供しています:

| オプション      |        型         | 説明                                                                                                                                                                                              |
| :-------------- | :---------------: | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `array`         | SerializerOptions | 配列の `style` と `explode` を設定します ([ドキュメント](https://swagger.io/docs/specification/serialization/#query))。 デフォルト: `{ style: "form", explode: true }`                            |
| `object`        | SerializerOptions | オブジェクトの `style` と `explode` を設定します ([ドキュメント](https://swagger.io/docs/specification/serialization/#query))。 デフォルト: `{ style: "deepObject", explode: true }`              |
| `allowReserved` |     `boolean`     | URLエンコードをスキップするためには `true` に設定します(⚠️ リクエストが壊れる可能性があります) ([ドキュメント](https://swagger.io/docs/specification/serialization/#query))。 デフォルト: `false` |

```ts
const client = createClient({
  querySerializer: {
    array: {
      style: "pipeDelimited", // "form" (デフォルト) | "spaceDelimited" | "pipeDelimited"
      explode: true,
    },
    object: {
      style: "form", // "form" | "deepObject" (デフォルト)
      explode: true,
    },
  },
});
```

#### 配列のstyles

| Style                        | 配列 `id = [3, 4, 5]`   |
| :--------------------------- | :---------------------- |
| form                         | `/users?id=3,4,5`       |
| **form (exploded, default)** | `/users?id=3&id=4&id=5` |
| spaceDelimited               | `/users?id=3%204%205`   |
| spaceDelimited (exploded)    | `/users?id=3&id=4&id=5` |
| pipeDelimited                | `/users?id=3\|4\|5`     |
| pipeDelimited (exploded)     | `/users?id=3&id=4&id=5` |

#### オブジェクトのstyles

| Style                    | オブジェクト `id = {"role": "admin", "firstName": "Alex"}` |
| :----------------------- | :--------------------------------------------------------- |
| form                     | `/users?id=role,admin,firstName,Alex`                      |
| form (exploded)          | `/users?role=admin&firstName=Alex`                         |
| **deepObject (default)** | `/users?id[role]=admin&id[firstName]=Alex`                 |

::: tip

**deepObject** は常に個別指定なので、`explode: true` または `explode: false` を設定しても、生成される出力は同じです。

:::

### 別の関数構文

バックエンドが標準のシリアル化方法のいずれかを使用しない場合、 `querySerializer` に関数を渡して、文字列全体を自分でシリアル化することができます。paramsに深くネストされたオブジェクトや配列を処理する場合は、この方法を使用する必要があります。

```ts
const client = createClient({
  querySerializer(queryParams) {
    const search = [];
    for (const name in queryParams) {
      const value = queryParams[name];
      if (Array.isArray(value)) {
        for (const item of value) {
          s.push(`${name}[]=${encodeURIComponent(item)}`);
        }
      } else {
        s.push(`${name}=${encodeURLComponent(value)}`);
      }
    }
    return search.join(","); // ?tags[]=food,tags[]=california,tags[]=healthy
  },
});
```

::: warning

自分でシリアライズする場合、文字列は記述されたままの状態で保持されるため、特殊文字をエスケープするには [encodeURI](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/encodeURI) または [encodeURIComponent](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/encodeURIComponent) を呼び出す必要があります。

:::

## bodySerializer

[querySerializer](#queryserializer)と同様に、bodySerializerを使用するとデフォルトの [JSON.stringify()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/stringify) の動作を変更したい場合に、requestBodyのシリアライズ方法をカスタマイズできます。これはおそらく、`multipart/form-data` を使用する際にのみ必要となるでしょう。

```ts
const { data, error } = await client.PUT("/submit", {
  body: {
    name: "",
    query: { version: 2 },
  },
  bodySerializer(body) {
    const fd = new FormData();
    for (const name in body) {
      fd.append(name, body[name]);
    }
    return fd;
  },
});
```

::: tip

便宜上、 `openapi-fetch` は `body` パラメーターに値が指定されたリクエストに対して、`Content-Type` を自動的に `application/json` に設定します。
`bodySerializer` が `FormData` のインスタンスを返す場合、`Content-Type` ヘッダーは省略され、ブラウザがメッセージの複数のパートを正しく区切るboundaryを含む `Content-Type` を自動的に設定します。

また、fetch オプションやクライアントのインスタンス化時に、`headers` オブジェクトを通じて `Content-Type` を手動で設定することもできます。

:::

## Pathのシリアライズ

openapi-fetchは、[3.1仕様書に記載されている](https://swagger.io/docs/specification/serialization/#path)ように、pathのシリアライズをサポートしています。これは、OpenAPIスキーマ内の特定のフォーマットに基づいて自動的に行われます。

| テンプレート      | Style                | プリミティブ `id = 5` | 配列 `id = [3, 4, 5]`    | オブジェクト `id = {"role": "admin", "firstName": "Alex"}` |
| :---------------- | :------------------- | :-------------------- | :----------------------- | :--------------------------------------------------------- |
| **`/users/{id}`** | **simple (default)** | **`/users/5`**        | **`/users/3,4,5`**       | **`/users/role,admin,firstName,Alex`**                     |
| `/users/{id*}`    | simple (exploded)    | `/users/5`            | `/users/3,4,5`           | `/users/role=admin,firstName=Alex`                         |
| `/users/{.id}`    | label                | `/users/.5`           | `/users/.3,4,5`          | `/users/.role,admin,firstName,Alex`                        |
| `/users/{.id*}`   | label (exploded)     | `/users/.5`           | `/users/.3.4.5`          | `/users/.role=admin.firstName=Alex`                        |
| `/users/{;id}`    | matrix               | `/users/;id=5`        | `/users/;id=3,4,5`       | `/users/;id=role,admin,firstName,Alex`                     |
| `/users/{;id*}`   | matrix (exploded)    | `/users/;id=5`        | `/users/;id=3;id=4;id=5` | `/users/;role=admin;firstName=Alex`                        |

## ミドルウェア

ミドルウェアは、リクエストとレスポンスを監視および変更できる `onRequest()` と `onResponse()` のコールバックを持つオブジェクトです。

```ts
import createClient from "openapi-fetch";
import type { paths } from "./my-openapi-3-schema"; // openapi-typescriptで生成された型

const myMiddleware: Middleware = {
  async onRequest({ request, options }) {
    // "foo" ヘッダーを設定
    request.headers.set("foo", "bar");
    return request;
  },
  async onResponse({ request, response, options }) {
    const { body, ...resOptions } = res;
    // レスポンスのステータスを変更
    return new Response(body, { ...resOptions, status: 200 });
  },
};

const client = createClient<paths>({ baseUrl: "https://myapi.dev/v1/" });

// ミドルウェアを登録
client.use(myMiddleware);
```

### API

#### Parameters

各ミドルウェアのコールバックは、以下の内容を持つ `options` オブジェクトを受け取ります。

| 名前         | 型              | 説明                                                                                                |
| :----------- | :-------------- | :-------------------------------------------------------------------------------------------------- |
| `request`    | `Request`       | エンドポイントに送信される現在の `Request` オブジェクト。                                           |
| `response`   | `Response`      | エンドポイントから返された `Response` オブジェクト（`onRequest` の場合は `undefined` になります）。 |
| `schemaPath` | `string`        | 呼び出された元の OpenAPI パス（例. `/users/{user_id}`）。                                           |
| `params`     | `Object`        | `GET()` や `POST()` などに渡された元の `params` オブジェクト。                                      |
| `id`         | `string`        | このリクエストのランダムでユニークなID。                                                            |
| `options`    | `ClientOptions` | `createClient()` に渡された読み取り専用のオプション。                                               |

#### Response

各ミドルウェアのコールバックは以下を返すことができます：

- **onRequest** リクエストを変更するための `Request` またはそのままにする場合は `undefined`（スキップ）。
- **onResponse** レスポンスを変更するための `Response` またはそのままにする場合は `undefined`（スキップ）。

### ミドルウェアの削除

ミドルウェアを削除するには、`client.eject(middleware)` を呼び出します:

```ts{9}
const myMiddleware = {
  // …
};

// ミドルウェアを登録
client.use(myMiddleware);

// ミドルウェアを削除
client.eject(myMiddleware);
```

追加のガイドと例については、[Middleware & Auth](/ja/openapi-fetch/middleware-auth) を参照してください。
