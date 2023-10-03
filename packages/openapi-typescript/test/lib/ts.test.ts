import ts from "typescript";
import {
  addJSDocComment,
  BOOLEAN,
  NULL,
  NUMBER,
  STRING,
  astToString,
  oapiRef,
  tsEnum,
  tsIsPrimitive,
  tsLiteral,
  tsPropertyIndex,
  tsUnion,
} from "../../src/lib/ts.js";

describe("addJSDocComment", () => {
  it("single-line comment", () => {
    const property = ts.factory.createPropertySignature(
      undefined,
      "comment",
      undefined,
      BOOLEAN,
    );
    addJSDocComment({ description: "Single-line comment" }, property);
    expect(astToString(ts.factory.createTypeLiteralNode([property])).trim())
      .toBe(`{
    /** @description Single-line comment */
    comment: boolean;
}`);
  });

  it("multi-line comment", () => {
    const property = ts.factory.createPropertySignature(
      undefined,
      "comment",
      undefined,
      BOOLEAN,
    );
    addJSDocComment(
      {
        summary: "This is the summary",
        description: "Multi-line comment\nLine 2",
        deprecated: true,
      },
      property,
    );
    expect(astToString(ts.factory.createTypeLiteralNode([property])).trim())
      .toBe(`{
    /**
     * This is the summary
     * @deprecated
     * @description Multi-line comment
     *   Line 2
     */
    comment: boolean;
}`);
  });
});

describe("oapiRef", () => {
  it("single part", () => {
    expect(astToString(oapiRef("#/components")).trim()).toBe(`components`);
  });

  it("multiple parts", () => {
    expect(astToString(oapiRef("#/components/schemas/User")).trim()).toBe(
      `components["schemas"]["User"]`,
    );
  });
});

describe("tsEnum", () => {
  it("string members", () => {
    expect(astToString(tsEnum("-my-color-", ["green", "red", "blue"])).trim())
      .toBe(`enum MyColor {
    green = "green",
    red = "red",
    blue = "blue"
}`);
  });

  it("name from path", () => {
    expect(
      astToString(
        tsEnum("#/paths/url/get/parameters/query/status", [
          "active",
          "inactive",
        ]),
      ).trim(),
    ).toBe(`enum PathsUrlGetParametersQueryStatus {
    active = "active",
    inactive = "inactive"
}`);
  });

  it("string members with numeric prefix", () => {
    expect(astToString(tsEnum("/my/enum/", ["0a", "1b", "2c"])).trim())
      .toBe(`enum MyEnum {
    Value0a = "0a",
    Value1b = "1b",
    Value2c = "2c"
}`);
  });

  it("number members", () => {
    expect(astToString(tsEnum(".Error.code.", [100, 101, 102])).trim())
      .toBe(`enum ErrorCode {
    Value100 = 100,
    Value101 = 101,
    Value102 = 102
}`);
  });
});

describe("tsPropertyIndex", () => {
  it("numbers -> number literals", () => {
    expect(astToString(tsPropertyIndex(200)).trim()).toBe(`200`);
    expect(astToString(tsPropertyIndex(200.5)).trim()).toBe(`200.5`);
    expect(astToString(tsPropertyIndex(Infinity)).trim()).toBe(`Infinity`);
    expect(astToString(tsPropertyIndex(NaN)).trim()).toBe(`NaN`);
  });

  it("valid strings -> identifiers", () => {
    expect(astToString(tsPropertyIndex("identifier")).trim()).toBe(
      `identifier`,
    );
    expect(astToString(tsPropertyIndex("snake_case")).trim()).toBe(
      `snake_case`,
    );
    expect(astToString(tsPropertyIndex("$id")).trim()).toBe(`$id`);
  });

  it("invalid strings -> string literals", () => {
    expect(astToString(tsPropertyIndex("kebab-case")).trim()).toBe(
      `"kebab-case"`,
    );
    expect(astToString(tsPropertyIndex("application/json")).trim()).toBe(
      `"application/json"`,
    );
    expect(astToString(tsPropertyIndex("0invalid")).trim()).toBe(`"0invalid"`);
    expect(astToString(tsPropertyIndex("inv@lid")).trim()).toBe(`"inv@lid"`);
    expect(astToString(tsPropertyIndex("in.valid")).trim()).toBe(`"in.valid"`);
  });
});

describe("tsIsPrimitive", () => {
  it("null", () => {
    expect(tsIsPrimitive(NULL)).toBe(true);
  });

  it("number", () => {
    expect(tsIsPrimitive(NUMBER)).toBe(true);
  });

  it("string", () => {
    expect(tsIsPrimitive(STRING)).toBe(true);
  });

  it("boolean", () => {
    expect(tsIsPrimitive(BOOLEAN)).toBe(true);
  });

  it("array", () => {
    expect(tsIsPrimitive(ts.factory.createArrayTypeNode(STRING))).toBe(false);
  });

  it("object", () => {
    expect(
      tsIsPrimitive(
        ts.factory.createTypeLiteralNode([
          ts.factory.createPropertySignature(
            undefined,
            "foo",
            undefined,
            STRING,
          ),
        ]),
      ),
    ).toBe(false);
  });
});

describe("tsUnion", () => {
  it("none", () => {
    expect(astToString(tsUnion([])).trim()).toBe(`never`);
  });

  it("one", () => {
    expect(astToString(tsUnion([STRING])).trim()).toBe(`string`);
  });

  it("multiple (primitive)", () => {
    expect(
      astToString(tsUnion([STRING, STRING, NUMBER, NULL, NUMBER, NULL])).trim(),
    ).toBe(`string | number | null`);
  });

  it("multiple (const)", () => {
    expect(
      astToString(
        tsUnion([NULL, tsLiteral("red"), tsLiteral(42), tsLiteral(false)]),
      ).trim(),
    ).toBe(`null | "red" | 42 | false`);
  });

  it("multiple (object types)", () => {
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
