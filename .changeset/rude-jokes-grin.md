---
"openapi-typescript": major
---

⚠️ **Breaking**: Drop auth/fetching options in favor of Redocly CLI’s

- The `auth`, `httpHeaders`, `httpMethod`, and `fetch` options were all removed from the CLI and Node.js API
- To migrate, you’ll need to create a [redocly.yaml config](https://redocly.com/docs/cli/configuration/) that specifies your auth options [in the http setting](https://redocly.com/docs/cli/configuration/#resolve-non-public-or-non-remote-urls)
- Worth noting your `redocly.yaml` config will be respected for any other related settings
