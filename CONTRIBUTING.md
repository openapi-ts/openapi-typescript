# Contributing

Thanks for being willing to contribute!

**Working on your first Pull Request?** You can learn how from this _free_ series [How to Contribute to an Open Source
Project on GitHub][egghead]

## Project setup

1.  Fork and clone the repo
2.  Run `npm install` to install dependencies
3.  Create a branch for your PR with `git checkout -b pr/your-branch-name`

It’s also recommended you have [ESLint][eslint] installed and set up correctly. You may also run the command
`npm run lint` to see lint errors.

> Tip: Keep your `main` branch pointing at the original repository and make pull requests from branches on your fork. To
> do this, run:
>
> ```
> git remote add upstream https://github.com/drwpow/openapi-typescript.git
> git fetch upstream
> git branch --set-upstream-to=upstream/master master
> ```
>
> This will add the original repository as a "remote" called "upstream," Then fetch the git information from that
> remote, then set your local `main` branch to use the upstream main branch whenever you run `git pull`. Then you can
> make all of your pull request branches based on this `main` branch. Whenever you want to update your version of
> `main`, do a regular `git pull`.

## Committing and pushing changes

Please make sure to run the tests (`npm test`) before you commit your changes.

### Local schemas

This repo supports OpenAPI 2.0 and 3.0. There are some real-world examples located in `tests/v2/specs/*.yaml` and
`tests/v3/specs/*.yaml`, respectively. Testing large, real schemas was a major goal of this project. Many libraries only
test the “Petstore” example from Swagger, which is contrived and is missing much complexity from companies’ production
schemas.

_Note: don’t update the `yaml` schemas with your own custom additions (but if the official versions have updated, then
it’s fine to update them here). If you’d like to add your schema for testing, then please add them as a new schema, and
add them to `./expected/*.ts`._

#### Regenerating schemas

If you’ve added a feature or fixed a bug and need to update the generated schemas, run the following:

```
# 1. re-build the package
npm run build
# 2. run the local CLI (not the npm one!)
./bin/cli.js tests/v3/specs/github.yaml -o tests/v3/expected/github.ts
```

This should update the expected TypeScript definiton.

_Also if this appears in `examples/` feel free to update that, too!_

## Help needed

Please check out the [the open issues][issues]. Issues labelled [**Help Wanted**][help-wanted] and [**Good First
Issue**][good-first-issue] are especially good to help with.

Also, please watch the repo and respond to questions/bug reports/feature requests! Thanks!

## Deploying (access only)

If you have access to the npm project, run the following:

```bash
npm run deploy
```

Follow the prompts to release.

[all-contributors]: https://github.com/all-contributors/all-contributors
[egghead]: https://egghead.io/series/how-to-contribute-to-an-open-source-project-on-github
[eslint]: https://eslint.org/
[good-first-issue]:
  https://github.com/drwpow/openapi-typescript/issues?q=is%3Aissue+is%3Aopen+label%3A%22good+first+issue%22
[help-wanted]: https://github.com/drwpow/openapi-typescript/issues?q=is%3Aissue+is%3Aopen+label%3A%22help+wanted%22
[issues]: https://github.com/drwpow/openapi-typescript/issues
