---
title: API
description: openapi-fetch API
---

# API

## Create Client

**createClient** accepts the following options, which set the default settings for all subsequent fetch calls.

```ts
createClient<paths>(options);
```

| Name              |      Type       | Description                                                                                                                             |
| :---------------- | :-------------: | :-------------------------------------------------------------------------------------------------------------------------------------- |
| `baseUrl`         |    `string`     | Prefix all fetch URLs with this option (e.g. `"https://myapi.dev/v1/"`)                                                                 |
| `fetch`           |     `fetch`     | Fetch instance used for requests (default: `globalThis.fetch`)                                                                          |
| `querySerializer` | QuerySerializer | (optional) Provide a [querySerializer](#queryserializer)                                                                                |
| `pathSerializer`  | PathSerializer  | (optional) Provide a [pathSerializer](#pathserializer)                                                                                  |
| `bodySerializer`  | BodySerializer  | (optional) Provide a [bodySerializer](#bodyserializer)                                                                                  |
| (Fetch options)   |                 | Any valid fetch option (`headers`, `mode`, `cache`, `signal` …) ([docs](https://developer.mozilla.org/en-US/docs/Web/API/fetch#options) |

## Fetch options

The following options apply to all request methods (`.GET()`, `.POST()`, etc.)

```ts
client.get("/my-url", options);
```

| Name              |                               Type                                | Description                                                                                                                                                                                                                       |
| :---------------- | :---------------------------------------------------------------: | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `params`          |                           ParamsObject                            | [path](https://swagger.io/specification/#parameter-locations) and [query](https://swagger.io/specification/#parameter-locations) params for the endpoint                                                                          |
| `body`            |                        `{ [name]:value }`                         | [requestBody](https://spec.openapis.org/oas/latest.html#request-body-object) data for the endpoint                                                                                                                                |
| `querySerializer` |                          QuerySerializer                          | (optional) Provide a [querySerializer](#queryserializer)                                                                                                                                                                          |
| `pathSerializer`  |                          PathSerializer                           | (optional) Provide a [pathSerializer](#pathserializer)                                                                                                                                                                            |
| `bodySerializer`  |                          BodySerializer                           | (optional) Provide a [bodySerializer](#bodyserializer)                                                                                                                                                                            |
| `parseAs`         | `"json"` \| `"text"` \| `"arrayBuffer"` \| `"blob"` \| `"stream"` | (optional) Parse the response using [a built-in instance method](https://developer.mozilla.org/en-US/docs/Web/API/Response#instance_methods) (default: `"json"`). `"stream"` skips parsing altogether and returns the raw stream. |
| `fetch`           |                              `fetch`                              | Fetch instance used for requests (default: fetch from `createClient`)                                                                                                                                                             |
| (Fetch options)   |                                                                   | Any valid fetch option (`headers`, `mode`, `cache`, `signal`, …) ([docs](https://developer.mozilla.org/en-US/docs/Web/API/fetch#options))                                                                                         |

### querySerializer

String, number, and boolean query params are straightforward when forming a request, but arrays and objects not so much. OpenAPI supports [different ways of handling each](https://swagger.io/docs/specification/serialization/#query). By default, this library serializes arrays using `style: "form", explode: true`, and objects using `style: "deepObject", explode: true`.

To change that behavior, you can supply `querySerializer` options that control how `object` and `arrays` are serialized for query params. This can either be passed on `createClient()` to control every request, or on individual requests for just one:

| Option          |       Type        | Description                                                                                                                                                    |
| :-------------- | :---------------: | :------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `array`         | SerializerOptions | Set `style` and `explode` for arrays ([docs](https://swagger.io/docs/specification/serialization/#query)). Default: `{ style: "form", explode: true }`.        |
| `object`        | SerializerOptions | Set `style` and `explode` for objects ([docs](https://swagger.io/docs/specification/serialization/#query)). Default: `{ style: "deepObject", explode: true }`. |
| `allowReserved` |     `boolean`     | Set to `true` to skip URL encoding (⚠️ may break the request) ([docs](https://swagger.io/docs/specification/serialization/#query)). Default: `false`.          |

```ts
const client = createClient({
  querySerializer: {
    array: {
      style: "pipeDelimited", // "form" (default) | "spaceDelimited" | "pipeDelimited"
      explode: true,
    },
    object: {
      style: "form", // "form" | "deepObject" (default)
      explode: true,
    },
  },
});
```

#### Function

Sometimes your backend doesn’t use one of the standard serialization methods, in which case you can pass a function to `querySerializer` to serialize the entire string yourself with no restrictions:

```ts
const client = createClient({
  querySerializer(queryParam) {
    let s = [];
    for (const [k, v] of Object.entries(queryParam)) {
      if (Array.isArray(v)) {
        for (const i of v) {
          s.push(`${k}[]=${encodeURIComponent(i)}`);
        }
      } else {
        s.push(`${k}=${encodeURLComponent(v)}`);
      }
    }
    return encodeURI(s.join(",")); // ?tags[]=food,tags[]=california,tags[]=healthy
  },
});
```

::: warning

When serializing yourself, the string will be kept exactly as-authored, so you’ll have to call [encodeURI](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/encodeURI) or [encodeURIComponent](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/encodeURIComponent) to escape special characters.

:::

### pathSerializer

If your backend doesn’t use the standard `{param_name}` syntax, you can control the behavior of how path params are serialized according to the spec ([docs](https://swagger.io/docs/specification/serialization/#path)):

```ts
const client = createClient({
  pathSerializer: {
    style: "label", // "simple" (default) | "label" | "matrix"
  },
});
```

::: info

The `explode` behavior ([docs](https://swagger.io/docs/specification/serialization/#path)) is determined automatically by the pathname, depending on whether an asterisk suffix is present or not, e.g. `/users/{id}` vs `/users/{id*}`. Globs are **NOT** supported, and the param name must still match exactly; the asterisk is only a suffix.

:::

### bodySerializer

Similar to [querySerializer](#querySerializer), bodySerializer allows you to customize how the requestBody is serialized if you don’t want the default [JSON.stringify()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/stringify) behavior. You probably only need this when using `multipart/form-data`:

```ts
const { data, error } = await PUT("/submit", {
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
