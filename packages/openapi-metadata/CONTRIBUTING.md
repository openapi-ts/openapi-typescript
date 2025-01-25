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

### Testing

This library uses [Vitest](https://vitest.dev/) for testing. There’s a great [VS Code extension](https://marketplace.visualstudio.com/items?itemName=ZixuanChen.vitest-explorer) you can optionally use if you’d like in-editor debugging tools.

To run the entire test suite, run:

```bash
pnpm test
```

To run an individual test:

```bash
pnpm test -- [partial filename]
```

To start the entire test suite in watch mode:

```bash
npx vitest
```

#### TypeScript tests

**Don’t neglect writing TS tests!** In the test suite, you’ll see `// @ts-expect-error` comments. These are critical tests in and of themselves—they are asserting that TypeScript throws an error when it should be throwing an error (the test suite will actually fail in places if a TS error is _not_ raised).

As this is just a minimal fetch wrapper meant to provide deep type inference for API schemas, **testing TS types** is arguably more important than testing the runtime. So please make liberal use of `// @ts-expect-error`, and as a general rule of thumb, write more **unwanted** output tests than _wanted_ output tests.

### Running linting

Linting is handled via [Biome](https://biomejs.dev), a faster ESLint replacement. It was installed with `pnpm i` and can be run with:

```bash
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
