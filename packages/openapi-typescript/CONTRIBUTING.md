# Contributing

Thanks for being willing to contribute! 🙏

**Working on your first Pull Request (PR)?** You can learn how from this free series [How to Contribute to an Open Source Project on GitHub](https://app.egghead.io/playlists/how-to-contribute-to-an-open-source-project-on-github).

## Open issues

Please check out the [the open issues](https://github.com/openapi-ts/openapi-typescript/issues). Issues labelled [**Good First Issue**](https://github.com/openapi-ts/openapi-typescript/issues?q=is%3Aissue+is%3Aopen+label%3A%22good+first+issue%22) are especially good to start with.

Contributing doesn’t have to be in code. Simply answering questions in open issues or providing workarounds is as important as making pull requests.

## Opening a Pull Request

Pull requests are **welcome** for this repo!

Bugfixes will always be accepted, though in some cases some small changes may be requested.

However, if adding a feature or breaking change, please **open an issue first to discuss.** This ensures no time or work is wasted writing code that won’t be accepted to the project (see [Project Goals](https://openapi-ts.dev/about/#project-goals)). Undiscussed feature work may be rejected at the discretion of the maintainers.

### Setup

1. Install [pnpm](https://pnpm.io/)
2. [Fork this repo](https://docs.github.com/en/get-started/quickstart/fork-a-repo) and clone your copy locally
3. Run `pnpm i` to install dependencies

### Writing code

Create a new branch for your PR with `git checkout -b your-branch-name`. Add the relevant code as well as docs and tests. When you push everything up (`git push`), navigate back to your repo in GitHub and you should see a prompt to open a new PR.

While best practices for commit messages are encouraged (e.g. start with an imperative verb, keep it short, use the body if needed), this repo doesn’t follow any specific guidelines. Clarity is favored over strict rules. Changelogs are generated separately from git (see [the Changelogs section](#changelogs))

When working locally, run:

```sh
pnpm run dev
```

This will compile the code as you change automatically.

#### Generating TypeScript

The generator emits TypeScript source strings. Use the builders in `src/lib/ts.ts` for declarations, properties, arrays, unions, and comments. They handle quoting, indentation, and operator precedence consistently.

Keep TypeScript a development dependency only. For changes to generated types, add compiler assertions as well as output snapshots: syntactically valid output can still accept or reject the wrong values. `pnpm run test:consumer -- 7.0.2` checks the built package in an isolated consumer; use `5.9.3`, `6.0.3`, or `none` for the other environments.

#### Tip: Use Test-driven Development!

Contributing to this library is hard-bordering-on-impossible without a [test-driven development (TDD)](https://en.wikipedia.org/wiki/Test-driven_development) strategy. If you’re new to this, the basic workflow is:

1. First, write a [test](#testing) that fully outlines what you’d _like_ the output to be.
2. Next, make sure this test **fails** when you run `npm test` (yes, _fails!_)
3. Then, make changes to `src/` until the tests pass.

Reasoning about code generation can be quite difficult until you “invert your thinking” and approach it output-first. Adopting TDD can turn very unclear/abstract problems into concrete ones with clear steps to resolution.

TL;DR: When starting any task, **write a failing test first!**

#### Updating snapshot tests

To add a schema as a snapshot test, modify the [/scripts/download-schemas.ts](/scripts/download-schemas.ts) script with a path to download. There are both single-file schemas as well as multi-file schemas.

### Generating types

It may be surprising to hear, but generating TypeScript types from OpenAPI is opinionated. Even though TypeScript and OpenAPI are close relatives—both JavaScript/JSON-based—they are nonetheless 2 different languages and thus there is room for interpretation. Further, some parts of the OpenAPI specification can be ambiguous on how they’re used, and what the expected type outcomes may be (though this is generally for more advanced use cases, such as specific implementations of `anyOf` as well as [discriminator](https://spec.openapis.org/oas/latest.html#discriminatorObject) and complex polymorphism).

All that said, this library should strive to generate _the most predictable_ TypeScript output for a given schema. And to achieve that, it always helps to open an [issue](https://github.com/openapi-ts/openapi-typescript/issues) or [discussion](https://github.com/openapi-ts/openapi-typescript/discussions) to gather feedback.

### Opening a PR

When opening a pull request, make sure all of the following is done:

- [x] Tests are added
- [x] Build passes (`npm run build`)
- [x] Tests pass (`npm test`)
- [x] Linting passes (`npm run lint`)

Lastly, be sure to fill out the complete PR template.

### Changelogs

The changelog is generated via [changesets](https://github.com/changesets/changesets), and is separate from Git commit messages and pull request titles. To write a human-readable changelog for your changes, run:

```
npx changeset
```

This will ask if it’s a `patch`, `minor`, or `major` change ([semver](https://semver.org/)), along with a plain description of what you did. Commit this new file along with the rest of your PR, and during the next release this will go into the official changelog!

## Testing

This library uses [Vitest](https://vitest.dev/) for testing. There’s a great [VS Code extension](https://marketplace.visualstudio.com/items?itemName=ZixuanChen.vitest-explorer) you can optionally use if you’d like in-editor debugging tools.

### Running tests

💡 The tests test **the production build** in `dist/`. Be sure to run `npm run build` before running tests (or keep `npm run dev` running in the background, which compiles as-you-work)!

To run the entire test suite once, run:

```sh
pnpm test
```

To run an individual test:

```sh
pnpm test -- [partial filename]
```

To start the entire test suite in watch mode:

```sh
npx vitest
```

### Running linting

Linting is handled via [Biome](https://biomejs.dev), a faster ESLint replacement. It was installed with `pnpm i` and can be run with:

```sh
pnpm run lint
```

### Updating snapshot examples

⚠️ This may break tests if schemas have been updated

```sh
pnpm run update:examples
```

### Unit tests or snapshot tests?

This library has both unit tests (tests that test a tiny part of a schema) and snapshot tests (tests that run over an entire, complete schema). When opening a PR, the former are more valuable than the latter, and are always required. However, updating snapshot tests can help with the following:

- Fixing Node.js or OS-related bugs
- Adding a CLI option that changes the entire output

For most PRs, **snapshot tests can be avoided.** But for scenarios similar to the ones mentioned, they can ensure everything is working as expected.

## Troubleshooting

### When I run tests, it’s not picking up my changes

Some tests import the **built package** and not the source file. Be sure to run `pnpm run build` to build the project. You can also run `pnpm run dev` as you work so changes are always up-to-date.
