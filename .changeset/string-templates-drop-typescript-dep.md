---
"openapi-typescript": major
---

feat: generate TypeScript with raw string templates and drop the TypeScript dependency

`openapi-typescript` no longer uses the TypeScript compiler API (`ts.factory`,
`createPrinter`, `createSourceFile`) at runtime. Generation now builds the
`.d.ts` source with string templates, so the package

- works with **TypeScript 7** (the native compiler), which ships no classic
  compiler API — this fixes the `Cannot read properties of undefined (reading
  'createKeywordTypeNode')` crash,
- has **no runtime TypeScript dependency**: `typescript` is no longer a peer
  dependency and is not resolved at all when generating,
- supports TypeScript 6 in both the standalone and generated read/write
  helpers, including callable and readonly collection handling.

`Readable<T>` and `Writable<T>` preserve call signatures and built-in methods
while resolving visibility markers on other data properties. Readonly array
methods and iterators expose resolved elements without making positional or
additional data properties writable. These fixes also apply under TypeScript 5.

Output fixes include:

- `tsUnion()` / `tsIntersection()` no longer emit a redundant single-member
  union, so `(string)[][]` is now `string[][]`. Semantically identical.
- A multi-line `x-enum-descriptions` entry no longer leaks a bare token into the
  enum body (it used to produce invalid TypeScript); line breaks become spaces.
- With `pathParamsAsTypes`, a URL containing a backtick or `${` no longer breaks
  out of the generated template literal type.
- Nested immutable arrays retain their parentheses, and arrays of composed
  item types retain their outer array dimension.
- CommonJS declarations now match the actual default and named exports, and
  the published package includes the type dependencies needed by Redocly's
  public declarations for consumers with `skipLibCheck: false`.

**Breaking changes**

- `openapiTS()` now resolves to a `string` (the generated file body, without the
  comment header) instead of an array of AST nodes. The body ends with a newline.
- The transform hooks exchange plain strings instead of AST nodes:
  - `transform` returns `string | { schema: string; questionToken: boolean }`
  - `postTransform` receives and returns `string`
  - `transformProperty` receives and returns `{ name, optional, readonly, type, comment?, indent }`;
    use the new `tsComment()` helper to attach JSDoc from that hook
  - `GlobalContext.injectFooter` is now a `FooterDeclaration[]` (generated strings,
    plus a deferred `OperationsDeclaration` for the `operations` interface)
- Callbacks that used to build AST nodes with a separately installed `typescript`
  must return the equivalent type text instead, e.g.
  `ts.factory.createTypeReferenceNode("Date")` becomes `"Date"`. `typescript` is
  no longer required to use this package at all.
- The AST-oriented helpers `stringToAST()`, `tsModifiers()` and `QUESTION_TOKEN`
  were removed and are replaced by string builders: `typeLiteral()`,
  `tupleType()`, `propertySignature()`, `indexSignature()`, `typeAlias()`,
  `interfaceDecl()`, `enumDecl()`, `INDENT` and `tsComment()`.
- The `inject` option is now emitted verbatim instead of being re-printed by the
  TypeScript printer.
- `astToString()` now joins source strings and ensures a trailing newline. AST
  nodes and the former printer options argument are no longer supported;
  passing options throws instead of silently ignoring them.
- With `postTransform` configured, nonempty object-shaped `$defs` roots use type
  aliases so custom mapped types are valid. Root detection accepts surrounding
  comments and inline formatting while retaining the empty-root fallback.
