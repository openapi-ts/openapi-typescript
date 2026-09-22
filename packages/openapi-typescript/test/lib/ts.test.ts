import {
  addJSDocComment,
  astToString,
  BOOLEAN,
  INDENT,
  NULL,
  NUMBER,
  oapiRef,
  propertySignature,
  STRING,
  tsArray,
  tsArrayLiteralExpression,
  tsEnum,
  tsEnumMember,
  tsIntersection,
  tsIsPrimitive,
  tsLiteral,
  tsNullable,
  tsParenthesize,
  tsPropertyIndex,
  tsUnion,
  tsWithRequired,
  typeLiteral,
} from "../../src/lib/ts.js";
import { expectTypeScriptToCompile } from "../test-helpers.js";

describe("astToString", () => {
  test("joins generated declarations", () => {
    expect(astToString(["type A = string;", "type B = number;"])).toBe("type A = string;\ntype B = number;\n");
  });

  test("rejects removed printer options with migration guidance", () => {
    expect(() => {
      // @ts-expect-error printer options were removed with the AST API
      astToString("type A = string;", { formatOptions: { removeComments: true } });
    }).toThrow("astToString no longer accepts printer options. Format the returned source separately.");
  });

  test("rejects old AST inputs with migration guidance", () => {
    expect(() => {
      // @ts-expect-error TypeScript AST nodes were replaced with strings
      astToString({ kind: 183 });
    }).toThrow("astToString expects generated source strings; TypeScript AST nodes are no longer supported.");
  });
});

/** Build the `{ comment: T }` literal the comment tests assert against */
function commentLiteral(schemaObject: any, type: string, commentIndent = INDENT) {
  return typeLiteral(
    [
      propertySignature({
        name: "comment",
        type,
        comment: addJSDocComment(schemaObject, commentIndent),
        indent: INDENT,
      }),
    ],
    "",
  );
}

describe("addJSDocComment", () => {
  test("single-line comment", () => {
    expect(commentLiteral({ description: "Single-line comment" }, BOOLEAN)).toBe(`{
    /** @description Single-line comment */
    comment: boolean;
}`);
  });

  test("multi-line comment", () => {
    expect(
      commentLiteral(
        {
          summary: "This is the summary",
          description: "Multi-line comment\nLine 2",
          deprecated: true,
        },
        BOOLEAN,
      ),
    ).toBe(`{
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
    expect(commentLiteral({ title: "This is a comment with `/* an example comment */` within" }, BOOLEAN)).toBe(`{
    /** This is a comment with \`/* an example comment *\\/\` within */
    comment: boolean;
}`);
  });

  test("single example", () => {
    expect(commentLiteral({ example: "an-example" }, BOOLEAN)).toBe(`{
    /** @example an-example */
    comment: boolean;
}`);
  });

  test("array of examples", () => {
    expect(commentLiteral({ examples: ["an-example", "another-example"] }, BOOLEAN)).toBe(`{
    /**
     * @example an-example
     * @example another-example
     */
    comment: boolean;
}`);
  });

  test("single example and array of examples", () => {
    expect(commentLiteral({ example: "old-example", examples: ["an-example", "another-example"] }, BOOLEAN)).toBe(`{
    /**
     * @example old-example
     * @example an-example
     * @example another-example
     */
    comment: boolean;
}`);
  });

  test("complex examples", () => {
    expect(
      commentLiteral(
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
        BOOLEAN,
      ),
    ).toBe(`{
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
    expect(oapiRef("#/components")).toBe("components");
  });

  test("multiple parts", () => {
    expect(oapiRef("#/components/schemas/User")).toBe(`components["schemas"]["User"]`);
  });

  test("`properties` of component schema `properties`", () => {
    expect(oapiRef("#/components/schemas/User/properties/username")).toBe(`components["schemas"]["User"]["username"]`);
  });

  test("component schema named `properties`", () => {
    expect(oapiRef("#/components/schemas/properties")).toBe(`components["schemas"]["properties"]`);
  });

  test("reference into paths parameters", () => {
    expect(
      oapiRef("#/paths/~1endpoint/get/parameters/0", {
        in: "query",
        name: "boop",
        required: true,
      }),
    ).toBe('paths["/endpoint"]["get"]["parameters"]["query"]["boop"]');
  });
});

describe("tsEnum", () => {
  test("string members", () => {
    expect(tsEnum("-my-color-", ["green", "red", "blue"]).declaration).toBe(`enum MyColor {
    green = "green",
    red = "red",
    blue = "blue"
}`);
  });

  test("with setting: export", () => {
    expect(
      tsEnum("-my-color-", ["green", "red", "blue"], undefined, {
        export: true,
      }).declaration,
    ).toBe(`export enum MyColor {
    green = "green",
    red = "red",
    blue = "blue"
}`);
  });

  test("name from path", () => {
    expect(
      tsEnum("#/paths/url/get/parameters/query/status", ["active", "inactive"]).declaration,
    ).toBe(`enum PathsUrlGetParametersQueryStatus {
    active = "active",
    inactive = "inactive"
}`);
  });

  test("string members with numeric prefix", () => {
    expect(tsEnum("/my/enum/", ["0a", "1b", "2c"]).declaration).toBe(`enum MyEnum {
    Value0a = "0a",
    Value1b = "1b",
    Value2c = "2c"
}`);
  });

  test("number members", () => {
    expect(tsEnum(".Error.code.", [100, 101, 102, -100]).declaration).toBe(`enum ErrorCode {
    Value100 = 100,
    Value101 = 101,
    Value102 = 102,
    ValueMinus100 = -100
}`);
  });

  test("number members with x-enum-descriptions", () => {
    expect(
      tsEnum(
        ".Error.code.",
        [100, 101, 102],
        [{ description: "Code 100" }, { description: "Code 101" }, { description: "Code 102" }],
      ).declaration,
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
      tsEnum(
        ".Error.code.",
        [100, 101, 102],
        [{ name: "Unauthorized" }, { name: "NotFound" }, { name: "PermissionDenied" }],
      ).declaration,
    ).toBe(`enum ErrorCode {
    Unauthorized = 100,
    NotFound = 101,
    PermissionDenied = 102
}`);
  });

  test("x-enum-varnames with numeric prefix", () => {
    expect(
      tsEnum(".Error.code.", [100, 101, 102], [{ name: "0a" }, { name: "1b" }, { name: "2c" }]).declaration,
    ).toBe(`enum ErrorCode {
    Value0a = 100,
    Value1b = 101,
    Value2c = 102
}`);
  });

  test("partial x-enum-varnames and x-enum-descriptions", () => {
    expect(
      tsEnum(
        ".Error.code.",
        [100, 101, 102],
        [
          { name: "Unauthorized", description: "User is unauthorized" },
          { name: "NotFound", description: "" },
          { name: "Value102", description: null },
        ],
      ).declaration,
    ).toBe(`enum ErrorCode {
    // User is unauthorized
    Unauthorized = 100,
    NotFound = 101,
    Value102 = 102
}`);
  });

  test("x-enum-descriptions with x-enum-varnames", () => {
    expect(
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
      ).declaration,
    ).toBe(`enum ErrorCode {
    // User is unauthorized
    Unauthorized = 100,
    // Item not found
    NotFound = 101,
    // User doesn't have permissions
    PermissionDenied = 102
}`);
  });

  test("multi-line x-enum-descriptions stay on one comment line", () => {
    // a `//` comment ends at the first line break, so line breaks are flattened
    // rather than leaking a bare token into the enum body
    expect(tsEnum("E", ["a"], [{ description: "line1\nline2" }]).declaration).toBe(
      `enum E {
    // line1 line2
    a = "a"
}`,
    );
  });

  test("replace special character", () => {
    expect(tsEnum("FOO_ENUM", ["Etc/GMT+0", "Etc/GMT+1", "Etc/GMT-1"]).declaration).toBe(`enum FOO_ENUM {
    Etc_GMTPlus0 = "Etc/GMT+0",
    Etc_GMTPlus1 = "Etc/GMT+1",
    Etc_GMT_1 = "Etc/GMT-1"
}`);
  });
});

describe("tsArrayLiteralExpression", () => {
  test("string members", () => {
    expect(
      tsArrayLiteralExpression("-my-color-Values", oapiRef("#/components/schemas/Color"), ["green", "red", "blue"]),
    ).toBe(`const myColorValues: components["schemas"]["Color"][] = ["green", "red", "blue"];`);
  });

  test("with setting: export", () => {
    expect(
      tsArrayLiteralExpression("-my-color-Values", oapiRef("#/components/schemas/Color"), ["green", "red", "blue"], {
        export: true,
      }),
    ).toBe(`export const myColorValues: components["schemas"]["Color"][] = ["green", "red", "blue"];`);
  });

  test("with setting: readonly", () => {
    expect(
      tsArrayLiteralExpression("-my-color-Values", oapiRef("#/components/schemas/Color"), ["green", "red", "blue"], {
        readonly: true,
      }),
    ).toBe(`const myColorValues: ReadonlyArray<components["schemas"]["Color"]> = ["green", "red", "blue"];`);
  });

  test("name from path", () => {
    expect(
      tsArrayLiteralExpression(
        "#/paths/url/get/parameters/query/status/Values",
        oapiRef("#/components/schemas/Status"),
        ["active", "inactive"],
      ),
    ).toBe(`const pathsUrlGetParametersQueryStatusValues: components["schemas"]["Status"][] = ["active", "inactive"];`);
  });

  test("number members", () => {
    expect(
      tsArrayLiteralExpression(".Error.code.Values", oapiRef("#/components/schemas/ErrorCode"), [100, 101, 102, -100]),
    ).toBe(`const errorCodeValues: components["schemas"]["ErrorCode"][] = [100, 101, 102, -100];`);
  });
});

describe("tsPropertyIndex", () => {
  test("numbers -> number literals", () => {
    expect(tsPropertyIndex(200)).toBe("200");
    expect(tsPropertyIndex(200.5)).toBe("200.5");
    expect(tsPropertyIndex(Number.POSITIVE_INFINITY)).toBe("Infinity");
    expect(tsPropertyIndex(Number.NaN)).toBe("NaN");
    expect(tsPropertyIndex(10e3)).toBe("10000");
  });

  test("valid strings -> identifiers", () => {
    expect(tsPropertyIndex("identifier")).toBe("identifier");
    expect(tsPropertyIndex("snake_case")).toBe("snake_case");
    expect(tsPropertyIndex(200)).toBe("200");
    expect(tsPropertyIndex("$id")).toBe("$id");
    expect(tsPropertyIndex("10e3")).toBe(`"10e3"`);
  });

  test("invalid strings -> string literals", () => {
    expect(tsPropertyIndex("kebab-case")).toBe(`"kebab-case"`);
    expect(tsPropertyIndex("application/json")).toBe(`"application/json"`);
    expect(tsPropertyIndex("0invalid")).toBe(`"0invalid"`);
    expect(tsPropertyIndex("inv@lid")).toBe(`"inv@lid"`);
    expect(tsPropertyIndex("in.valid")).toBe(`"in.valid"`);
    expect(tsPropertyIndex(-1)).toBe(`"-1"`);
    expect(tsPropertyIndex("-1")).toBe(`"-1"`);
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
    expect(tsIsPrimitive(`${STRING}[]`)).toBe(false);
  });

  test("object", () => {
    expect(tsIsPrimitive(typeLiteral([propertySignature({ name: "foo", type: STRING, indent: INDENT })], ""))).toBe(
      false,
    );
  });
});

describe("tsParenthesize", () => {
  test("wraps unions and intersections", () => {
    expect(tsParenthesize(`${STRING} | ${NUMBER}`)).toBe(`(${STRING} | ${NUMBER})`);
    expect(tsParenthesize(`${STRING} & ${NUMBER}`)).toBe(`(${STRING} & ${NUMBER})`);
  });

  test("wraps function types", () => {
    expect(tsParenthesize("(arg: string) => number")).toBe("((arg: string) => number)");
  });

  test("wraps conditional types", () => {
    expect(tsParenthesize("T extends string ? A : B")).toBe("(T extends string ? A : B)");
  });

  test("leaves atomic types alone", () => {
    expect(tsParenthesize(STRING)).toBe(STRING);
    expect(tsParenthesize(`components["schemas"]["User"]`)).toBe(`components["schemas"]["User"]`);
    expect(tsParenthesize(`${STRING}[]`)).toBe(`${STRING}[]`);
    expect(tsParenthesize("Record<string, never>")).toBe("Record<string, never>");
  });

  test("ignores operators inside generics, literals and comments", () => {
    expect(tsParenthesize(`Omit<X, "a" | "b">`)).toBe(`Omit<X, "a" | "b">`);
    expect(tsParenthesize(`"a | b"`)).toBe(`"a | b"`);
    expect(tsParenthesize("{\n    /** a | b */\n    x: string;\n}")).toBe("{\n    /** a | b */\n    x: string;\n}");
  });

  test("keeps a nullable function type from swallowing the union", () => {
    expect(tsNullable(["(arg: string) => number"])).toBe("((arg: string) => number) | null");
  });

  test.each([
    ["LF", "\n"],
    ["CR", "\r"],
    ["CRLF", "\r\n"],
    ["line separator", "\u2028"],
    ["paragraph separator", "\u2029"],
  ])("preserves precedence after a %s line comment", (_name, lineBreak) => {
    const element = `string // comment${lineBreak} | number`;
    const intersection = tsIntersection([`"one" // comment${lineBreak} | "two"`, '"two"']);
    const templateElement = `\`prefix\${"a" // comment${lineBreak}}\` | "other"`;
    expect(tsArray(element)).toBe(`(${element})[]`);
    expect(tsArray(templateElement)).toBe(`(${templateElement})[]`);
    expectTypeScriptToCompile(`
      type Elements = ${tsArray(element)};
      const elements: Elements = ["value", 1];
      // @ts-expect-error the entire union describes an array element
      const scalar: Elements = "value";
      type Intersection = ${intersection};
      const included: Intersection = "two";
      // @ts-expect-error intersection applies to both union members
      const excluded: Intersection = "one";
      type TemplateElements = ${tsArray(templateElement)};
      const templates: TemplateElements = ["prefixa", "other"];
      // @ts-expect-error the template literal is an element, not the whole array
      const templateScalar: TemplateElements = "prefixa";
    `);
  });
});

describe("tsArray", () => {
  const cases = [
    ["string", "string[]"],
    ["number[]", "number[][]"],
    ["readonly number[]", "(readonly number[])[]"],
    ["readonly [string, number]", "(readonly [string, number])[]"],
    ["keyof { value: string }", "(keyof { value: string })[]"],
    ["typeof value", "(typeof value)[]"],
    ["string | number[]", "(string | number[])[]"],
    ["{ id: string } & { name: string }", "({ id: string } & { name: string })[]"],
    ["(arg: string) => number", "((arg: string) => number)[]"],
    ["<U>(arg: U) => U", "(<U>(arg: U) => U)[]"],
    ["abstract new () => object", "(abstract new () => object)[]"],
    ["T extends string ? number : boolean", "(T extends string ? number : boolean)[]"],
    ["Record<string, (arg: number) => string | number>", "Record<string, (arg: number) => string | number>[]"],
    // biome-ignore lint/suspicious/noTemplateCurlyInString: Test nested TypeScript template literal types.
    ['`${"}" | `${"{"}`}` | number', '(`${"}" | `${"{"}`}` | number)[]'],
    ["/* braces { and apostrophe ' */ readonly string[]", "(/* braces { and apostrophe ' */ readonly string[])[]"],
  ] as const;

  test.each(cases)("preserves array element precedence for %s", (source, expected) => {
    expect(tsArray(source)).toBe(expected);
  });

  test("preserves type semantics for operator and composition elements", () => {
    expectTypeScriptToCompile(`
      declare const value: { value: string };
      type Equal<A, B> = (<X>() => X extends A ? 1 : 2) extends (<X>() => X extends B ? 1 : 2)
        ? (<X>() => X extends B ? 1 : 2) extends (<X>() => X extends A ? 1 : 2) ? true : false
        : false;
      type Assert<T extends true> = T;
      ${cases
        .map(
          ([source, expected], index) =>
            `type Generated${index}<T> = ${tsArray(source)};\n` +
            `type Expected${index}<T> = ${expected};\n` +
            `type Check${index} = Assert<Equal<Generated${index}<string>, Expected${index}<string>>>;`,
        )
        .join("\n")}
    `);
  });
});

describe("non-ASCII string literals", () => {
  test("property names escape non-ASCII code units exactly like the compiler", () => {
    expect(tsPropertyIndex("emoji🎉")).toBe('"emoji\\uD83C\\uDF89"');
    expect(tsPropertyIndex("café")).toBe('"caf\\u00E9"');
    expect(tsPropertyIndex("привет")).toBe('"\\u043F\\u0440\\u0438\\u0432\\u0435\\u0442"');
  });

  test("escapes the characters the compiler gives named escapes", () => {
    expect(tsPropertyIndex("a\nb")).toBe('"a\\nb"');
    expect(tsPropertyIndex("a\tb")).toBe('"a\\tb"');
    expect(tsPropertyIndex("a\u0000b")).toBe('"a\\0b"');
    expect(tsPropertyIndex("a\u2028b")).toBe('"a\\u2028b"');
  });

  test("enum members and array literals escape non-ASCII", () => {
    expect(tsEnumMember("café")).toBe('caf_ = "caf\\u00E9"');
    expect(tsArrayLiteralExpression("x", "string", ["café"])).toBe('const x: string[] = ["caf\\u00E9"];');
  });

  test("$ref segments escape non-ASCII", () => {
    expect(oapiRef("#/components/schemas/café")).toBe('components["schemas"]["caf\\u00E9"]');
  });

  test("tsLiteral keeps non-ASCII verbatim (UTF-8 workaround)", () => {
    // intentionally NOT escaped: mirrors createIdentifier(JSON.stringify(…))
    expect(tsLiteral("emoji🎉")).toBe('"emoji🎉"');
  });
});

describe("tsUnion", () => {
  test("none", () => {
    expect(tsUnion([])).toBe("never");
  });

  test("one", () => {
    expect(tsUnion([STRING])).toBe("string");
  });

  test("multiple (primitive)", () => {
    expect(tsUnion([STRING, STRING, NUMBER, NULL, NUMBER, NULL])).toBe("string | number | null");
  });

  test("multiple (const)", () => {
    expect(tsUnion([NULL, tsLiteral("red"), tsLiteral(42), tsLiteral(false)])).toBe(`null | "red" | 42 | false`);
  });

  test("collapses a redundant union instead of emitting a single-member union", () => {
    // The AST implementation built a one-member union node here, which the
    // TypeScript printer rendered as `(string)` in parenthesised positions.
    // Emitting the bare keyword is equivalent and strictly cleaner.
    expect(tsUnion([STRING, STRING])).toBe(STRING);
    expect(tsIntersection([STRING, STRING])).toBe(STRING);
    expect(`${tsParenthesize(tsUnion([STRING, STRING]))}[]`).toBe("string[]");
  });

  test("multiple (object types)", () => {
    const obj = typeLiteral([propertySignature({ name: "foo", type: STRING, indent: INDENT })], "");
    expect(tsUnion([obj, obj, NULL])).toBe(`{
    foo: string;
} | {
    foo: string;
} | null`);
  });
});

describe("tsWithRequired", () => {
  test("does not mistake enum strings for helper declarations", () => {
    const footer = [
      tsEnum(
        "Decoy",
        ["type WithRequired<", "type FlattenedDeepRequired<", "type ReadonlyArray<"],
        [{ name: "Required" }, { name: "DeepRequired" }, { name: "Readonly" }],
      ).declaration,
    ];
    const required = tsWithRequired("{ value?: string }", ["value"], footer);
    const values = tsArrayLiteralExpression("values", "string[]", ["value"], {
      readonly: true,
      injectFooter: footer,
    });
    expectTypeScriptToCompile(`
      export {};
      ${astToString(footer)}
      type Required = ${required};
      const present: Required = { value: "value" };
      // @ts-expect-error the helper must enforce the required key
      const absent: Required = {};
      ${values}
      const first: string = values[0];
      // @ts-expect-error the enhanced array helper preserves readonly indices
      values[0] = "other";
      type Deep = FlattenedDeepRequired<{ items?: { value?: number }[] }>;
      const deep: Deep = { items: { value: 1 } };
      // @ts-expect-error nested array elements are flattened and required
      const missing: Deep = { items: {} };
    `);
  });

  test("injects the legacy helper once and preserves valid low-level inputs", () => {
    const footer: string[] = [];
    const source = "Source";
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
