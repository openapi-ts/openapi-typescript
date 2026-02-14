# Maintainers

Additional criteria on top of the base [CONTRIBUTING.md](CONTRIBUTING.md) guidelines, this is meant to serve as a basic guide to how this project has reviewed PRs, accepted or rejected changes, and related topics.

## Project North Star

The project’s #1 goal is **generate valid TypeScript for any OpenAPI schema**—emphasis on “any.” We should be able to express any valid OpenAPI document as type-safe TypeScript definition files.

This project also _did_ historically value **zero runtime**, in the belief that a fast, performant library is a good developer experience. But after the `openapi-fetch` experiment, learned that maybe **some runtime** is OK. As of the time of writing this, “zero runtime” is still in the docs everywhere almost like a tagline. But if we’re really splitting hairs here, it’s really **all runtime costs are justified** that is the _true_ goal (but that’s not as pithy). Historically we just haven’t been able to justify any runtime costs. But if that decision arose in the future, runtime is OK if it’s necessary and there are no alternatives.

## Reviewing

Keeping the North Star in mind, here’s the necessary criteria for a PR:

- **Tests written.** No exceptions. They make a change, they MUST write a test.
  - Updating existing tests is not OK. It must be a new test (if their change does necessitate updating other tests, that’s fine but doesn’t count towards testing their PR, but also, updating existing tests falls under breaking change consideration)
- **Changeset applied.** We need authors to write a changeset. However, in case of emergency, or the author has dropped off the face of the earth, we can update changelogs ourselves, but at least prompt the author to add one themselves (also, changesets gives them credit automatically, so it’s less work for us if the changeset merges in the same PR as the original author, otherwise manual edits are needed).

And lastly, if it’s backwards-compatible, perhaps give less scrutiny over it than if output is greatly-affected.

### Breaking changes & backwards-compatibility

This is where reviews get harder. If a PR does introduce breaking changes, it’s up to you to determine whether or not folks would see this as a bugfix or not. A general rule of thumb:

- It might be a `patch` if the output is higher resolution, i.e. provides more type detail that was missing previously.
- It might be a `major` release if the example changes are thousands and thousands of lines (and the changes are complex and layered).
- It might be a `major` release if the output seems laterally-different, such as replacing `|` for `&`.

There’s more subjectivity to it than one realizes. In general, try and estimate how many people _may_ be impacted. Use the OpenAPI example specs as a reference—you can at least see how much it changes the output for a handful of real-world scenarios. Try and wait to ship sweeping, high-impact changes for major releases if at all possible.

### Breaking changes in disguise

[Here’s an example of a PR](https://github.com/openapi-ts/openapi-typescript/pull/2608) that on the surface seems to meet all criteria, but is actually risky to merge (this is not a criticism of the author! they did a great job and this is solely commentary on this library):

- Good, clear PR description
- Good, clear tests
- All existing tests pass, so it _seems_ like a backwards-compatible change
- The `examples/` changed (GitHub API, etc.) don’t change _that much_

However, it touches on the [intersections vs unions debacle](#intersections-vs-unions-debacle) and based on historic precedent requires more scrutiny. In reality, [every change breaks someone’s workflow](https://xkcd.com/1172/). So even though this change is minor, **this should probably be slated for a major release if possible.**

## Releasing

The release process is:

1. Contributor adds a `changeset` via the 🦋 **Changeset bot** instructions left in a comment. They’ll pick `patch` or `minor` (we don’t allow contributors to ship major versions)
2. On merge, the `release.yml` GitHub Action runs, and if there are any changes in the `.changeset` folder, it will make a PR and update the versions appropriately (and use the `GITHUB_TOKEN` to see who made the commit, and what the original PR was, so the CHANGELOG notes are automatically updated)
3. It will open a `[ci] Release` PR with the changes to review.

This is where you come in! With that PR:

1. [ ] **Review the libraries and changes.** Does the changelog accurately reflect the real changes? Is a library bumped that had no changes (e.g. did someone accidentally write a changeset just for docs)?
2. [ ] **Check for accidental major bumps.** Changesets has [a wontfix bug](https://github.com/changesets/changesets/issues/1011) where they bump major versions willy-nilly. They’ve tried to explain it and justify it, but I strongly disagree. I also don’t have time to switch from changesets. In a single-library world, this shouldn’t matter as much, but in a multi-library monorepo we’d have to check for this every release 😞
3. [ ] (Optional) **Update changelog if needed.** Some PRs may have skipped changelog. If a maintainer added a changelog for a contributor, make sure the contributor gets credit in the changelog. Maybe the changelog has typos. Changesets is only helping with **generation.** As a maintainer you have full authority to manually correct the changelog if needed (that’s why we have these review PRs—to make corrections as part of the process).

If everything looks good, ✅ Approve and merge! The packages will be released as soon as the `release.yml` GitHub Action runs (it’s triggered from the changes to `package.json`s, so if you ever needed to manually release, any commit on `main` with version bumps will publish a new release, regardless of CHANGELOGs).

### Versioning

This project follows generic semver:

- **major** for breaking changes
- **minor** for new functionality (new flag)
- **patch** for bugfixes or minor updates (generally-speaking, if output improves but no options are added, this is probably a patch).

For 0.x projects (which, again, no longer apply), we’d switch to use `patch` for any **backwards-compatible change** and `minor` for all **breaking changes** (i.e. disregard feature vs bug).

## History

Notable timeline events that can save some churn.

### 2.0 and the switch to literal translation

v1 of this library tried to convert everything to PascalCase, but that blows up if a name isn’t a valid JS identifier (e.g. it can’t start with a number, contain dashes, etc.). v2 rewrote to allow object keys instead, which in TypeScript does require the annoying-but-necessary `components["schemas"]["foo"]["bar"]` syntax.

The PR change has a summary here: https://github.com/openapi-ts/openapi-typescript/pull/178.

This is relevant because folks still request this, and we’ve allowed different flags over time, such as `--root-type` (v7). But it always explodes into more and more options because folks want to customize, such as `--root-types-keep-casing`, `--root-types-no-schema-prefix`.

If there’s one takeaway I can take from this it’s no matter what you do, you can’t make everyone happy. But if people are only requesting **aesthetic** changes then you’ve done a good job. You don’t have to entertain aesthetic suggestions if they’re unblocked (in fact I’d recommend you don’t).

### Intersections vs Unions debacle

TypeScript intersections are the bane of this library. Though reading these aren’t required, here is a list of some issues where a simple `|` or `&` does not do what one would think:

- [#894](https://github.com/openapi-ts/openapi-typescript/issues/894): anyOf should not result in intersection type
- [#958](https://github.com/openapi-ts/openapi-typescript/issues/958): Generates `& { property: unknown; }` with `allOf` union
- [#1077](https://github.com/openapi-ts/openapi-typescript/issues/1077): The generated `OneOf` type can cause issues for large files
- [#1019](https://github.com/openapi-ts/openapi-typescript/issues/1019): Use of `OneOf` type causing upcasting to any

The tricky part is with all these seemingly-unrelated problems, making one tiny change here may solve for one case and break another. At the center of it is the issue that `|` is NOT a strict XOR discriminator, and in some scenarios almost behaves like `&` does. The TL;DR here is **test, test, test.** Treat the generated type as meaningless. Instead, [go into a TypeScript playground](https://www.typescriptlang.org/play/), and test that a structure throws the errors you’d want to see. [Write type tests](https://vitest.dev/guide/testing-types.html) to prevent tricky regressions.

### openapi-fetch

In 2023 we added openapi-fetch to the project, which was designed to be a type-safe wrapper for `fetch()`. The original idea was: it’s just `fetch()`, with TypeScript flavorings. But as projects are wont to do, the little additions for the sake of quality-of-life crept in, because users really need:

- The ability to control serialization. If you have `{ users: [1, 2, 3] }`, how does the server want that? [simple exploded](https://swagger.io/docs/specification/v3_0/serialization/)? [matrix unexploded](https://swagger.io/docs/specification/v3_0/serialization/)?
- The ability to set defaults. If an OpenAPI spec has a required param but provides a default, how can a user avoid copy/pasting that everywhere?
- File uploads. This was particularly tricky to do in a type-safe way.

Not to mention this library required changes to `openapi-typescript` core to generate the necessary types to make it possible. It resulted in learning the following lessons:

- **Pure `.d.ts`-only fetch clients are not valuable.** We’re talking _pure_-pure, which was what openapi-fetch was. There was no codegen, and it had zero runtime knowledge of your schema. Folks found this to be usable for simple cases, but inevitably as their project grew they did want an SDK that saved them from duplicating code.
  - **Bad SDKs are still bad, though.** swagger-codegen and the like, generating a net-new function that just copy-pastes everything, is still a bad experience. openapi-fetch was ~3kb minified! Some bad SDKs can be 0.25MB-0.5MB or more in real-world cases. Half a megabyte of wasteful boilerplate. So there’s a balance her!
- **Performance isn’t a major concern.** Even though openapi-fetch was significantly faster than axios, etc. no one seemed to care. Users wanted type safety, not speed.

### 2026 Roadmap

The [2026 roadmap post](https://github.com/openapi-ts/openapi-typescript/discussions/2559) deprecated openapi-fetch and all other non-core projects to focus efforts. This turned the originally-single-library-project-turned-multi-library-monorepo back into the single project library again. This reduction in scope was necessary after 2025 not producing many significant changes or improvements to the core libraries, and open issues slowly ticking up with the number of comments. The general consensus was that `openapi-typescript` is well-liked but slowly falling behind, and the other libraries weren’t quite meeting the quality bar.

Since we can’t magically conjure more resources and time, we had to make the hard choice of deprecating everything but `openapi-typescript` so we can have one great library instead of several mediocre/buggy ones.
