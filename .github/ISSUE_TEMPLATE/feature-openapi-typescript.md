---
name: "Feature request: openapi-typescript"
about: For the openapi-typescript library
title: ""
labels: openapi-ts, enhancement, help wanted
assignees: ""
body:
  - type: textarea
    id: description
    attributes:
      label: Description
      description: Brief description of the problem you’re trying to solve, and why this could be useful.
    validations:
      required: true
  - type: textarea
    id: proposal
    attributes:
      label: Proposal
      description: Outline the change to the library. If this is for the CLI, propose a flag name and/or workflow. If this is for Node API, propose how this would be consumed. Reference any prior art or similar examples.
    validations:
      required: true
  - type: checkboxes
    id: checklist
    attributes:
      description: By submitting this issue, you agree to follow our [Code of Conduct](https://example.com).
      options:
        - label: I agree to follow this project's [Code of Conduct](https://github.com/openapi-ts/openapi-typescript/blob/main/CODE_OF_CONDUCT.md)
          required: true
        - label: I’m willing to open a PR (see [CONTRIBUTING.md](https://github.com/openapi-ts/openapi-typescript/blob/main/packages/openapi-typescript/CONTRIBUTING.md))
---
