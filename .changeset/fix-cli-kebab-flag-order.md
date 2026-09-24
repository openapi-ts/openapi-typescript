---
"openapi-typescript": patch
---

Fix CLI hanging when multi-word flags appear before the schema file argument. Flags such as `--enum-values`, `--path-params-as-types`, `--dedupe-enums`, `--empty-objects-unknown`, and others were not recognized as boolean by the argument parser when written in kebab-case, causing the schema path to be silently consumed as the flag's value and leaving the CLI waiting on stdin. Both camelCase and kebab-case forms are now registered as boolean.
