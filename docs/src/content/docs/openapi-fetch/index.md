---
title: openapi-fetch
description: Get Started with openapi-fetch
---

<img src="/assets/openapi-fetch.svg" alt="openapi-fetch" width="216" height="40" />

openapi-fetch applies your OpenAPI types to the native fetch API via TypeScript. Weighs **2 kb** and has virtually zero runtime. Works with React, Vue, Svelte, or vanilla JS.

| Library                        | Size (min) |
| :----------------------------- | ---------: |
| **openapi-fetch**              |     `2 kB` |
| **openapi-typescript-fetch**   |     `4 kB` |
| **openapi-typescript-codegen** |   `345 kB` |

The syntax is inspired by popular libraries like react-query or Apollo client, but without all the bells and whistles and in a 2 kb package.

```ts
import createClient from "openapi-fetch";
import { paths } from "./v1"; // generated from openapi-typescript

const { GET, PUT } = createClient<paths>({ baseUrl: "https://myapi.dev/v1/" });

// Type-checked request
await PUT("/blogposts", {
  body: {
    title: "My New Post",
    // ❌ Property 'publish_date' is missing in type …
  },
});

// Type-checked response
const { data, error } = await GET("/blogposts/{post_id}", { params: { path: { post_id: "123" } } });
console.log(data.title); // ❌ 'data' is possibly 'undefined'
console.log(error.message); // ❌ 'error' is possibly 'undefined'
console.log(data?.foo); // ❌ Property 'foo' does not exist on type …
```

Notice **there are no generics, and no manual typing.** Your endpoint’s exact request & response was inferred automatically off the URL. This makes a **big difference** in the type safety of your endpoints! This eliminates all of the following:

- ✅ No typos in URLs or params
- ✅ All parameters, request bodies, and responses are type-checked and 100% match your schema
- ✅ No manual typing of your API
- ✅ Eliminates `any` types that hide bugs
- ✅ Also eliminates `as` type overrides that can also hide bugs
- ✅ All of this in a **1 kB** client package 🎉

## Setup

Install this library along with [openapi-typescript](/introduction):

```bash
npm i openapi-fetch
npm i -D openapi-typescript
```

Next, generate TypeScript types from your OpenAPI schema using openapi-typescript:

```bash
npx openapi-typescript ./path/to/api/v1.yaml -o ./src/lib/api/v1.d.ts
```

> ⚠️ Be sure to <a href="https://redocly.com/docs/cli/commands/lint/" target="_blank" rel="noopener noreferrer">validate your schemas</a>! openapi-typescript will err on invalid schemas.

Lastly, be sure to **run typechecking** in your project. This can be done by adding `tsc --noEmit` to your <a href="https://docs.npmjs.com/cli/v9/using-npm/scripts" target="_blank" rel="noopener noreferrer">npm scripts</a> like so:

```json
{
  "scripts": {
    "test:ts": "tsc --noEmit"
  }
}
```

And run `npm run test:ts` in your CI to catch type errors.

> ✨ **Tip**
>
> Always use `tsc --noEmit` to check for type errors! Your build tools (Vite, esbuild, webpack, etc.) won’t typecheck as accurately as the TypeScript compiler itself.

## Usage

Using **openapi-fetch** is as easy as reading your schema:

![OpenAPI schema example](/assets/openapi-schema.png)

Here’s how you’d fetch GET `/blogposts/{post_id}` and PUT `/blogposts`:

```ts
import createClient from "openapi-fetch";
import { paths } from "./v1";

const { GET, PUT } = createClient<paths>({ baseUrl: "https://myapi.dev/v1/" });

const { data, error } = await GET("/blogposts/{post_id}", {
  params: {
    path: { post_id: "my-post" },
    query: { version: 2 },
  },
});

const { data, error } = await PUT("/blogposts", {
  body: {
    title: "New Post",
    body: "<p>New post body</p>",
    publish_date: new Date("2023-03-01T12:00:00Z").getTime(),
  },
});
```

### Pathname

The pathname of `GET()`, `PUT()`, `POST()`, etc. **must match your schema literally.** Note in the example, the URL is `/blogposts/{post_id}`. This library will replace all `path` params for you (so they can be typechecked)

> ✨ **Tip**
>
> openapi-fetch infers types from the URL. Prefer static string values over dynamic runtime values, e.g.:
>
> - ✅ `"/blogposts/{post_id}"`
> - ❌ `[...pathParts].join("/") + "{post_id}"`

### Request

The `GET()` request shown needed the `params` object that groups <a href="https://spec.openapis.org/oas/latest.html#parameter-object" target="_blank" rel="noopener noreferrer">parameters by type</a> (`path` or `query`). If a required param is missing, or the wrong type, a type error will be thrown.

The `POST()` request required a `body` object that provided all necessary <a href="https://spec.openapis.org/oas/latest.html#request-body-object" target="_blank" rel="noopener noreferrer">requestBody</a> data.

### Response

All methods return an object with **data**, **error**, and **response**.

- **data** will contain that endpoint’s `2xx` response if the server returned `2xx`; otherwise it will be `undefined`
- **error** likewise contains that endpoint’s `4xx`/`5xx` response if the server returned either; otherwise it will be `undefined`
  - _Note: `default` will also be interpreted as `error`, since its intent is handling unexpected HTTP codes_
- **response** has response info like `status`, `headers`, etc. It is not typechecked.

## Version Support

openapi-fetch implements the [native fetch API](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API) which is available in all major browsers.

If using in a Node.js environment, version 18 or greater is recommended (newer is better).

TypeScript support is pretty far-reaching as this library doesn’t use any cutting-edge features, but using the latest version of TypeScript is always recommended for accuracy.
