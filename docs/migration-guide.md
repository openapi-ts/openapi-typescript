---
title: Migration Guide
description: Migrating between openapi-typescript versions
---

# Migrating to 7.x

The 7.x release only has a few minor breaking changes to be aware of:

### Authentication / remote schema fetching

In 7.x, all remote schema fetching is handled via the [Redocly CLI](https://redocly.com/docs/developer-portal/guides/reference-docs-integration-advanced/#authentication). This means you’ll need to [move your authentication settings](https://redocly.com/docs/developer-portal/guides/reference-docs-integration-advanced/#authentication) to a `redocly.config.yml` config file ([docs](https://redocly.com/docs/developer-portal/guides/reference-docs-integration-advanced/#authentication)).

### TypeScript AST

7.x introduces the TypeScript AST rather than simple string transformations. This applies to the core Node.js API, which now returns a TypeScript AST, as well as the options `transform()` and `postTransform()`. [The Node.js API docs have been updated with relevant examples to help](./node).

### defaultNonNullable: true by default

The CLI and Node.js API now have `--default-non-nullable` behavior enabled by default. This means if a schema object has a `default` value, it will be treated as if it’s `required` (with the exception of parameters).

### Globbing replaced with Redocly config

7.x can still generate multiple schemas at once, but rather than globbing that forces you to follow a particular naming schema, you’ll declare a `redocly.config.yaml` file that lists every input schema and where its associated generated types should go. This allows more flexibility in naming and organizing multiple schemas.

But the neat part is with a `redocly.config.yml` file declared, you can simply run the CLI command with no arguments ([docs](./cli#redoc-config)):

```sh
npx openapi-typescript
```

### Node.js API input types

The input types have changed slightly in 7.x to be more predictable and versatile.

```ts
import openapiTS from "openapi-typescript";

await openapiTS(input);
```

| Input         |       6.x       |   7.x    |
| :------------ | :-------------: | :------: |
| JSON (object) |    `Object`     | `Object` |
| JSON (string) | (not supported) | `string` |
| YAML (string) | (not supported) | `string` |
| Local file    | `string \| URL` |  `URL`   |
| Remote file   | `string \| URL` |  `URL`   |

The biggest change is the handling of `string`s—in 6.x a string could refer to a local or remote filepath, but this was unpredictable because for local filepaths it would depend where Node was called from. In 7.x, **all filepaths must be a [URL](https://nodejs.org/api/url.html)** (for local paths, use `new URL('./path/to/my/schema', import.meta.url)` or `new URL('file:///absolute/path/to/my/schema')`). This lets the `string` type handle inline YAML (or JSON) which wasn’t supported in 6.x.

[See the updated docs for more info](./node#usage).

---

[See the full CHANGELOG](https://github.com/openapi-ts/openapi-typescript/blob/6.x/packages/openapi-typescript/CHANGELOG.md)
