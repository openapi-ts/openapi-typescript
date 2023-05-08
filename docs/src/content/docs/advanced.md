---
title: Advanced
description: Advanced usage as well as tips, tricks, and best practices
---

Various anselary topics and advanced usage.

## Data fetching

Fetching data can be done simply and safely using an **automatically-typed fetch wrapper**:

- [openapi-fetch](./openapi-fetch) (recommended)
- [openapi-typescript-fetch](https://www.npmjs.com/package/openapi-typescript-fetch) by [@ajaishankar](https://github.com/ajaishankar)

> ✨ **Tip**
>
> A good fetch wrapper should **never use generics.** Generics require more typing and can hide errors!

## Tips

In no particular order, here are a few best practices to make life easier when working with OpenAPI-derived types.

### Embrace `snake_case`

Different languages have different preferred syntax styles. To name a few:

- `snake_case`
- `SCREAMING_SNAKE_CASE`
- `camelCase`
- `PascalCase`
- `kebab-case`

TypeScript, which this library is optimized for, uses mostly `camelCase` with some sprinkles of `PascalCase`(classes) and `SCREAMING_SNAKE_CASE` (constants).

However, APIs are language-agnostic, and may contain a different syntax style from TypeScript (usually indiciative of the language of the backend). It’s not uncommon to encounter `snake_case` in object properties. And so it’s tempting for most JS/TS developers to want to enforce `camelCase` on everything for the sake of consistency. But it’s better to **resist that urge** because in addition to being a timesink, it introduces the following maintenance issues:

- ❌ generated types (like the ones produced by openapi-typescript) now have to be manually typed again
- ❌ renaming has to happen at runtime, which means you’re slowing down your application for an invisible change
- ❌ name transformation utilities have to be built & maintained (and tested!)
- ❌ the API probably needs `snake_case` for requestBodies anyway, so all that work now has to be undone for every API request

Instead, treat “consistency” in a more holistic sense, recognizing that preserving the API schema as-written is better than adhering to language-specific style conventions.

### Be specific in your schema

openapi-typescript will **never produce an `any` type**. Anything not explicated in your schema may as well not exist. For that reason, always be as specific as possible. Here’s how to get the most out of `additionalProperties`:

<table>
  <thead>
    <tr>
      <td style="width:10%"></td>
      <th scope="col" style="width:40%">Schema</th>
      <th scope="col" style="width:40%">Generated Type</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <th scope="row">
        ❌ Bad
      </th>
      <td>

```yaml
type: object
```

</td>
      <td>

```ts
Record<string, never>;
```

</td>
    </tr>
    <tr>
      <th scope="row">
        ❌ Less Bad
      </th>
      <td>

```yaml
type: object
additionalProperties: true
```

</td>
      <td>

```ts
Record<string, unknown>;
```

</td>
    </tr>
    <tr>
      <th scope="row">
        ✅ Best
      </th>
      <td>

```yaml
type: object
additionalProperties:
  type: string
```

</td>
      <td>

```ts
Record<string, string>;
```

</td>
    </tr>

  </tbody>
</table>

When it comes to **tuple types**, you’ll also get better results by representing that type in your schema. Here’s the best way to type out an `[x, y]` coordinate tuple:

<table>
  <thead>
    <tr>
      <td style="width:10%"></td>
      <th scope="col" style="width:40%">Schema</th>
      <th scope="col" style="width:40%">Generated Type</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <th scope="row">
        ❌ Bad
      </th>
      <td>

```yaml
type: array
```

</td>
      <td>

```ts
unknown[]
```

</td>
    </tr>
    <tr>
      <th scope="row">
        ❌ Less Bad
      </th>
      <td>

```yaml
type: array
items:
  type: number
```

</td>
      <td>

```ts
number[]
```

</td>
    </tr>
    <tr>
      <th scope="row">
        ✅ Best
      </th>
      <td>

```yaml
type: array
items:
  type: number
maxItems: 2
minItems: 2
```

— or —

```yaml
type: array
items:
  type: number
prefixItems:
  - number
  - number
```

</td>
      <td>

```ts
[number, number];
```

</td>
    </tr>

  </tbody>
</table>
