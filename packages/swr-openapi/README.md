<p align="center">
  <h1 align="center">swr-openapi</h1>
</p>

<p align="center">Generate <a href="https://swr.vercel.app"><code>swr</code></a> hooks using <a href="https://swagger.io/specification/">OpenAPI</a> schemas</p>

<p align="center">
  <a aria-label="npm" href="https://www.npmjs.com/package/swr-openapi">
    <img alt="npm" src="https://img.shields.io/npm/v/swr-openapi.svg?style=for-the-badge&labelColor=000000">
  </a>
  <a aria-label="license" href="https://github.com/openapi-ts/openapi-typescript/blob/main/packages/swr-openapi/LICENSE">
    <img alt="license" src="https://img.shields.io/github/license/openapi-ts/openapi-typescript.svg?style=for-the-badge&labelColor=000000">
  </a>
</p>

## Setup

```sh
npm install swr-openapi swr openapi-fetch
```

Follow [openapi-typescript](https://openapi-ts.dev/) directions to generate TypeScript definitions for each service being used.

Here is an example of types being generated for a service via the command line:

```sh
npx openapi-typescript "https://sandwiches.example/openapi/json" --output ./types/sandwich-schema.ts
```

## Basic Usage

Initialize an [openapi-fetch](https://openapi-ts.dev/openapi-fetch/) client and create any desired hooks.

```ts
// sandwich-api.ts
import createClient from "openapi-fetch";
import { createQueryHook } from "swr-openapi";
import type { paths as SandwichPaths } from "./types/sandwich-schema";

const client = createClient<SandwichPaths>(/* ... */);

const useSandwiches = createQueryHook(client, "sandwich-api");

const { data, error, isLoading, isValidating, mutate } = useSandwiches(
  "/sandwich/{id}", // <- Fully typed paths!
  {
    params: {
      path: {
        id: "123", // <- Fully typed params!
      },
    },
  },
);
```

## 📓 Docs

[View Docs](https://openapi-ts.dev/swr-openapi)
