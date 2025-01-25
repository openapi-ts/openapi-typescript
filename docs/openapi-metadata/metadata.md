---
title: Metadata
---

# Metadata

[Decorators](./decorators.md) does not contain business logic, their purpose is to store metadata to be used when generating the document.
This makes it easy to integrate this library into a framework and create custom decorators.

Here is an example of a custom decorator that define an operation summary:

```ts
import { OperationMetadataStorage } from "openapi-metadata/metadata";

export function ApiSummary(summary: string): MethodDecorator {
  return (target, propertyKey) => {
    OperationMetadataStorage.mergeMetadata(target, { summary }, propertyKey);
  };
}
```

## MetadataStorage

A MetadataStorage is a utility for managing metadata:

### `defineMetadata`

This method sets the metadata. It overwrites existing metadata.

```ts
import { OperationMetadataStorage } from "openapi-metadata/metadata";

// Without propertyKey
OperationMetadataStorage.defineMetadata(target, { summary: "Hello world" });

// With propertyKey
OperationMetadataStorage.defineMetadata(
  target,
  { summary: "Hello world" },
  propertyKey,
);
```

### `mergeMetadata`

Similar to `defineMetadata`, this method sets the metadata but [deepmerge](https://www.npmjs.com/package/deepmerge) its content with exising metadata.

```ts
import { OperationMetadataStorage } from "openapi-metadata/metadata";

// Without propertyKey
OperationMetadataStorage.mergeMetadata(target, { summary: "Hello world" });

// With propertyKey
OperationMetadataStorage.mergeMetadata(
  target,
  { summary: "Hello world" },
  propertyKey,
);
```

### `getMetadata`

This method retrieve the stored metadata. When used with a `propertyKey` you can also define `withParent` to [deepmerge](https://www.npmjs.com/package/deepmerge) the metadata with the one defined on the class.

```ts
import { OperationMetadataStorage } from "openapi-metadata/metadata";

OperationMetadataStorage.getMetadata(target);
OperationMetadataStorage.getMetadata(target, propertyKey);
OperationMetadataStorage.getMetadata(target, propertyKey, true);
```

## Custom MetadataStorage

You can create a custom metadata storage by using the `createMetadataStorage` function.

```ts
import { createMetadataStorage } from "openapi-metadata/metadata";

type CustomMetadata = { foo: "bar" };

const CustomMetadataKey = Symbol("Custom");

const CustomMetadataStorage =
  createMetadataStorage<CustomMetadata>(CustomMetadataKey);
```
