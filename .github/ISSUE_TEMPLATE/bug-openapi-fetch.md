---
name: "Bug report: openapi-fetch"
about: For the openapi-fetch library
title: ""
labels: openapi-fetch, bug
assignees: ""
body:
  - type: input
    attributes:
      label: Version
      placeholder: x.x.x
    validations:
      required: true
  - type: textarea
    id: description
    attributes:
      label: Description
      description: A brief description of the bug. Provide either a screenshot or the full error message!
    validations:
      required: true
  - type: textarea
    id: repro
    attributes:
      label: Reproduction
      description: How can this be reproduced / when did the error occur? Does the issue occur in a specific browser, or all browsers? Bonus points for a GitHub repository link.
    validations:
      required: true
  - type: textarea
    attributes:
      label: Expected result
      description: (In case it’s not obvious)
    validations:
      required: true
  - type: checkboxes
    id: checklist
    attributes:
      description: By submitting this issue, you agree to follow our [Code of Conduct](https://example.com).
      options:
        - label: I agree to follow this project's [Code of Conduct](https://github.com/openapi-ts/openapi-typescript/blob/main/CODE_OF_CONDUCT.md)
          required: true
        - label: I’m willing to open a PR (see [CONTRIBUTING.md](https://github.com/openapi-ts/openapi-typescript/blob/main/packages/openapi-fetch/CONTRIBUTING.md))
---
