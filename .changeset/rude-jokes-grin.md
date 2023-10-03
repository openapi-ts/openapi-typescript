---
"openapi-typescript": major
---

⚠️ **Breaking**: Changing of several CLI flags and Node.js API options

- The `--auth`, `--httpHeaders`, `--httpMethod`, and `fetch` (Node.js-only) options were all removed from the CLI and Node.js API
  - To migrate, you’ll need to create a [redocly.yaml config](https://redocly.com/docs/cli/configuration/) that specifies your auth options [in the http setting](https://redocly.com/docs/cli/configuration/#resolve-non-public-or-non-remote-urls)
  - You can also set your fetch client in redocly.yaml as well.
- `--immutable-types` has been renamed to `--immutable`
- `--support-array-length` has been renamed to `--array-length`
