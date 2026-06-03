# Governance

This document outlines the governance model for openapi-typescript.

## Contributor model

The following elected roles are outlined for this project, and carry with it additional responsibilities and permissions for managing this open source project. All members must follow the [Code of Conduct](./CODE_OF_CONDUCT.md). Consequences for member violations are detailed in [Moderation](#moderation).

In this document, the term “maintainers” refers to both elected Leads and Core Contributors collectively. It does not include past contributors.

### Core Contributor

A Core Contributor owns the codebase(s) and is responsible for shepherding outside PRs to merge, and is responsible for project quality, maintenance, and direction.

A Core Contributor is invited to join by a Lead after demonstrating regular involvement, either in the form of multiple PRs opened, and/or participating in Issue discussions.

### Lead

A Lead maintains all responsibilities of a Core Contributor, and also manages the GitHub organization and additional resources like the website deployment, npm package credentials, domain, and sponsorship allocation. Leads organize the regular meetings and facilitate communication among the group. A Lead also may be a tiebreaker in the case of disagreement from a Core Contributor.

A Lead is a self-volunteer from a Core Contributor who has served for 6 months or more, and wants to take on more involvement in the direction of the project.

## Project direction

Project direction is determined by the current maintainers of the project, but involves anything tangentially related to the translation between the OpenAPI specification and TypeScript.

### Roadmap

The roadmap exists in the form of GitHub issues—feature requests and bug reports—that maintainers decide to prioritize in the order they choose. Beyond that, maintainers may decide to expand the project scope to additional tools given time, capacity, and mutual interest.

## Code review

Code reviews are done by at least one Lead or Core Contributor, given the following criteria are met:

1. The `main` branch must always be passing all CI checks before merging.
2. Packages >= `1.0` follow semantic versioning (“semver”), where breaking changes necessitate a new major version release. Packages < `1.0` follow the pattern of minor versions may introduce breaking changes, and patches are everything else.
3. PRs opened by non-maintainers need at least 1 maintainer approval to merge.
4. PRs opened by maintainers are encouraged to seek review(s) from peers, but may merge and release work without review if it meets all other criteria and standards of work.
5. PR authors should attempt to respond to all comments on a PR in a best-faith effort, or track followup work either in GitHub Issues if the scope/direction is clear, or GitHub Discussions if not.

## Financial contributions

openapi-typescript is a 100% volunteer open source project, and is not financial backed by any legal entity. To maintain this free public resource that operates under an open source license and model, openapi-typescript accepts **Sponsorship** for funding the project.

openapi-typescript does not currently participate in bounties under the belief that it rewards quick fixes over long term maintenance. Bounties also take funds away from Core Contributors that still have significant work to do in shepherding outside contributions, and are ultimately responsible for the long term quality of this project.

### Sponsorship

Sponsorship can be placed through [Open Collective](https://opencollective.com/openapi-ts). The rewards and tiers are communicated through Open Collective. At this time GitHub Sponsors isn’t supported.

### Fund Allocation

Fund allocation is made transparent through Open Collective. The funds are distributed first to pay for recurring expenses, and the rest are distributed evenly among maintainers.

### Recurring expenses

Recurring expenses include, but aren’t limited to domain cost, website hosting, and GitHub organization costs—bare essentials needed to run the project and provide documentation for free.

### Lead/Core Contributor payout

The remaining funds are distributed evenly among maintainers on a monthly basis, keeping the project at a $0 monthly balance (for now). Maintainers get paid the month they join the project. Payout amounts and dates are made public via [Open Collective](https://opencollective.com/openapi-ts).

## Moderation

Moderation is the process of handling violations of the [Code of Conduct](./CODE_OF_CONDUCT.md).

### Reporting

Anyone may report a violation. Violations can be reported:

- In **private**, via `openapi-ts@googlegroups.com` which is listed in the Code of Conduct. All Core Contributors monitor this email address.
- In **private**, via email to one or more Core Contributor
- In **public**, via a GitHub comment (mentioning `@openapi-ts/maintainers`).

### Reviewing

The incident will be reviewed by all maintainers to determine if a Code of Conduct violation occurred (barring any conflict of interest). As soon as consensus is reached, the reporter will be notified of whether or not a violation occurred, and what the resolution is.

### Resolution

In the case action is needed, it may result in any or all of the following, but not limited to:

- Private or public apology
- Ban from participating in the GitHub organization (including code contributions, and Issue and Discussion comments). This may be temporary or permanent.
  - In the case a maintainer violated the Code of Conduct, a ban includes stripping of their elected title and all access from the project.
- A community Discussion post notifying the rest of the community of the action taken (though details of the violation may be omitted at the discretion of maintainers to protect personal information of any involved parties).
