# Contributing

Contributions are welcome! T

## Setup

This monorepo uses [pnpm workspaces](https://pnpm.io/) that lets packages pull from local versions rather than remote. After installing pnpm, running this command from the root will set everything up:

```sh
pnpm i
```

## Structure

This monorepo has 2 main sections: the `docs/` that deploy to `openapi-ts.dev`, and `packages/` which are all the npm packages. Each npm package has its own `CONTRIBUTING.md` doc that describes setup needed for that package.

```
┬── docs/                         # openapi-ts.dev
│
└── packages/
    ├── openapi-fetch/            # openapi-fetch package
    ├── openapi-typescript-helpers/
    │                             # openapi-typescript package
    └── openapi-typescript/       # openapi-typescript package
```
