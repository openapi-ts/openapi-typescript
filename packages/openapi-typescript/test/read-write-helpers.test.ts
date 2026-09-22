import { resolve } from "node:path";
import ts from "typescript";
import { expect, test } from "vitest";
import openapiTS, { astToString } from "../src/index.js";
import type { OpenAPI3 } from "../src/types.js";

const schema: OpenAPI3 = {
  openapi: "3.1.0",
  info: { title: "Read/write helper test", version: "1.0.0" },
  components: {
    schemas: {
      Envelope: {
        type: "object",
        required: ["id", "secret", "nested"],
        properties: {
          id: { type: "string", readOnly: true },
          secret: { type: "string", writeOnly: true },
          nested: {
            type: "object",
            required: ["visible", "readOnlyValue", "writeOnlyValue"],
            properties: {
              visible: { type: "boolean" },
              readOnlyValue: { type: "number", readOnly: true },
              writeOnlyValue: { type: "number", writeOnly: true },
            },
          },
        },
      },
      Envelopes: {
        type: "array",
        items: { $ref: "#/components/schemas/Envelope" },
      },
      Pair: {
        type: "array",
        prefixItems: [{ $ref: "#/components/schemas/Envelope" }, { type: "string" }],
      },
    },
  },
};

function getDiagnostics(source: string): readonly ts.Diagnostic[] {
  const fileName = resolve("generated-read-write-helpers.ts");
  const options: ts.CompilerOptions = {
    lib: ["lib.esnext.d.ts"],
    module: ts.ModuleKind.ESNext,
    noEmit: true,
    skipLibCheck: false,
    strict: true,
    target: ts.ScriptTarget.ESNext,
    types: [],
  };
  const sourceFile = ts.createSourceFile(fileName, source, options.target ?? ts.ScriptTarget.ESNext, true);
  const host = ts.createCompilerHost(options);
  const getSourceFile = host.getSourceFile.bind(host);

  host.getSourceFile = (requestedFileName, languageVersion, onError, shouldCreateNewSourceFile) =>
    resolve(requestedFileName) === fileName
      ? sourceFile
      : getSourceFile(requestedFileName, languageVersion, onError, shouldCreateNewSourceFile);

  return ts.getPreEmitDiagnostics(ts.createProgram([fileName], options, host));
}

function formatDiagnostics(diagnostics: readonly ts.Diagnostic[]): string {
  return ts.formatDiagnostics(diagnostics, {
    getCanonicalFileName: (fileName) => fileName,
    getCurrentDirectory: () => process.cwd(),
    getNewLine: () => "\n",
  });
}

test("generated read/write helpers do not reserve an additional root type name", async () => {
  const generated = astToString(
    await openapiTS(
      {
        openapi: "3.1.0",
        info: { title: "Root type collision", version: "1.0.0" },
        components: { schemas: { ReadonlyArrayData: { type: "string" } } },
      },
      { readWriteMarkers: true, rootTypes: true, rootTypesNoSchemaPrefix: true },
    ),
  );

  const assertions = `
const value: ReadonlyArrayData = "value";
// @ts-expect-error the root type must retain the schema's constraints
const invalid: ReadonlyArrayData = 123;
`;
  expect(formatDiagnostics(getDiagnostics(`${generated}\n${assertions}`))).toBe("");
});

test.each([
  false,
  true,
])(`generated read/write helpers preserve callables and collections with immutable: %s (TypeScript ${ts.version})`, async (immutable) => {
  const generated = astToString(await openapiTS(schema, { readWriteMarkers: true, immutable }));

  expect(generated).toContain("export type Readable<T>");
  expect(generated).toContain("export type Writable<T>");

  const readonlyError = immutable ? "// @ts-expect-error immutable collections and properties cannot be mutated" : "";
  const tupleChecks = immutable
    ? `
const responseLength: 2 = responsePair.length;
const requestLength: 2 = requestPair.length;
responsePair[0].id.toUpperCase();
requestPair[0].secret.toUpperCase();
responsePair[1].toUpperCase();
requestPair[1].toUpperCase();
// @ts-expect-error readonly tuples retain fixed positions
const swappedResponsePair: Readable<Pair> = ["response", responseValue];
// @ts-expect-error readonly tuples retain fixed positions
const swappedRequestPair: Writable<Pair> = ["request", requestValue];
// @ts-expect-error readonly tuples retain literal length
const shortResponsePair: Readable<Pair> = [responseValue];
// @ts-expect-error readonly tuples retain literal length
const longRequestPair: Writable<Pair> = [requestValue, "request", "extra"];
`
    : `
// Mutable tuples retain the existing element-union array projection.
const responseElements: (Readable<Envelope> | string)[] = responsePair;
const requestElements: (Writable<Envelope> | string)[] = requestPair;
const legacyResponsePair: Readable<Pair> = ["response", responseValue, responseValue];
const legacyRequestPair: Writable<Pair> = ["request", requestValue, requestValue];
`;
  const assertions = `
type Envelope = components["schemas"]["Envelope"];
type Envelopes = components["schemas"]["Envelopes"];
type Pair = components["schemas"]["Pair"];

const responseValue: Readable<Envelope> = {
  id: "response-id",
  nested: { visible: true, readOnlyValue: 1 },
};
const requestValue: Writable<Envelope> = {
  secret: "request-secret",
  nested: { visible: true, writeOnlyValue: 1 },
};

declare const response: Readable<Envelope>;
response.id.toUpperCase();
response.nested.visible.valueOf();
response.nested.readOnlyValue.toFixed();
// @ts-expect-error write-only properties are excluded from responses
response.secret;
// @ts-expect-error nested write-only properties are excluded from responses
response.nested.writeOnlyValue;

declare const request: Writable<Envelope>;
request.secret.toUpperCase();
request.nested.visible.valueOf();
request.nested.writeOnlyValue.toFixed();
// @ts-expect-error read-only properties are forbidden in requests
request.id.toUpperCase();
// @ts-expect-error nested read-only properties are forbidden in requests
request.nested.readOnlyValue.toFixed();

const responses: Readable<Envelopes> = [responseValue];
const requests: Writable<Envelopes> = [requestValue];
const responseCopy: Readable<Envelope>[] = Array.from(responses);
const requestCopy: Writable<Envelope>[] = Array.from(requests);

// Interfaces and intersections must expose the same resolved elements through methods and indices.
interface ArrayInterface extends Array<Envelope> {}
interface ReadonlyArrayInterface extends ReadonlyArray<Envelope> {}
type AugmentedArray = Envelope[] & { readonly brand?: string };
type AugmentedReadonlyArray = readonly Envelope[] & { readonly brand?: string };
const responseCollections: {
  arrayInterface: Readable<ArrayInterface>;
  readonlyInterface: Readable<ReadonlyArrayInterface>;
  augmentedArray: Readable<AugmentedArray>;
  augmentedReadonlyArray: Readable<AugmentedReadonlyArray>;
} = {
  arrayInterface: [responseValue],
  readonlyInterface: [responseValue],
  augmentedArray: [responseValue],
  augmentedReadonlyArray: [responseValue],
};
const requestCollections: {
  arrayInterface: Writable<ArrayInterface>;
  readonlyInterface: Writable<ReadonlyArrayInterface>;
  augmentedArray: Writable<AugmentedArray>;
  augmentedReadonlyArray: Writable<AugmentedReadonlyArray>;
} = {
  arrayInterface: [requestValue],
  readonlyInterface: [requestValue],
  augmentedArray: [requestValue],
  augmentedReadonlyArray: [requestValue],
};
requestCollections.arrayInterface.push(requestValue);
requestCollections.augmentedArray.push(requestValue);
// @ts-expect-error array subtype methods must reject read-only properties
requestCollections.arrayInterface.push({ ...requestValue, id: "forbidden" });
// @ts-expect-error augmented array methods must reject read-only properties
requestCollections.augmentedArray.push({ ...requestValue, id: "forbidden" });
for (const entries of Object.values(responseCollections)) {
  const indexed: string = entries[0].id;
  const mapped: string[] = entries.map((entry) => entry.id);
  const copy: Readable<Envelope>[] = Array.from(entries);
}
for (const entries of Object.values(requestCollections)) {
  const indexed: string = entries[0].secret;
  const mapped: string[] = entries.map((entry) => entry.secret);
  const copy: Writable<Envelope>[] = Array.from(entries);
}
responses.map((entry) => {
  entry.id.toUpperCase();
  entry.nested.readOnlyValue.toFixed();
  // @ts-expect-error callbacks must not expose write-only properties
  entry.secret;
  // @ts-expect-error callbacks must not expose nested write-only properties
  entry.nested.writeOnlyValue;
});
requests.map((entry) => {
  entry.secret.toUpperCase();
  entry.nested.writeOnlyValue.toFixed();
  // @ts-expect-error callbacks must forbid read-only properties
  entry.id.toUpperCase();
  // @ts-expect-error callbacks must forbid nested read-only properties
  entry.nested.readOnlyValue.toFixed();
});
for (const entry of responses) {
  entry.id.toUpperCase();
  // @ts-expect-error iterators must not expose write-only properties
  entry.secret;
}
for (const entry of requests.values()) {
  entry.secret.toUpperCase();
  // @ts-expect-error iterators must forbid read-only properties
  entry.id.toUpperCase();
}
${readonlyError}
responses.push(responseValue);
${readonlyError}
requests.push(requestValue);
${readonlyError}
responses[0] = responseValue;
${readonlyError}
requests[0] = requestValue;
${readonlyError}
responses[0].nested.readOnlyValue = 2;
${readonlyError}
requests[0].nested.writeOnlyValue = 2;
${readonlyError}
const mutableResponses: Readable<Envelope>[] = responses;
${readonlyError}
const mutableRequests: Writable<Envelope>[] = requests;

const responsePair: Readable<Pair> = [responseValue, "response"];
const requestPair: Writable<Pair> = [requestValue, "request"];
${tupleChecks}
${readonlyError}
responsePair[1] = "updated";
${readonlyError}
requestPair[1] = "updated";
${readonlyError}
const mutableResponsePair: (Readable<Envelope> | string)[] = responsePair;
${readonlyError}
const mutableRequestPair: (Writable<Envelope> | string)[] = requestPair;

type GenericHandler = <T extends string | number>(value: T) => { value: T };
type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends (<T>() => T extends B ? 1 : 2) ? true : false;
type Assert<T extends true> = T;
type ReadableAny = Assert<Equal<Readable<any>, any>>;
type WritableAny = Assert<Equal<Writable<any>, any>>;
type ReadableUnknown = Assert<Equal<Readable<unknown>, unknown>>;
type WritableUnknown = Assert<Equal<Writable<unknown>, unknown>>;
function readableGeneric<T extends readonly $Read<string>[]>(value: Readable<T>) {
  const first: string = value[0];
  // @ts-expect-error constrained generics resolve markers without widening to any
  const _invalid: number = value[0];
  return first;
}
function writableGeneric<T extends readonly $Write<string>[]>(value: Writable<T>) {
  const first: string = value[0];
  // @ts-expect-error constrained generics resolve markers without widening to any
  const _invalid: number = value[0];
  return first;
}
function readableGenericObject<T extends { name: $Read<string> }>(value: Readable<T>) {
  const name: string = value.name;
  // @ts-expect-error object constraints resolve markers without widening to any
  const _invalid: number = value.name;
  return name;
}
function writableGenericObject<T extends { name: $Write<string> }>(value: Writable<T>) {
  const name: string = value.name;
  // @ts-expect-error object constraints resolve markers without widening to any
  const _invalid: number = value.name;
  return name;
}
type ReadableNonEmptyArray = readonly $Read<string>[] & { readonly 0: $Read<"first"> };
type WritableNonEmptyArray = readonly $Write<string>[] & { readonly 0: $Write<"first"> };
type ReadableNumericProperty = Assert<Equal<Readable<ReadableNonEmptyArray>[0], "first">>;
type WritableNumericProperty = Assert<Equal<Writable<WritableNonEmptyArray>[0], "first">>;
const readableNonEmptyArray: Readable<ReadableNonEmptyArray> = ["first"];
const writableNonEmptyArray: Writable<WritableNonEmptyArray> = ["first"];
// @ts-expect-error required numeric properties must not disappear with the broad array index
const readableEmptyArray: Readable<ReadableNonEmptyArray> = [];
// @ts-expect-error required numeric properties must not disappear with the broad array index
const writableEmptyArray: Writable<WritableNonEmptyArray> = [];
// @ts-expect-error narrowed numeric properties must retain their value constraints
const readableWrongFirst: Readable<ReadableNonEmptyArray> = ["other"];
// @ts-expect-error narrowed numeric properties must retain their value constraints
const writableWrongFirst: Writable<WritableNonEmptyArray> = ["other"];
type JsonValue = null | string | number | boolean | JsonValue[] | { [key: string]: JsonValue };
type NestedArray = (string | NestedArray)[];
const readableJson: Readable<JsonValue> = ["one", { two: [2] }];
const writableJson: Writable<JsonValue> = ["one", { two: [2] }];
const readableNestedArray: Readable<NestedArray> = ["one", ["two"]];
const writableNestedArray: Writable<NestedArray> = ["one", ["two"]];
type RecursiveTuple = [string | RecursiveTuple];
type RecursiveOptionalTuple = [string, RecursiveOptionalTuple?];
type RecursiveRestTuple = [string, ...RecursiveRestTuple[]];
type RecursiveReadonlyTuple = readonly [string | RecursiveReadonlyTuple];
type RecursiveReadonlyOptionalTuple = readonly [string, RecursiveReadonlyOptionalTuple?];
type RecursiveReadonlyRestTuple = readonly [string, ...RecursiveReadonlyRestTuple[]];
const readableRecursiveTuple: Readable<RecursiveTuple> = [[["leaf"]]];
const writableRecursiveTuple: Writable<RecursiveTuple> = [[["leaf"]]];
const readableRecursiveOptional: Readable<RecursiveOptionalTuple> = ["a", ["b"]];
const writableRecursiveOptional: Writable<RecursiveOptionalTuple> = ["a", ["b"]];
const readableRecursiveRest: Readable<RecursiveRestTuple> = ["a", ["b"]];
const writableRecursiveRest: Writable<RecursiveRestTuple> = ["a", ["b"]];
const readableRecursiveReadonlyTuple: Readable<RecursiveReadonlyTuple> = [[["leaf"]]];
const writableRecursiveReadonlyTuple: Writable<RecursiveReadonlyTuple> = [[["leaf"]]];
const readableRecursiveReadonlyOptional: Readable<RecursiveReadonlyOptionalTuple> = ["a", ["b"]];
const writableRecursiveReadonlyOptional: Writable<RecursiveReadonlyOptionalTuple> = ["a", ["b"]];
const readableRecursiveReadonlyRest: Readable<RecursiveReadonlyRestTuple> = ["a", ["b"]];
const writableRecursiveReadonlyRest: Writable<RecursiveReadonlyRestTuple> = ["a", ["b"]];
// @ts-expect-error recursive mutable tuples still reject invalid leaves
const invalidReadableRecursiveTuple: Readable<RecursiveTuple> = [[123]];
// @ts-expect-error recursive readonly tuples still reject invalid leaves
const invalidWritableRecursiveTuple: Writable<RecursiveReadonlyTuple> = [[true]];
// @ts-expect-error excluded elements are never, consistently with mutable arrays
const excludedReadonlyElement: Writable<readonly [$Read<string>]> = [undefined];

type MarkedReadonlyArray = readonly Envelope[] & { id: $Read<number>; secret: $Write<string> };
declare const readableArrayMetadata: Readable<MarkedReadonlyArray>;
declare const writableArrayMetadata: Writable<MarkedReadonlyArray>;
readableArrayMetadata.id.toFixed();
writableArrayMetadata.secret.toUpperCase();
// @ts-expect-error write-only array metadata is excluded from responses
readableArrayMetadata.secret;
// @ts-expect-error read-only array metadata is forbidden in requests
writableArrayMetadata.id.toFixed();
type ReadableHandlerIsExact = Assert<Equal<Readable<GenericHandler>, GenericHandler>>;
type WritableHandlerIsExact = Assert<Equal<Writable<GenericHandler>, GenericHandler>>;
type Domain = {
  createdAt: Date;
  pattern: RegExp;
  handler: GenericHandler;
  nested: {
    readDate: $Read<Date>;
    writePattern: $Write<RegExp>;
    handlers: GenericHandler[];
  };
};

declare const readableDomain: Readable<Domain>;
readableDomain.createdAt.toISOString();
readableDomain.pattern.test("value");
const readableLiteral: "value" = readableDomain.handler("value").value;
// @ts-expect-error generic callables retain their parameter constraints
readableDomain.handler(true);
// @ts-expect-error generic callables retain their return types
const wrongReadableResult: number = readableDomain.handler("value").value;
// @ts-expect-error Date methods retain their parameter lists
readableDomain.createdAt.toISOString(1);
// @ts-expect-error Date methods retain their return types
const wrongReadableDate: number = readableDomain.createdAt.toISOString();
// @ts-expect-error RegExp methods retain their parameter types
readableDomain.pattern.test(1);
readableDomain.nested.readDate.getTime();
readableDomain.nested.handlers[0](1).value.toFixed();
// @ts-expect-error nested write markers are still filtered
readableDomain.nested.writePattern;

declare const writableDomain: Writable<Domain>;
writableDomain.createdAt.toISOString();
writableDomain.pattern.exec("value");
const writableLiteral: 42 = writableDomain.handler(42).value;
// @ts-expect-error generic callables retain their parameter constraints
writableDomain.handler(true);
// @ts-expect-error generic callables retain their return types
const wrongWritableResult: string = writableDomain.handler(42).value;
// @ts-expect-error Date methods retain their parameter lists
writableDomain.createdAt.toISOString(1);
// @ts-expect-error Date methods retain their return types
const wrongWritableDate: number = writableDomain.createdAt.toISOString();
// @ts-expect-error RegExp methods retain their parameter types
writableDomain.pattern.exec(1);
writableDomain.nested.writePattern.test("value");
writableDomain.nested.handlers[0](1).value.toFixed();
// @ts-expect-error nested read markers are still forbidden
writableDomain.nested.readDate.getTime();

type AugmentedDate = Date & {
  responseId: $Read<number>;
  requestSecret: $Write<string>;
};

declare const readableDate: Readable<AugmentedDate>;
readableDate.toISOString();
readableDate.responseId.toFixed();
// @ts-expect-error an augmented Date's write marker must not bypass filtering
readableDate.requestSecret;

declare const writableDate: Writable<AugmentedDate>;
writableDate.toISOString();
writableDate.requestSecret.toUpperCase();
// @ts-expect-error an augmented Date's read marker must not bypass filtering
writableDate.responseId.toFixed();

// Callables are opaque leaves, including any properties attached to them.
type OpaqueHandler = GenericHandler & { responseId: $Read<number>; requestSecret: $Write<string> };
type ReadableCallableIsExact = Assert<Equal<Readable<OpaqueHandler>, OpaqueHandler>>;
type WritableCallableIsExact = Assert<Equal<Writable<OpaqueHandler>, OpaqueHandler>>;
declare const readableCallable: Readable<OpaqueHandler>;
declare const writableCallable: Writable<OpaqueHandler>;
readableCallable.responseId.$read.toFixed();
readableCallable.requestSecret.$write.toUpperCase();
writableCallable.responseId.$read.toFixed();
writableCallable.requestSecret.$write.toUpperCase();
`;

  expect(formatDiagnostics(getDiagnostics(`${generated}\n${assertions}`))).toBe("");
});
