import { createConfig } from "@redocly/openapi-core";
import ts from "typescript";
import { resolveRef } from "../src/lib/utils.js";
import type { GlobalContext, TransformNodeOptions } from "../src/types.js";

/** Default options for all transform* functions */
export const DEFAULT_CTX: GlobalContext = {
  additionalProperties: false,
  alphabetize: false,
  arrayLength: false,
  defaultNonNullable: true,
  discriminators: {
    objects: {},
    refsHandled: [],
  },
  emptyObjectsUnknown: false,
  enum: false,
  enumValues: false,
  conditionalEnums: false,
  dedupeEnums: false,
  excludeDeprecated: false,
  exportType: false,
  immutable: false,
  injectFooter: [],
  pathParamsAsTypes: false,
  postTransform: undefined,
  propertiesRequiredByDefault: false,
  rootTypes: false,
  rootTypesNoSchemaPrefix: false,
  rootTypesKeepCasing: false,
  redoc: await createConfig({}, { extends: ["minimal"] }),
  resolve($ref) {
    return resolveRef({}, $ref, { silent: false });
  },
  silent: true,
  transform: undefined,
  transformProperty: undefined,
  makePathsEnum: false,
  generatePathParams: false,
  readWriteMarkers: false,
};

/** Generic test case */
export type TestCase<T = any, O = TransformNodeOptions> = [
  string,
  {
    /**
     * The OpenAPI schema.  * Typing as `any` is good because it lets us test
     * any invalid or unexpected formats without fighting with TypeScript.
     */
    given: T;
    /**
     * The expected TypeScript output. Be mindful of indentation and
     * parentheses!
     */
    want: string | URL;
    /**
     * Transform options.
     */
    options?: O;
    /**
     * Options for Vitest
     */
    ci?: { timeout?: number; skipIf?: boolean };
  },
];

/** Compile generated TypeScript with the package's strict semantic expectations. */
export function expectTypeScriptToCompile(source: string, extraSource = "") {
  const fileName = "/generated.test.ts";
  const contents = `${source}\n${extraSource}`;
  const compilerOptions: ts.CompilerOptions = {
    exactOptionalPropertyTypes: true,
    module: ts.ModuleKind.ESNext,
    moduleResolution: ts.ModuleResolutionKind.Bundler,
    noEmit: true,
    skipLibCheck: true,
    strict: true,
    target: ts.ScriptTarget.ESNext,
  };
  const host = ts.createCompilerHost(compilerOptions);
  const sourceFile = ts.createSourceFile(fileName, contents, ts.ScriptTarget.ESNext, true);
  const getSourceFile = host.getSourceFile.bind(host);
  host.getSourceFile = (name, languageVersion, onError, shouldCreateNewSourceFile) =>
    name === fileName ? sourceFile : getSourceFile(name, languageVersion, onError, shouldCreateNewSourceFile);
  const fileExists = host.fileExists.bind(host);
  host.fileExists = (name) => name === fileName || fileExists(name);
  const readFile = host.readFile.bind(host);
  host.readFile = (name) => (name === fileName ? contents : readFile(name));

  const diagnostics = ts.getPreEmitDiagnostics(ts.createProgram([fileName], compilerOptions, host));
  expect(diagnostics.map((diagnostic) => ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n"))).toEqual([]);
}
