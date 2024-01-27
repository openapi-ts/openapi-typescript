---
title: Middleware & Auth
---

# Middleware & Auth

## Middleware

As of `0.9.0` this library supports lightweight middleware. Middleware allows you to modify either the request, response, or both for all fetches.

Each middleware can provide `onRequest()` and `onResponse()` callbacks, which can observe and/or mutate requests and responses.

```ts
function myMiddleware(): Middleware {
  return {
    async onRequest(req, options) {
      // set "foo" header
      req.headers.set("foo", "bar");
      return req;
    },
    async onResponse(res, options) {
      const { body, ...resOptions } = res;
      // change status of response
      return new Response(body, { ...resOptions, status: 200 });
    },
  };
}

createClient({
  middleware: [myMiddleware()],
});
```

::: tip

The order of middleware in the array matters. First, every middleware with `onRequest()` will be called in array order. Then, after the server response, every middleware with `onResponse()` will be called in reverse-array order. That way the first middleware gets the first “dibs” on requests, and the final control over responses.

:::

### onRequest

```ts
onRequest(req, options) {
  // …
}
```

`onRequest()` takes 2 params:

| Name      |        Type         | Description                                                                                                                                                                          |
| :-------- | :-----------------: | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `req`     | `MiddlewareRequest` | A standard [Request](https://developer.mozilla.org/en-US/docs/Web/API/Request) with `schemaPath` (OpenAPI pathname) and `params` ([params](/openapi-fetch/api#fetch-options) object) |
| `options` |   `MergedOptiosn`   | Combination of [createClient](/openapi-fetch/api#create-client) options + [fetch overrides](/openapi-fetch/api#fetch-options)                                                        |

And it expects either:

- **If modifying the request:** A [Request](https://developer.mozilla.org/en-US/docs/Web/API/Request)
- **If not modifying:** `undefined` (void)

### onResponse

```ts
onResponse(res, options) {
  // …
}
```

`onResponse()` also takes 2 params:
| Name | Type | Description |
| :-------- | :-----------------: | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `req` | `MiddlewareRequest` | A standard [Response](https://developer.mozilla.org/en-US/docs/Web/API/Response). |
| `options` | `MergedOptiosn` | Combination of [createClient](/openapi-fetch/api#create-client) options + [fetch overrides](/openapi-fetch/api#fetch-options) |

And it expects either:

- **If modifying the response:** A [Response](https://developer.mozilla.org/en-US/docs/Web/API/Response)
- **If not modifying:** `undefined` (void)

### Skipping

If you want to skip the middleware under certain conditions, just `return` as early as possible:

```ts
onRequest(req) {
  if (req.schemaPath !== "/projects/{project_id}") {
    return undefined;
  }
  // …
}
```

This will leave the request/response unmodified, and pass things off to the next middleware handler (if any). There’s no internal callback or observer library needed.

### Handling statefulness

When using middleware, it’s important to remember 2 things:

- **Create new instances** when modifying (e.g. `new Response()`)
- **Clone bodies** before accessing (e.g. `res.clone().json()`)

This is to account for the fact responses are [stateful](https://developer.mozilla.org/en-US/docs/Web/API/Response/bodyUsed), and if the stream is consumed in middleware [the client will throw an error](https://developer.mozilla.org/en-US/docs/Web/API/Response/clone).

<!-- prettier-ignore -->
```ts
async function myMiddleware({ req, res }) {
  return {
    onResponse(res) {
      if (res) {
        const data = await res.json(); // [!code --]
        const data = await res.clone().json(); // [!code ++]
      }
    }
  };
}
```

### Other notes

- `querySerializer()` runs _before_ middleware
  - This is to save middleware from having to do annoying URL formatting. But remember middleware can access `req.params`
- `bodySerializer()` runs _after_ middleware
  - There is some overlap with `bodySerializer()` and middleware. Probably best to use one or the other; not both together.

## Auth

This library is unopinionated and can work with any [Authorization](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Authorization) setup. But here are a few suggestions that may make working with auth easier.

### Client Auth

This basic example stores an access token in JavaScript module state, which is safe to do as it only exists for a single user at a time, is inaccessible to third-party scripts, and disappears when the user navigates away or refreshes the page.

```ts
import createClient, { type Middleware } from "openapi-fetch";

let accessToken: string | undefined = undefined;

async function authMiddleware(): Middleware {
  return {
    onRequest(req) {
      // fetch token, if it doesn’t exist
      if (!accessToken) {
        const authRes = await someAuthFunc();
        if (authRes.accessToken) {
          accessToken = authRes.accessToken;
        } else {
          // handle auth error
        }
      }

      // (optional) add logic here to refresh token when it expires

      // add Authorization header to every request
      req.headers.set("Authorization", `Bearer ${accessToken}`);,
      return req;
    }
  }
}

const client = createClient({
  middleware: [authMiddleware()],
});

const authRequest = await client.GET("/some/auth/url");
```

::: warning

In a server, **never store user data in module state!** Assume multiple users could be using a single instance at once.

:::

### Conditional Auth

If authorization isn’t needed for certain routes, you could also handle that with middleware:

```ts
const UNPROTECTED_ROUTES = ["/v1/login", "/v1/logout", "/v1/public/"];

async function authMiddleware(): Middleware {
  return {
    onRequest(req) {
      // if req.url is an unprotected route, skip this middleware
      if (UNPROTECTED_ROUTES.some((pathname) => req.url.startsWith(pathname))) {
        return;
      }
      // …
    },
  };
}
```
