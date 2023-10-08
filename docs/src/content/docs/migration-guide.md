---
title: Migration Guide
description: Migrating between openapi-typescript versions
---

## v6 → v7

The v7 release only has a few minor breaking changes to be aware of:

### TypeScript AST

v7 introduces the TypeScript AST rather than simple string transformations. This applies to the core Node.js API, which now returns a TypeScript AST, as well as the options `transform()` and `postTransform()`. [The Node.js API docs have been updated with relevant examples to help](./node).

### Globbing replaced with Redocly config

v7 can still generate multiple schemas at once, but rather than globbing, a `redocly.config.yaml` file must be created instead that lists out every input schema, and where the output types should be saved. [See the updated docs for more info](./cli#redoc-config).

### Node.js API input types

Input types were made more predictable in v7. Inputting a partial filepath as a string was removed because it was somewhat nondeterministic—it would either succeed or fail based on where the Node.js API was called from. Now, to load a schema from a filepath or remote URL, use a proper `URL` like so:

```diff
- openapiTS('./path/to/schema.json');
+ openapiTS(new URL('./path/to/schema.json', import.meta.url'));
```

_Note: `import.meta.url` is only needed for local files; you can simply point to a URL for remote schemas_

This is more predictable, and works in more environments.

In addition, the `string` input is now more robust. v6 didn’t support inputting a full YAML spec as a string, but v7 can handle a dynamic YAML and/or JSON string just fine (JSON in object form is still accepted, too).

[See the updated docs for more info](./node#usage).

[See the full CHANGELOG](https://github.com/drwpow/openapi-typescript/blob/6.x/packages/openapi-typescript/CHANGELOG.md)
