---
name: "Bug report: openapi-typescript"
about: For the openapi-typescript library
title: ""
labels: openapi-ts, bug
assignees: ""
body:
  - type: input
    attributes:
      label: openapi-typescript version
      placeholder: x.x.x
    validations:
      required: true
  - type: input
    attributes:
      label: Node.js version
      placeholder: 20.x.x
    validations:
      required: true
  - type: input
    attributes:
      label: OS + version
      placeholder: macOS 15.1.1
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
        - label: My OpenAPI schema is valid and passes the [Redocly validator](https://redocly.com/docs/cli/commands/lint/) (`npx @redocly/cli@latest lint`)
          required: true
        - label: I’m willing to open a PR (see [CONTRIBUTING.md](https://github.com/openapi-ts/openapi-typescript/blob/main/packages/openapi-typescript/CONTRIBUTING.md))
---
