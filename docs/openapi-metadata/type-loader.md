---
title: Type Loader
---

# Type Loader

A Type Loader transforms a `Constructor` into a `SchemaObject`. It gives the ability to extends the inference capabilities when generating a document.

For example `String` will be transformed into `{ type: 'string' }`.

## Custom Type Loader

In this example we will see how to create a custom loader for the [Luxon](https://moment.github.io/luxon/#/?id=luxon) `DateTime`.

In the following schema we have a property that cannot be loaded as is is unknown by the Document generator.

```ts
import { DateTime } from "luxon";

export default class User {
  @ApiProperty()
  createdAt: DateTime;
}
```

When our API returns a Luxon DateTime, it uses the `toString()` meaning that our client will receive a string.
The user could explicitly define the type `@ApiProperty({ type: 'string' })` but as this library goal is to provide a great DX it is possible to create a custom type loader.

```ts
import { TypeLoaderFn, generateDocument } from "openapi-metadata";
import { DateTime } from "luxon";

const LuxonDateTimeLoader = (_context, value) => {
  if (value === DateTime) {
    return { type: "string" };
  }
};

await generateDocument({
  loaders: [LuxonDateTimeLoader],
});
```

If you have more complex schemas to generate, you can store it in the components and return a reference instead:

```ts
const CustomLoader: TypeLoaderFn = (context, value) => {
  if (isCustom(value)) {
    const [name, schema] = generateCustomSchema(value);

    context.schemas[name] = schema;

    return { $ref: `#/components/schemas/${name}` };
  }
};
```
