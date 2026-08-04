import ts from "typescript";
import {
  addJSDocComment,
  astToString,
  BOOLEAN,
  NULL,
  NUMBER,
  oapiRef,
  STRING,
  stringToAST,
  tsArrayLiteralExpression,
  tsEnum,
  tsIsPrimitive,
  tsLiteral,
  tsPropertyIndex,
  tsUnion,
  tsWithRequired,
  tsWithRequiredObject,
} from "../../src/lib/ts.js";
import { expectTypeScriptToCompile } from "../test-helpers.js";

describe("addJSDocComment", () => {
  test("single-line comment", () => {
    const property = ts.factory.createPropertySignature(undefined, "comment", undefined, BOOLEAN);
    addJSDocComment({ description: "Single-line comment" }, property);
    expect(astToString(ts.factory.createTypeLiteralNode([property])).trim()).toBe(`{
    /** @description Single-line comment */
    comment: boolean;
}`);
  });

  test("multi-line comment", () => {
    const property = ts.factory.createPropertySignature(undefined, "comment", undefined, BOOLEAN);
    addJSDocComment(
      {
        summary: "This is the summary",
        description: "Multi-line comment\nLine 2",
        deprecated: true,
      },
      property,
    );
    expect(astToString(ts.factory.createTypeLiteralNode([property])).trim()).toBe(`{
    /**
     * This is the summary
     * @deprecated
     * @description Multi-line comment
     *     Line 2
     */
    comment: boolean;
}`);
  });

  test("escapes internal comments", () => {
    const property = ts.factory.createPropertySignature(undefined, "comment", undefined, BOOLEAN);
    addJSDocComment({ title: "This is a comment with `/* an example comment */` within" }, property);
    expect(astToString(ts.factory.createTypeLiteralNode([property])).trim()).toBe(`{
    /** This is a comment with \`/* an example comment *\\/\` within */
    comment: boolean;
}`);
  });

  test("single example", () => {
    const property = ts.factory.createPropertySignature(undefined, "comment", undefined, BOOLEAN);
    addJSDocComment(
      {
        example: "an-example",
      },
      property,
    );
    expect(astToString(ts.factory.createTypeLiteralNode([property])).trim()).toBe(`{
    /** @example an-example */
    comment: boolean;
}`);
  });

  test("array of examples", () => {
    const property = ts.factory.createPropertySignature(undefined, "comment", undefined, BOOLEAN);
    addJSDocComment(
      {
        examples: ["an-example", "another-example"],
      },
      property,
    );
    expect(astToString(ts.factory.createTypeLiteralNode([property])).trim()).toBe(`{
    /**
     * @example an-example
     * @example another-example
     */
    comment: boolean;
}`);
  });

  test("single example and array of examples", () => {
    const property = ts.factory.createPropertySignature(undefined, "comment", undefined, BOOLEAN);
    addJSDocComment(
      {
        example: "old-example",
        examples: ["an-example", "another-example"],
      },
      property,
    );
    expect(astToString(ts.factory.createTypeLiteralNode([property])).trim()).toBe(`{
    /**
     * @example old-example
     * @example an-example
     * @example another-example
     */
    comment: boolean;
}`);
  });

  test("complex examples", () => {
    const property = ts.factory.createPropertySignature(undefined, "comment", undefined, BOOLEAN);
    addJSDocComment(
      {
        examples: [
          {
            foo: "bar",
            results: [1, true, "abc"],
          },
          {
            foo: "bat",
            results: [5, false, "def"],
          },
        ],
      },
      property,
    );
    expect(astToString(ts.factory.createTypeLiteralNode([property])).trim()).toBe(`{
    /**
     * @example {
     *       "foo": "bar",
     *       "results": [
     *         1,
     *         true,
     *         "abc"
     *       ]
     *     }
     * @example {
     *       "foo": "bat",
     *       "results": [
     *         5,
     *         false,
     *         "def"
     *       ]
     *     }
     */
    comment: boolean;
}`);
  });
});

describe("oapiRef", () => {
  test("single part", () => {
    expect(astToString(oapiRef("#/components")).trim()).toBe("components");
  });

  test("multiple parts", () => {
    expect(astToString(oapiRef("#/components/schemas/User")).trim()).toBe(`components["schemas"]["User"]`);
  });

  test("`properties` of component schema `properties`", () => {
    expect(astToString(oapiRef("#/components/schemas/User/properties/username")).trim()).toBe(
      `components["schemas"]["User"]["username"]`,
    );
  });

  test("component schema named `properties`", () => {
    expect(astToString(oapiRef("#/components/schemas/properties")).trim()).toBe(`components["schemas"]["properties"]`);
  });

  test("reference into paths parameters", () => {
    expect(
      astToString(
        oapiRef("#/paths/~1endpoint/get/parameters/0", {
          in: "query",
          name: "boop",
          required: true,
        }),
      ).trim(),
    ).toBe('paths["/endpoint"]["get"]["parameters"]["query"]["boop"]');
  });
});

describe("tsEnum", () => {
  test("string members", () => {
    expect(astToString(tsEnum("-my-color-", ["green", "red", "blue"])).trim()).toBe(`enum MyColor {
    green = "green",
    red = "red",
    blue = "blue"
}`);
  });

  test("with setting: export", () => {
    expect(
      astToString(
        tsEnum("-my-color-", ["green", "red", "blue"], undefined, {
          export: true,
        }),
      ).trim(),
    ).toBe(`export enum MyColor {
    green = "green",
    red = "red",
    blue = "blue"
}`);
  });

  test("name from path", () => {
    expect(
      astToString(tsEnum("#/paths/url/get/parameters/query/status", ["active", "inactive"])).trim(),
    ).toBe(`enum PathsUrlGetParametersQueryStatus {
    active = "active",
    inactive = "inactive"
}`);
  });

  test("string members with numeric prefix", () => {
    expect(astToString(tsEnum("/my/enum/", ["0a", "1b", "2c"])).trim()).toBe(`enum MyEnum {
    Value0a = "0a",
    Value1b = "1b",
    Value2c = "2c"
}`);
  });

  test("number members", () => {
    expect(astToString(tsEnum(".Error.code.", [100, 101, 102, -100])).trim()).toBe(`enum ErrorCode {
    Value100 = 100,
    Value101 = 101,
    Value102 = 102,
    ValueMinus100 = -100
}`);
  });

  test("number members with x-enum-descriptions", () => {
    expect(
      astToString(
        tsEnum(
          ".Error.code.",
          [100, 101, 102],
          [{ description: "Code 100" }, { description: "Code 101" }, { description: "Code 102" }],
        ),
      ).trim(),
    ).toBe(`enum ErrorCode {
    // Code 100
    Value100 = 100,
    // Code 101
    Value101 = 101,
    // Code 102
    Value102 = 102
}`);
  });

  test("x-enum-varnames", () => {
    expect(
      astToString(
        tsEnum(
          ".Error.code.",
          [100, 101, 102],
          [{ name: "Unauthorized" }, { name: "NotFound" }, { name: "PermissionDenied" }],
        ),
      ).trim(),
    ).toBe(`enum ErrorCode {
    Unauthorized = 100,
    NotFound = 101,
    PermissionDenied = 102
}`);
  });

  test("x-enum-varnames with numeric prefix", () => {
    expect(
      astToString(tsEnum(".Error.code.", [100, 101, 102], [{ name: "0a" }, { name: "1b" }, { name: "2c" }])).trim(),
    ).toBe(`enum ErrorCode {
    Value0a = 100,
    Value1b = 101,
    Value2c = 102
}`);
  });

  test("partial x-enum-varnames and x-enum-descriptions", () => {
    expect(
      astToString(
        tsEnum(
          ".Error.code.",
          [100, 101, 102],
          [
            { name: "Unauthorized", description: "User is unauthorized" },
            { name: "NotFound", description: "" },
            { name: "Value102", description: null },
          ],
        ),
      ).trim(),
    ).toBe(`enum ErrorCode {
    // User is unauthorized
    Unauthorized = 100,
    NotFound = 101,
    Value102 = 102
}`);
  });

  test("x-enum-descriptions with x-enum-varnames", () => {
    expect(
      astToString(
        tsEnum(
          ".Error.code.",
          [100, 101, 102],
          [
            { name: "Unauthorized", description: "User is unauthorized" },
            { name: "NotFound", description: "Item not found" },
            {
              name: "PermissionDenied",
              description: "User doesn't have permissions",
            },
          ],
        ),
      ).trim(),
    ).toBe(`enum ErrorCode {
    // User is unauthorized
    Unauthorized = 100,
    // Item not found
    NotFound = 101,
    // User doesn't have permissions
    PermissionDenied = 102
}`);
  });

  test("replace special character", () => {
    expect(astToString(tsEnum("FOO_ENUM", ["Etc/GMT+0", "Etc/GMT+1", "Etc/GMT-1"])).trim()).toBe(`enum FOO_ENUM {
    Etc_GMTPlus0 = "Etc/GMT+0",
    Etc_GMTPlus1 = "Etc/GMT+1",
    Etc_GMT_1 = "Etc/GMT-1"
}`);
  });
});

describe("tsArrayLiteralExpression", () => {
  test("string members", () => {
    expect(
      astToString(
        tsArrayLiteralExpression("-my-color-Values", oapiRef("#/components/schemas/Color"), ["green", "red", "blue"]),
      ).trim(),
    ).toBe(`const myColorValues: components["schemas"]["Color"][] = ["green", "red", "blue"];`);
  });

  test("with setting: export", () => {
    expect(
      astToString(
        tsArrayLiteralExpression("-my-color-Values", oapiRef("#/components/schemas/Color"), ["green", "red", "blue"], {
          export: true,
        }),
      ).trim(),
    ).toBe(`export const myColorValues: components["schemas"]["Color"][] = ["green", "red", "blue"];`);
  });

  test("with setting: readonly", () => {
    expect(
      astToString(
        tsArrayLiteralExpression("-my-color-Values", oapiRef("#/components/schemas/Color"), ["green", "red", "blue"], {
          readonly: true,
        }),
      ).trim(),
    ).toBe(`const myColorValues: ReadonlyArray<components["schemas"]["Color"]> = ["green", "red", "blue"];`);
  });

  test("name from path", () => {
    expect(
      astToString(
        tsArrayLiteralExpression(
          "#/paths/url/get/parameters/query/status/Values",
          oapiRef("#/components/schemas/Status"),
          ["active", "inactive"],
        ),
      ).trim(),
    ).toBe(`const pathsUrlGetParametersQueryStatusValues: components["schemas"]["Status"][] = ["active", "inactive"];`);
  });

  test("number members", () => {
    expect(
      astToString(
        tsArrayLiteralExpression(
          ".Error.code.Values",
          oapiRef("#/components/schemas/ErrorCode"),
          [100, 101, 102, -100],
        ),
      ).trim(),
    ).toBe(`const errorCodeValues: components["schemas"]["ErrorCode"][] = [100, 101, 102, -100];`);
  });
});

describe("tsPropertyIndex", () => {
  test("numbers -> number literals", () => {
    expect(astToString(tsPropertyIndex(200)).trim()).toBe("200");
    expect(astToString(tsPropertyIndex(200.5)).trim()).toBe("200.5");
    expect(astToString(tsPropertyIndex(Number.POSITIVE_INFINITY)).trim()).toBe("Infinity");
    expect(astToString(tsPropertyIndex(Number.NaN)).trim()).toBe("NaN");
    expect(astToString(tsPropertyIndex(10e3)).trim()).toBe("10000");
  });

  test("valid strings -> identifiers", () => {
    expect(astToString(tsPropertyIndex("identifier")).trim()).toBe("identifier");
    expect(astToString(tsPropertyIndex("snake_case")).trim()).toBe("snake_case");
    expect(astToString(tsPropertyIndex(200)).trim()).toBe("200");
    expect(astToString(tsPropertyIndex("$id")).trim()).toBe("$id");
    expect(astToString(tsPropertyIndex("10e3")).trim()).toBe(`"10e3"`);
  });

  test("invalid strings -> string literals", () => {
    expect(astToString(tsPropertyIndex("kebab-case")).trim()).toBe(`"kebab-case"`);
    expect(astToString(tsPropertyIndex("application/json")).trim()).toBe(`"application/json"`);
    expect(astToString(tsPropertyIndex("0invalid")).trim()).toBe(`"0invalid"`);
    expect(astToString(tsPropertyIndex("inv@lid")).trim()).toBe(`"inv@lid"`);
    expect(astToString(tsPropertyIndex("in.valid")).trim()).toBe(`"in.valid"`);
    expect(astToString(tsPropertyIndex(-1)).trim()).toBe(`"-1"`);
    expect(astToString(tsPropertyIndex("-1")).trim()).toBe(`"-1"`);
  });
});

describe("tsIsPrimitive", () => {
  test("null", () => {
    expect(tsIsPrimitive(NULL)).toBe(true);
  });

  test("number", () => {
    expect(tsIsPrimitive(NUMBER)).toBe(true);
  });

  test("string", () => {
    expect(tsIsPrimitive(STRING)).toBe(true);
  });

  test("boolean", () => {
    expect(tsIsPrimitive(BOOLEAN)).toBe(true);
  });

  test("array", () => {
    expect(tsIsPrimitive(ts.factory.createArrayTypeNode(STRING))).toBe(false);
  });

  test("object", () => {
    expect(
      tsIsPrimitive(
        ts.factory.createTypeLiteralNode([ts.factory.createPropertySignature(undefined, "foo", undefined, STRING)]),
      ),
    ).toBe(false);
  });
});

describe("tsUnion", () => {
  test("none", () => {
    expect(astToString(tsUnion([])).trim()).toBe("never");
  });

  test("one", () => {
    expect(astToString(tsUnion([STRING])).trim()).toBe("string");
  });

  test("multiple (primitive)", () => {
    expect(astToString(tsUnion([STRING, STRING, NUMBER, NULL, NUMBER, NULL])).trim()).toBe("string | number | null");
  });

  test("multiple (const)", () => {
    expect(astToString(tsUnion([NULL, tsLiteral("red"), tsLiteral(42), tsLiteral(false)])).trim()).toBe(
      `null | "red" | 42 | false`,
    );
  });

  test("multiple (object types)", () => {
    const obj = ts.factory.createTypeLiteralNode([
      ts.factory.createPropertySignature(undefined, "foo", undefined, STRING),
    ]);
    expect(astToString(tsUnion([obj, obj, NULL])).trim()).toBe(`{
    foo: string;
} | {
    foo: string;
} | null`);
  });
});

describe("tsWithRequired", () => {
  test("injects the legacy helper once and preserves valid low-level inputs", () => {
    const footer: ts.Node[] = [];
    const source = ts.factory.createTypeReferenceNode("Source");
    expect(astToString(tsWithRequired(source, ["value"], footer)).trim()).toBe('WithRequired<Source, "value">');
    expect(astToString(tsWithRequired(source, ["other"], footer)).trim()).toBe('WithRequired<Source, "other">');
    expect(footer).toHaveLength(1);
    const helper = astToString(footer).trim();

    expect(helper).toBe(`type WithRequired<T, K extends keyof T> = T & {
    [P in K]-?: T[P];
};`);
    expectTypeScriptToCompile(`
      ${helper}

      type Optional = WithRequired<{ value?: string }, "value">;
      const optional: Optional = { value: "value" };
      // @ts-expect-error implicit optional undefined is removed
      const optionalUndefined: Optional = { value: undefined };

      type ExplicitUndefined = WithRequired<{ value?: string | undefined }, "value">;
      const explicitUndefined: ExplicitUndefined = { value: undefined };

      type ReadonlyValue = WithRequired<{ readonly value?: string }, "value">;
      const readonlyValue: ReadonlyValue = { value: "value" };
      // @ts-expect-error readonly is preserved
      readonlyValue.value = "other";

      type Intersection = WithRequired<{ value?: string } & { other: number }, "value">;
      const intersection: Intersection = { other: 1, value: "value" };

      type StringIndex = WithRequired<{ [key: string]: number | undefined }, "value">;
      const stringIndex: StringIndex = { value: 1 };

      type ArrayValue = WithRequired<string[], "length">;
      const arrayValue: ArrayValue = [];
    `);
  });
});

describe("tsWithRequiredObject", () => {
  test("injects the object helper once and keeps named references", () => {
    const footer: ts.Node[] = [];
    const source = ts.factory.createTypeReferenceNode("Source");

    expect(astToString(tsWithRequiredObject(source, ["value"], footer)).trim()).toBe(
      'WithRequiredObject<Source, "value">',
    );
    expect(astToString(tsWithRequiredObject(source, ["other"], footer)).trim()).toBe(
      'WithRequiredObject<Source, "other">',
    );
    expect(footer).toHaveLength(1);
  });

  test("preserves object semantics", () => {
    const footer: ts.Node[] = [];
    tsWithRequiredObject(ts.factory.createTypeReferenceNode("Source"), ["value"], footer);

    expectTypeScriptToCompile(`
      ${astToString(footer)}
      type Optional = WithRequiredObject<{ value?: string }, "value">;
      type ExplicitUndefined = WithRequiredObject<{ value?: string | undefined }, "value">;
      type Missing = WithRequiredObject<{ other: number }, "value">;
      type Union = WithRequiredObject<{ value?: string } | { other: number }, "value">;
      type Index = WithRequiredObject<{ [key: string]: number | undefined }, "value">;
      type ReadonlyValue = WithRequiredObject<{ readonly value?: string }, "value">;
      type NumberIndex = WithRequiredObject<{ [key: number]: string | undefined }, 1>;
      declare const symbolKey: unique symbol;
      type SymbolIndex = WithRequiredObject<{ [key: symbol]: boolean | undefined }, typeof symbolKey>;
      type Primitive = WithRequiredObject<string, "value">;
      type ArrayValue = WithRequiredObject<string[], "value">;
      type Callable = WithRequiredObject<() => string, "value">;
      type Constructor = WithRequiredObject<abstract new () => object, "value">;
      type Nothing = WithRequiredObject<never, "value">;
      type UnknownValue = WithRequiredObject<unknown, "value">;
      type AnyValue = WithRequiredObject<any, "value">;

      const optional: Optional = { value: "value" };
      // @ts-expect-error implicit optional undefined is removed
      const optionalUndefined: Optional = { value: undefined };
      const explicitUndefined: ExplicitUndefined = { value: undefined };
      const missing: Missing = { other: 1, value: true };
      // @ts-expect-error missing keys remain required
      const missingInvalid: Missing = { other: 1 };
      const union: Union = { other: 1, value: true };
      // @ts-expect-error every union branch requires value
      const unionInvalid: Union = { other: 1 };
      const index: Index = { value: 1 };
      const readonlyValue: ReadonlyValue = { value: "value" };
      // @ts-expect-error readonly is preserved
      readonlyValue.value = "other";
      const numberIndex: NumberIndex = { 1: "value" };
      const symbolIndex: SymbolIndex = { [symbolKey]: true };
      const unknownValue: UnknownValue = { value: true };
      const anyValue: AnyValue = { value: true };
      // @ts-expect-error unknown still requires value
      const unknownInvalid: UnknownValue = {};
      // @ts-expect-error any does not erase required presence
      const anyInvalid: AnyValue = {};
      // @ts-expect-error non-object values are rejected
      const primitive: Primitive = "value";
      // @ts-expect-error arrays are not JSON objects
      const arrayValue: ArrayValue = Object.assign([], { value: true });
      // @ts-expect-error callables are not JSON objects
      const callable: Callable = Object.assign(() => "value", { value: true });
      // @ts-expect-error constructors are not JSON objects
      const constructorValue: Constructor = Object.assign(class {}, { value: true });
      // @ts-expect-error never remains never
      const nothing: Nothing = { value: true };
    `);
  });

  test("keeps named and inline helper semantics equivalent", () => {
    const footer: ts.Node[] = [];
    const cases = [
      ["ObjectUnion", "{ value?: string } | { other: number }"],
      ["Mixed", "{ value?: string } | string | string[] | (() => void) | (abstract new () => object)"],
      ["UnknownValue", "unknown"],
      ["AnyValue", "any"],
      ["Nothing", "never"],
      ["Optional", "{ value?: string }"],
    ] as const;
    const aliases = cases
      .map(([name, source]) => {
        const input = (stringToAST(`type Input = ${source}`)[0] as ts.TypeAliasDeclaration).type;
        const named = astToString(tsWithRequiredObject(input, ["value"], footer, false)).trim();
        const inline = astToString(tsWithRequiredObject(input, ["value"], [], true)).trim();
        return `type Named${name} = ${named}; type Inline${name} = ${inline}; type Check${name} = Assert<Equal<Named${name}, Inline${name}>>;`;
      })
      .join("\n");
    const generic = "{ value?: T; key?: K; outerU?: U; outerP?: P; outerQ?: Q }";
    const genericInput = (stringToAST(`type Input = ${generic}`)[0] as ts.TypeAliasDeclaration).type;
    const namedGeneric = astToString(tsWithRequiredObject(genericInput, ["value"], footer, false)).trim();
    const inlineGeneric = astToString(tsWithRequiredObject(genericInput, ["value"], [], true)).trim();

    expectTypeScriptToCompile(`${astToString(footer)}
      type Equal<A, B> = (<X>() => X extends A ? 1 : 2) extends (<X>() => X extends B ? 1 : 2)
        ? (<X>() => X extends B ? 1 : 2) extends (<X>() => X extends A ? 1 : 2) ? true : false
        : false;
      type Assert<T extends true> = T;
      ${aliases}
      type NamedGeneric<T, K, U, P, Q> = ${namedGeneric};
      type InlineGeneric<T, K, U, P, Q> = ${inlineGeneric};
      type CheckGeneric<T, K, U, P, Q> = Assert<Equal<NamedGeneric<T, K, U, P, Q>, InlineGeneric<T, K, U, P, Q>>>;
    `);
  });
});
