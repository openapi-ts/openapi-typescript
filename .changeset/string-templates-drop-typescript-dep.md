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
- produces the same output as 7.x: every committed example snapshot, the test
  suite, and a differential run over 27 option combinations are byte-for-byte
  identical.

Three deliberate output differences, all of them fixes for invalid or redundant
output (see the PR description for reproductions):

- `tsUnion()` / `tsIntersection()` no longer emit a redundant single-member
  union, so `(string)[][]` is now `string[][]`. Semantically identical.
- A multi-line `x-enum-descriptions` entry no longer leaks a bare token into the
  enum body (it used to produce invalid TypeScript); line breaks become spaces.
- With `pathParamsAsTypes`, a URL containing a backtick or `${` no longer breaks
  out of the generated template literal type.

**Breaking changes**

- `openapiTS()` now resolves to a `string` (the generated file body, without the
  comment header) instead of an array of AST nodes. The body ends with a newline.
- The transform hooks exchange plain strings instead of AST nodes:
  - `transform` returns `string | { schema: string; questionToken: boolean }`
  - `postTransform` receives and returns `string`
  - `transformProperty` receives and returns `{ name, optional, type, comment?, indent }`;
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
