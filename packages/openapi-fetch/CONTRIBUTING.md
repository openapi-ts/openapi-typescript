# Contributing

Thanks for being willing to contribute! 🙏

**Working on your first Pull Request (PR)?** You can learn how from this free series [How to Contribute to an Open Source Project on GitHub](https://app.egghead.io/playlists/how-to-contribute-to-an-open-source-project-on-github).

## Open issues

Please check out the [the open issues](https://github.com/openapi-ts/openapi-typescript/issues). Issues labelled [**Good First Issue**](https://github.com/openapi-ts/openapi-typescript/issues?q=is%3Aissue+is%3Aopen+label%3A%22good+first+issue%22) are especially good to start with.

Contributing doesn’t have to be in code. Simply answering questions in open issues or providing workarounds is as important as making pull requests.

## Writing code

### Setup

1. Install [pnpm](https://pnpm.io/)
2. [Fork this repo](https://docs.github.com/en/get-started/quickstart/fork-a-repo) and clone your copy locally
3. Run `pnpm i` to install dependencies

### Runtime code vs static type declarations

This project uses **manual type declarations** ([docs](https://www.typescriptlang.org/docs/handbook/2/type-declarations.html#dts-files)) that are kept separately from the runtime code. `index.d.ts` contains **type declarations**, and `index.js` contains **runtime code**. The most important code lives in `index.d.ts` because this library exists to provide correct type inference. `index.js`, is far less important, and is only doing bare-minimum work to support the API as efficiently as possible.

In most projects, **this is not recommended practice** as the two can (and will) diverge, and you’re left with types that “lie” to you about what the runtime is doing. So this project does have that liability. However, due to the unique nature of this project implementing complex type inference from user-provided schemas, the type inference itself is so complex it was interfering with readable, maintainable, runtime code. By separating the two we won’t have the more complex parts of TypeScript interfering with the optimal runtime code. This would not be tenable in a larger project, but is perfect for a small codebase like this with minimal surface area.

When writing code, it’s tempting to ignore `index.d.ts` and only make runtime updates, since that is generally simpler. But **please don’t!** We write tests in `*.test.ts` files intentionally so that the type inference can be typechecked as well as the runtime. Whenever you make a change to `index.js`, you probably need to also make a chance to `index.d.ts`, too. And **testing type correctness in tests is just as important as testing the runtime!**

### Testing

This library uses [Vitest](https://vitest.dev/) for testing. There’s a great [VS Code extension](https://marketplace.visualstudio.com/items?itemName=ZixuanChen.vitest-explorer) you can optionally use if you’d like in-editor debugging tools.

To run the entire test suite, run:

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

#### Important test-writing tips

All tests in this project should adhere to the following rules:

1. **Use `assertType<T>(…)`** ([docs](https://vitest.dev/guide/testing-types)). Don’t just check the _actual_ runtime value; check the _perceived_ type as well.
2. **Testing TS errors is just as important as testing for expected types.** Use `// @ts-expected-error` liberally. this is discouraged because it’s hiding an error. But in our tests, we **want** to test that a TS error is thrown for invalid input.
3. **Scope `// @ts-expect-error` as closely as possible.** Remember that JS largely ignores whitespace. When using `// @ts-expect-error`, try and break up an expression into as many lines as possible, so that the `// @ts-expect-error` is scoped to the right line. Otherwise it is possible a _different part of the expression_ is throwing the error!
4. **Manually type out type tests.** Avoid using [test.each](https://vitest.dev/api/#test-each) for type tests, as it’s likely hiding errors.

### Linting

Linting is handled via [Biome](https://biomejs.dev), a faster ESLint replacement. It was installed with `pnpm i` and can be run with:

```sh
pnpm run lint
```

### Changelogs

The changelog is generated via [changesets](https://github.com/changesets/changesets), and is separate from Git commit messages and pull request titles. To write a human-readable changelog for your changes, run:

```
npx changeset
```

This will ask if it’s a `patch`, `minor`, or `major` change ([semver](https://semver.org/)), along with a plain description of what you did. Commit this new file along with the rest of your PR, and during the next release this will go into the official changelog!

## Opening a Pull Request

Pull requests are **welcome** for this repo!

Bugfixes will always be accepted, though in some cases some small changes may be requested.

However, if adding a feature or breaking change, please **open an issue first to discuss.** This ensures no time or work is wasted writing code that won’t be accepted to the project (see [Project Goals](https://openapi-ts.dev/openapi-fetch/about/#project-goals)). Undiscussed feature work may be rejected at the discretion of the maintainers.

### Writing the commit

Create a new branch for your PR with `git checkout -b your-branch-name`. Add the relevant code as well as docs and tests. When you push everything up (`git push`), navigate back to your repo in GitHub and you should see a prompt to open a new PR.

While best practices for commit messages are encouraged (e.g. start with an imperative verb, keep it short, use the body if needed), this repo doesn’t follow any specific guidelines. Clarity is favored over strict rules. Changelogs are generated separately from git (see [the Changelogs section](#changelogs)).

### Writing the PR notes

**Please fill out the template!** It’s a very lightweight template 🙂.

### Adding docs

If you added a feature, or changed how something worked, please [update the docs](../../docs/)!

### Passing CI

All PRs must fix lint errors, and all tests must pass. PRs will not be merged until all CI checks are “green” (✅).
