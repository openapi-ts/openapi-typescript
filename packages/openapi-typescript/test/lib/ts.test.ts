import ts from "typescript";
import {
  addJSDocComment,
  BOOLEAN,
  NULL,
  NUMBER,
  STRING,
  astToString,
  oapiRef,
  tsArrayLiteralExpression,
  tsEnum,
  tsIsPrimitive,
  tsLiteral,
  tsPropertyIndex,
  tsUnion,
} from "../../src/lib/ts.js";

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
});

describe("oapiRef", () => {
  test("single part", () => {
    expect(astToString(oapiRef("#/components")).trim()).toBe("components");
  });

  test("multiple parts", () => {
    expect(astToString(oapiRef("#/components/schemas/User")).trim()).toBe(`components["schemas"]["User"]`);
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
    expect(astToString(tsEnum("#/paths/url/get/parameters/query/status", ["active", "inactive"])).trim()).toBe(`enum PathsUrlGetParametersQueryStatus {
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
          [{ name: "Unauthorized", description: "User is unauthorized" }, { name: "NotFound" }],
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
