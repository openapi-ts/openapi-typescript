## Changes

Implements <https://github.com/openapi-ts/openapi-typescript/issues/2160>.

## How to Review

_How can a reviewer review your changes? What should be kept in mind for this review?_

## Todo

The goal of this PR is to implement all features supported by openapi-react-query.

### Roughly implementation

- [x] queryOptions
- [x] useQuery
- [x] useMutation
- [x] useInfiniteQuey

vue-query doesn't support following features:

- useSuspenseQuery

### Skipped test cases

- queryOptions
  - [ ] returns query options that can be passed to useQueries
  - [ ] returns query options that can be passed to useQuery
  - [ ] returns query options without an init
- useQuery
  - [ ] should infer correct data and error type
  - [ ] should infer correct data when used with select property
  - [ ] should use provided custom queryClient
  - [ ] uses provided options
- useMutation
- [ ] should use provided custom queryClient
  - mutateAsync
    - [ ] should use provided custom queryClient

### docs

- [ ] README.md
- [ ] docs/

## Checklist

- [ ] Unit tests updated
- [ ] `docs/` updated (if necessary)
- [ ] `pnpm run update:examples` run (only applicable for openapi-typescript)
