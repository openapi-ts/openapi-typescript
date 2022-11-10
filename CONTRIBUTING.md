# Contributing

Thanks for being willing to contribute! 🙏

**Working on your first Pull Request (PR)?** You can learn how from this _free_ series [How to Contribute to an Open Source Project on GitHub](https://egghead.io/series/how-to-contribute-to-an-open-source-project-on-github)

## Open issues

Please check out the [the open issues](https://github.com/drwpow/openapi-typescript/issues). Issues labelled [**Help Wanted**](https://github.com/drwpow/openapi-typescript/issues?q=is%3Aissue+is%3Aopen+label%3A%22help+wanted%22) and [**Good First Issue**](https://github.com/drwpow/openapi-typescript/issues?q=is%3Aissue+is%3Aopen+label%3A%22good+first+issue%22) are especially good to help with.

Contributing doesn’t have to be in code! Simply answering questions in open issues, or providing workarounds, is just as important a contribution as making pull requests.

## Setup

### Dependencies

1. Install [pnpm](https://pnpm.io/)
2. Fork and clone the repo
3. Run `pnpm i` to install dependencies
4. Create a branch for your PR with `git checkout -b pr/your-branch-name`

### VS Code setup

If using VS Code, the following extensions are recommended (or their equivalent extensions if using another editor)

- [ESLint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint)

## Workflow

When working locally, run:

```bash
npm run dev
```

This will compile the code as you change automatically.

### TDD

This library is a great usecase for [test-driven development (TDD)](https://en.wikipedia.org/wiki/Test-driven_development). If you’re new to this, the basic workflow is:

1. First, write a [test](#testing) that fully outlines what you’d _like_ the output to be.
2. Make sure this test **fails** when you run `npm test` (yes, _fails!_)
3. Then, make changes to `src/` until the tests pass.

_Code generation is hard!_ And for that reason, starting with a very clear expectation of your end-goal can make working easier.

### Unit tests or snapshot tests?

This library has both unit tests (tests that test a tiny part of a schema) and snapshot tests (tests that run over an entire, complete schema). When opening a PR, the former are more valuable than the latter, and are always required. However, updating snapshot tests can help with the following:

- Fixing bugs that deal with multiple schemas with remote `$ref`s
- Fixing Node.js or OS-related bugs
- Adding a CLI option that changes the entire output

For most PRs, **snapshot tests can be avoided.** But for scenarios similar to the ones mentioned, they can ensure everything is working as expected.

#### Updating snapshot tests

To add a schema as a snapshot test, modify the [/scripts/download-schemas.ts](/scripts/download-schemas.ts) script with a path to download. There are both single-file schemas as well as multi-file schemas.

### Generating types

It may be surprising to hear, but _generating TypeScript types from OpenAPI is opinionated!_ Even though TypeScript and OpenAPI are very close relatives, both being JavaScript/JSON-based, they are nonetheless 2 different languages and thus there is always some room for interpretation. Likewise, some parts of the OpenAPI specification can be ambiguous on how they’re used, and what the expected type outcomes may be (though this is generally for more advanced usecasees, such as specific implementations of `anyOf` as well as [discriminator](https://spec.openapis.org/oas/latest.html#discriminatorObject) and complex polymorphism).

All that said, this library should strive to generate _the most predictable_ TypeScript output for a given schema. And to achieve that, it always helps to open an [issue](https://github.com/drwpow/openapi-typescript/issues) or [discussion](https://github.com/drwpow/openapi-typescript/discussions) to gather feedback.

### Opening a PR

When opening a pull request, make sure all of the following is done:

- [x] Tests are added
- [x] Build passes (`npm run build`)
- [x] Tests pass (`npm test`)
- [x] Linting passes (`npm run lint`)

Lastly, be sure to fill out the complete PR template!

## Testing

This library uses [Vitest](https://vitest.dev/) for testing. There’s a great [VS Code extension](https://marketplace.visualstudio.com/items?itemName=ZixuanChen.vitest-explorer) you can optionally use if you’d like in-editor debugging tools.

### Running tests

💡 The tests test **the production build** in `dist/`. Be sure to run `npm run build` before running tests (or keep `npm run dev` running in the background, which compiles as-you-work)!

To run the entire test suite once, run:

```bash
npm test
```

To run an individual test:

```bash
npx vitest [partial filename]
```

To start the entire test suite in watch mode:

```bash
npx vitest
```

### Running linting

To run ESLint on the project:

```bash
npm run lint
```

### Updating snapshot examples

⚠️ This may break tests if schemas have been updated

```bash
npm run update:examples
```
