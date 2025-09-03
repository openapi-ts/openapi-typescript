# setQueryData Example

This example demonstrates the type-safe `setQueryData` functionality in `openapi-react-query`.

## Overview

The `setQueryData` method allows you to update cached query data with full TypeScript type safety. The updater function receives the current cached data and must return data of the same type, ensuring type consistency.

## Setup

1. Generate TypeScript types from the OpenAPI spec:

```bash
npm run generate-types
```

2. Run TypeScript check to see type safety in action:

```bash
npm run type-check
```

## Examples

### 1. Update posts list after creating a new post

```typescript
// After creating a post via POST /posts, update the GET /posts cache
$api.setQueryData(
  "get",
  "/posts",
  (oldPosts) => {
    // TypeScript ensures oldPosts is Post[] | undefined
    // and we must return Post[]
    const newPost = { id: "123", title: "New Post", content: "Content" };
    return oldPosts ? [...oldPosts, newPost] : [newPost];
  },
  queryClient,
);
```

### 2. Update a single post after editing

```typescript
// After updating a post, update the specific post cache
$api.setQueryData(
  "get",
  "/posts/{id}",
  (oldPost) => {
    // TypeScript ensures oldPost is Post | undefined
    // and we must return Post
    if (!oldPost) return oldPost;
    return { ...oldPost, title: "Updated Title" };
  },
  queryClient,
  { params: { path: { id: "123" } } },
);
```

### 3. Clear cache

```typescript
// Clear the posts cache
$api.setQueryData(
  "get",
  "/posts",
  () => [], // Must return Post[]
  queryClient,
);
```

## Type Safety

The `setQueryData` method enforces type safety:

- ✅ **Valid**: Returning the correct type
- ❌ **Invalid**: Returning a different type (TypeScript error)

See `demo-invalid.ts` for examples of invalid usage that will cause TypeScript errors.

## Running the Example

```bash
# Generate types
npm run generate-types

# Check types (should pass)
npm run type-check

# Check invalid examples (will show type errors)
npx tsc --noEmit demo-invalid.ts
```
