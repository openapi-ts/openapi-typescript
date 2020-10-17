# Contributing

Thanks for being willing to contribute!

**Working on your first Pull Request?** You can learn how from this _free_
series [How to Contribute to an Open Source Project on GitHub][egghead]

## Project setup

1.  Fork and clone the repo
2.  Run `npm install` to install dependencies
3.  Create a branch for your PR with `git checkout -b pr/your-branch-name`

> Tip: Keep your `master` branch pointing at the original repository and make
> pull requests from branches on your fork. To do this, run:
>
> ```
> git remote add upstream https://github.com/drwpow/openapi-typescript.git
> git fetch upstream
> git branch --set-upstream-to=upstream/master master
> ```
>
> This will add the original repository as a "remote" called "upstream," Then
> fetch the git information from that remote, then set your local `master`
> branch to use the upstream master branch whenever you run `git pull`. Then you
> can make all of your pull request branches based on this `master` branch.
> Whenever you want to update your version of `master`, do a regular `git pull`.

## Committing and Pushing changes

Please make sure to run the tests (`npm test`) before you commit your changes.

## Help needed

Please checkout the [the open issues][issues]. Issues labelled [**Help
Wanted**][help-wanted] and [**Good First Issue**][good-first-issue] are
especially good to help with.

Also, please watch the repo and respond to questions/bug reports/feature
requests! Thanks!

## Deploying (access only)

If you have access to the npm project, run the following:

```bash
npm run deploy
```

Follow the prompts to release.

[all-contributors]: https://github.com/all-contributors/all-contributors
[egghead]: https://egghead.io/series/how-to-contribute-to-an-open-source-project-on-github
[good-first-issue]: https://github.com/drwpow/openapi-typescript/issues?q=is%3Aissue+is%3Aopen+label%3A%22good+first+issue%22
[help-wanted]: https://github.com/drwpow/openapi-typescript/issues?q=is%3Aissue+is%3Aopen+label%3A%22help+wanted%22
[issues]: https://github.com/drwpow/openapi-typescript/issues
