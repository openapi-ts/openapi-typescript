# setQueryData Example

This example demonstrates the type-safe `setQueryData` functionality in `openapi-react-query`.

## Overview

The `setQueryData` method allows you to update cached query data with full TypeScript type safety. The updater function receives the current cached data and must return data of the same type, ensuring type consistency.

## Setup

1. Generate TypeScript types from the OpenAPI spec:

```bash
npm run generate-types
```

1. Run TypeScript check to see type safety in action:

```bash
npm run type-check
```
