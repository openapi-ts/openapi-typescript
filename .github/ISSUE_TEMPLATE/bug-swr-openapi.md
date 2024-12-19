---
name: "Bug report: swr-openapi"
about: For the swr-openapi library
title: ""
labels: swr-openapi, bug
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
      options:
        - label: I’m willing to open a PR (see [CONTRIBUTING.md](https://github.com/openapi-ts/openapi-typescript/blob/main/packages/swr-openapi/CONTRIBUTING.md))
---
