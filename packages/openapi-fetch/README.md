<img src="../../docs/public/assets/openapi-fetch.svg" alt="openapi-fetch" width="216" height="40" />

openapi-fetch applies your OpenAPI types to the native fetch API via TypeScript. Weighs in at **1 kb** and has virtually zero runtime. Works with React, Vue, Svelte, or vanilla JS.

| Library                        | Size (min) |
| :----------------------------- | ---------: |
| **openapi-fetch**              |     `1 kB` |
| **openapi-typescript-fetch**   |     `4 kB` |
| **openapi-typescript-codegen** |   `345 kB` |

The syntax is inspired by popular libraries like react-query or Apollo client, but without all the bells and whistles and in a 1 kb package.

```ts
import createClient from "openapi-fetch";
import { paths } from "./v1"; // (generated from openapi-typescript)

const { get, post } = createClient<paths>({ baseUrl: "https://myapi.dev/v1/" });

// Type-checked request
await post("/create-post", {
  body: {
    title: "My New Post",
    // ❌ Property 'publish_date' is missing in type …
  },
});

// Type-checked response
const { data, error } = await get("/blogposts/my-blog-post");

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

## 🔧 Setup

Install this library along with [openapi-typescript](../openapi-typescript):

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

## 🏓 Usage

Using **openapi-fetch** is as easy as reading your schema:

![OpenAPI schema example](../../docs/public/assets/openapi-schema.png)

Here’s how you’d fetch GET `/blogposts/{post_id}` and PUT `/blogposts`:

```ts
import createClient from "openapi-fetch";
import { paths } from "./v1";

const { get, put } = createClient<paths>({ baseUrl: "https://myapi.dev/v1/" });

const { data, error } = await get("/blogposts/{post_id}", {
  params: {
    path: { post_id: "my-post" },
    query: { version: 2 },
  },
});

const { data, error } = await put("/blogposts", {
  body: {
    title: "New Post",
    body: "<p>New post body</p>",
    publish_date: new Date("2023-03-01T12:00:00Z").getTime(),
  },
});
```

### Pathname

The pathname of `get()`, `put()`, `post()`, etc. **must match your schema literally.** Note in the example, the URL is `/blogposts/{post_id}`. This library will replace all `path` params for you (so they can be typechecked)

> ✨ **Tip**
>
> openapi-fetch infers types from the URL. Prefer static string values over dynamic runtime values, e.g.:
>
> - ✅ `"/blogposts/{post_id}"`
> - ❌ `[...pathParts].join("/") + "{post_id}"`

### Request

The `get()` request shown needed the `params` object that groups <a href="https://spec.openapis.org/oas/latest.html#parameter-object" target="_blank" rel="noopener noreferrer">parameters by type</a> (`path` or `query`). If a required param is missing, or the wrong type, a type error will be thrown.

The `post()` request required a `body` object that provided all necessary <a href="https://spec.openapis.org/oas/latest.html#request-body-object" target="_blank" rel="noopener noreferrer">requestBody</a> data.

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

## API

### Create Client

**createClient** accepts the following options, which set the default settings for all subsequent fetch calls.

```ts
createClient<paths>(options);
```

| Name              |      Type       | Description                                                                                                                                                                                   |
| :---------------- | :-------------: | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `baseUrl`         |    `string`     | Prefix all fetch URLs with this option (e.g. `"https://myapi.dev/v1/"`).                                                                                                                      |
| `fetch`           |     `fetch`     | Fetch function used for requests (defaults to `globalThis.fetch`)                                                                                                                             |
| `querySerializer` | QuerySerializer | (optional) Serialize query params for all requests (default: `new URLSearchParams()`)                                                                                                         |
| `bodySerializer`  | BodySerializer  | (optional) Serialize request body object for all requests (default: `JSON.stringify()`)                                                                                                       |
| (Fetch options)   |                 | Any valid fetch option (`headers`, `mode`, `cache`, `signal` …) (<a href="https://developer.mozilla.org/en-US/docs/Web/API/fetch#options" target="_blank" rel="noopener noreferrer">docs</a>) |

### Fetch options

The following options apply to all request methods (`.get()`, `.post()`, etc.)

```ts
client.get("/my-url", options);
```

| Name              |                               Type                                | Description                                                                                                                                                                                                        |
| :---------------- | :---------------------------------------------------------------: | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `params`          |                           ParamsObject                            | Provide `path` and `query` params from the OpenAPI schema                                                                                                                                                          |
| `params.path`     |                        `{ [name]: value }`                        | Provide all `path` params (params that are part of the URL)                                                                                                                                                        |
| `params.query`    |                        `{ [name]: value }`                        | Provide all `query params (params that are part of the <a href="https://developer.mozilla.org/en-US/docs/Web/API/URL/searchParams" target="_blank" rel="noopener noreferrer">searchParams</a>                      |
| `body`            |                        `{ [name]:value }`                         | The <a href="https://spec.openapis.org/oas/latest.html#request-body-object" target="_blank" rel="noopener noreferrer">requestBody</a> data, if needed (PUT/POST/PATCH/DEL only)                                    |
| `querySerializer` |                          QuerySerializer                          | (optional) Serialize query params for this request only (default: `new URLSearchParams()`)                                                                                                                         |
| `bodySerializer`  |                          BodySerializer                           | (optional) Serialize request body for this request only (default: `JSON.stringify()`)                                                                                                                              |
| `parseAs`         | `"json"` \| `"text"` \| `"arrayBuffer"` \| `"blob"` \| `"stream"` | Parse the <a href="https://developer.mozilla.org/en-US/docs/Web/API/Response/body" target="_blank" rel="noopener noreferrer">response body</a>, with `"stream"` skipping processing altogether (default: `"json"`) |
| (Fetch options)   |                                                                   | Any valid fetch option (`headers`, `mode`, `cache`, `signal` …) (<a href="https://developer.mozilla.org/en-US/docs/Web/API/fetch#options" target="_blank" rel="noopener noreferrer">docs</a>)                      |

### querySerializer

This library uses <a href="https://developer.mozilla.org/en-US/docs/Web/API/URLSearchParams" target="_blank" rel="noopener noreferrer">URLSearchParams</a> to <a href="https://swagger.io/docs/specification/serialization/" target="_blank" rel="noopener noreferrer">serialize query parameters</a>. For complex query param types (e.g. arrays) you’ll need to provide your own `querySerializer()` method that transforms query params into a URL-safe string:

```ts
const { data, error } = await get("/search", {
  params: {
    query: { tags: ["food", "california", "healthy"] },
  },
  querySerializer(q) {
    let s = "";
    for (const [k, v] of Object.entries(q)) {
      if (Array.isArray(v)) {
        s += `${k}[]=${v.join(",")}`;
      } else {
        s += `${k}=${v}`;
      }
    }
    return s; // ?tags[]=food&tags[]=california&tags[]=healthy
  },
});
```

### bodySerializer

Similar to [querySerializer](#querySerializer), bodySerializer works for requestBody. You probably only need this when using `multipart/form-data`:

```ts
const { data, error } = await put("/submit", {
  body: {
    name: "",
    query: { version: 2 },
  },
  bodySerializer(body) {
    const fd = new FormData();
    for (const [k, v] of Object.entries(body)) {
      fd.append(k, v);
    }
    return fd;
  },
});
```

## 🎯 Project Goals

1. Infer types automatically from OpenAPI schemas **without generics** (or, only the absolute minimum needed)
2. Respect the native `fetch()` API while reducing boilerplate (such as `await res.json()`)
3. Be as small and light as possible
