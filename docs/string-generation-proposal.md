# Draft string generation API proposal

This document proposes a major-version contract for generating TypeScript source without a runtime TypeScript compiler. It is a design draft for the author's review, not an implementation or an approved upstream plan. It responds to [the raw-string suggestion on #2867](https://github.com/openapi-ts/openapi-typescript/pull/2867#issuecomment-5605768762) and the [TypeScript 7 failure in #2841](https://github.com/openapi-ts/openapi-typescript/issues/2841).

The existing generator returns TypeScript AST nodes and exposes three AST customization hooks. Complete compiler removal therefore requires new contracts for both generation and customization. Merely removing a dependency or changing the final printer cannot preserve those contracts.

## Proposed contract

`openapiTS(source, options)` returns `Promise<string>` containing a complete TypeScript source file with a trailing newline. The CLI continues to prepend its existing generated-file header. The Node API does not add that header, preserving the current separation between generation and the CLI.

Keep the existing schema input, validation, options, traversal order, and callback metadata. Replace only the compiler-dependent contracts:

```ts
interface TransformObject {
  schema: string;
  questionToken: boolean;
}

interface GeneratedProperty {
  name: string;
  type: string;
  optional: boolean;
  readonly: boolean;
  comments: string[];
}

interface StringGenerationHooks {
  transform?: (
    schemaObject: SchemaObject,
    options: TransformNodeOptions,
  ) => string | TransformObject | undefined;
  postTransform?: (
    type: string,
    options: TransformNodeOptions,
  ) => string | undefined;
  transformProperty?: (
    property: GeneratedProperty,
    schemaObject: SchemaObject,
    options: TransformNodeOptions,
  ) => GeneratedProperty | undefined;
}
```

These are proposed signature fragments, not declarations exported by the current package. `SchemaObject` and callback metadata retain their schema meanings; compiler-dependent fields in `GlobalContext` must also migrate or become internal in the major release.

`undefined` keeps the generated result. A type override must be a nonempty TypeScript type expression; an empty or whitespace-only override produces a descriptive error. The generator does not parse or typecheck arbitrary overrides at runtime. Callers must compile their generated files to validate custom expressions.

`transformProperty` receives a fresh property value after the type and existing schema comments are generated. `name` is an unescaped property name; the emitter quotes it when necessary. `comments` contains comment contents without delimiters; the emitter escapes closing comment delimiters and applies indentation. Return a replacement property to modify it, or `undefined` to keep it. Preserve the current callback locations and order rather than adding new invocations during this migration.

`inject` remains a source string and is included verbatim before generated declarations. It is no longer parsed or reformatted. This is an intentional behavior change and must be documented with the major release.

## Public exports and migration

Remove `astToString`, `stringToAST`, `AstToStringOptions`, AST construction helpers, AST constants, and compiler exports from the public surface. This is an explicit major-version break. Do not offer identity functions named as AST parsers or printers.

Before implementing, inventory every export from `src/index.ts`, including the low-level transformers, utility functions, and context types. Preserve schema-only utilities where practical. Compiler-dependent transformer exports need documented string return values or explicit removal; silently keeping their names with incompatible undocumented behavior is insufficient.

The usual Node API migration becomes:

```ts
// Before
const ast = await openapiTS(schema);
const source = astToString(ast);

// After
const source = await openapiTS(schema);
```

A custom date type becomes:

```ts
const source = await openapiTS(schema, {
  transform(schemaObject) {
    if (schemaObject.format === "date-time") {
      return schemaObject.nullable ? "Date | null" : "Date";
    }
  },
});
```

A property customization becomes:

```ts
transformProperty(property, schemaObject) {
  if (schemaObject.format === "date-time") {
    return { ...property, comments: [...property.comments, "Stored as an ISO date"] };
  }
}
```

AST consumers doing additional compiler transformations must explicitly parse the returned source using their own compiler. The generator will not bundle an AST compatibility adapter.

## Implementation boundaries

Use direct source templates and small emitter helpers for indentation, literals, property names, comments, and parenthesization. Preserve schema transformation decisions, especially union/intersection precedence, indexed access, arrays, discriminators, enum naming and caching, required properties, and read/write markers. Do not implement a substitute TypeScript factory API or retain a hidden compiler through an adapter.

Keep TypeScript as a development dependency for building this TypeScript repository and compiling regression fixtures. Remove it from the generator's runtime and peer dependencies and emitted declarations. Inspect the packed dependency graph for transitive compiler requirements before claiming compiler-free installation. This interpretation of compiler removal needs upstream agreement.

Generated formatting may change, but type semantics, declaration ordering, and comments must remain equivalent. Do not accept wholesale snapshot changes without a comparison that independently checks those properties. Measure packed install size separately from browser bundle size; no size reduction is claimed by this proposal.

## Regression and release gates

1. Add failing tests for the string return contract and all three replacement hooks before implementation. Cover `undefined`, nullable overrides, optionality, readonly properties, comments, and invalid empty overrides.
2. Reuse existing schema and CLI regressions. Add hostile property names, quotes, backticks, template interpolation text, multiline comments and enum descriptions, Unicode, negative numbers, and nested type precedence cases. Verify injected source is preserved verbatim.
3. Compare old and new output on representative existing fixtures using a development-only compiler. Compile new output with strict checks and positive/negative consumer assertions; formatting-only snapshots do not prove semantic equivalence.
4. Build and pack the package. Test CLI, ESM, CommonJS, declarations, and custom hooks in clean consumers without an application compiler and with TypeScript 5 and 7. Assert TypeScript is absent from production dependencies and runtime imports, including declarations and transitive installation requirements.
5. Run repository lint and typechecking, build, full tests, example typechecks, export checks, documentation build, and browser E2E. Match the supported Node 22/24 and platform CI coverage; distinguish baseline failures from regressions.
6. Publish a separate draft implementation PR with a major changeset, complete migration documentation, measured size results, and exact-head CI evidence. Leave #2867 and its branch unchanged.

## Decisions before implementation

The proposed structured property hook, treatment of low-level exports and callback context, verbatim injection, and development-only compiler exception need review before a broad rewrite. GitHub identifies the author of the suggestion as `mrlubos` with `author_association: NONE`; that metadata does not establish maintainer authority. No upstream approval of this replacement API has been verified.

This design draft changes no package behavior, fixes no runtime failure, and does not remove TypeScript. Its purpose is to make the compatibility choices reviewable before implementation work begins.
