---
title: openapi-typescript CLI
description: The quickest, easiest way to generate types.
---

# CLI

The CLI is the most common way to use openapi-typescript. The CLI can parse JSON and YAML (via [js-yaml](https://www.npmjs.com/package/js-yaml). It can parse local and remote schemas (and even supports basic auth).

## Reading schemas

```bash
npx openapi-typescript schema.yaml -o schema.ts

# 🚀 schema.yaml -> schema.ts [7ms]
```

### Globbing local schemas

```bash
npx openapi-typescript "specs/**/*.yaml" -o schemas/

# 🚀 specs/one.yaml -> schemas/specs/one.ts [7ms]
# 🚀 specs/two.yaml -> schemas/specs/two.ts [7ms]
# 🚀 specs/three.yaml -> schemas/specs/three.ts [7ms]
```

_Thanks, [@sharmarajdaksh](https://github.com/sharmarajdaksh)!_

### Remote schemas

```bash
npx openapi-typescript https://petstore3.swagger.io/api/v3/openapi.yaml -o petstore.d.ts

# 🚀 https://petstore3.swagger.io/api/v3/openapi.yaml -> petstore.d.ts [250ms]
```

_Thanks, [@psmyrdek](https://github.com/psmyrdek)!_

## Options

| Option                    | Alias | Default  | Description                                                                                                                  |
| :------------------------ | :---- | :------: | :--------------------------------------------------------------------------------------------------------------------------- |
| `--help`                  |       |          | Display inline help message and exit                                                                                         |
| `--version`               |       |          | Display this library’s version and exit                                                                                      |
| `--output [location]`     | `-o`  | (stdout) | Where should the output file be saved?                                                                                       |
| `--auth [token]`          |       |          | Provide an auth token to be passed along in the request (only if accessing a private schema)                                 |
| `--header`                | `-x`  |          | Provide an array of or singular headers as an alternative to a JSON object. Each header must follow the `key: value` pattern |
| `--headers-object="{…}"`  | `-h`  |          | Provide a JSON object as string of HTTP headers for remote schema request. This will take priority over `--header`           |
| `--http-method`           | `-m`  |  `GET`   | Provide the HTTP Verb/Method for fetching a schema from a remote URL                                                         |
| `--immutable-types`       |       | `false`  | Generates immutable types (readonly properties and readonly array)                                                           |
| `--additional-properties` |       | `false`  | Allow arbitrary properties for all schema objects without `additionalProperties: false`                                      |
| `--empty-objects-unknown` |       | `false`  | Allow arbitrary properties for schema objects with no specified properties, and no specified `additionalProperties`          |
| `--default-non-nullable`  |       | `false`  | Treat schema objects with default values as non-nullable                                                                     |
| `--export-type`           | `-t`  | `false`  | Export `type` instead of `interface`                                                                                         |
| `--path-params-as-types`  |       | `false`  | Allow dynamic string lookups on the `paths` object                                                                           |
| `--support-array-length`  |       | `false`  | Generate tuples using array `minItems` / `maxItems`                                                                          |
| `--alphabetize`           |       | `false`  | Sort types alphabetically                                                                                                    |
| `--exclude-deprecated`    |       | `false`  | Exclude deprecated fields from types                                                                                         |

### `--path-params-as-types`

By default, your URLs are preserved exactly as-written in your schema:

```ts
export interface paths {
  "/user/{user_id}": components["schemas"]["User"];
}
```

Which means your type lookups also have to match the exact URL:

```ts
import type { paths } from "./api/v1";

const url = `/user/${id}`;
type UserResponses = paths["/user/{user_id}"]["responses"];
```

But when `--path-params-as-types` is enabled, you can take advantage of dynamic lookups like so:

```ts
import type { paths } from "./api/v1";

const url = `/user/${id}`;
type UserResponses = paths[url]["responses"]; // automatically matches `paths['/user/{user_id}']`
```

Though this is a contrived example, you could use this feature to automatically infer typing based on the URL in a fetch client or in some other useful place in your application.

_Thanks, [@Powell-v2](https://github.com/Powell-v2)!_

### `--support-array-length`

This option is useful for generating tuples if an array type specifies `minItems` or `maxItems`.

For example, given the following schema:

```yaml
components:
  schemas:
    TupleType
      type: array
      items:
        type: string
      minItems: 1
      maxItems: 2
```

Enabling `--support-array-length` would change the typing like so:

```diff
  export interface components {
    schemas: {
-     TupleType: string[];
+     TupleType: [string] | [string, string];
    };
  }
```

This results in more explicit typechecking of array lengths.

_Note: this has a reasonable limit, so for example `maxItems: 100` would simply flatten back down to `string[];`_

_Thanks, [@kgtkr](https://github.com/kgtkr)!_
