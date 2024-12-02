# Contributing

Contributions are welcome!

## Setup

This monorepo uses [pnpm workspaces](https://pnpm.io/) that lets packages pull from local versions rather than remote. It also uses [Turborepo](https://turbo.build/repo/docs) to run commands more easily. After installing pnpm, running the following commands from the root will set everything up:

```sh
pnpm i
pnpm run build
```

## Workspace vs local commands

The “workspace“ is the root `package.json`. Running commands here will run on all packages. For example, running `pnpm run build` in the workspace root will build all packages. But running `cd packages/openapi-typescript && pnpm run build` will only build that one package.

It’s worth noting that some packages depend on others in the monorepo. For example, `openapi-fetch` depends on `openapi-typescript` building built. `openapi-react-query` relies on `openapi-fetch` which relies on `openapi-typescript`. If running commands per-package, you’d have to manually build each package before the test suite could run. But running `pnpm run build` in the workspace root once will build all packages for you, so that you can run any test suite.

> ![NOTE]
>
> Note that if any package changes, be sure to rebuild before running tests! Of course, CI will always do this, but in case you see differences between local vs CI, this is usually the culprit—a stale build.

Again, Turborepo is there so that you don’t have to think about all the packages as much, if you’re just contributing to one. But these tips may help you troubleshoot if something unexpected happens.

## Structure

This monorepo has 2 main sections: the `docs/` that deploy to `openapi-ts.dev`, and `packages/` which are all the npm packages. Each npm package has its own `CONTRIBUTING.md` doc that describes setup needed for that package.

```
┬── docs/
└── packages/
    ├── openapi-fetch/
    ├── openapi-react-query/
    ├── openapi-typescript/
    ├── openapi-typescript-helpers/
    └── swr-openapi/
```
