import { swaggerVersion, comment, isValidHTTPMethod, tsPartial, tsReadonly, tsUnionOf } from "../../src/utils";

describe("swaggerVersion", () => {
  it("v2", () => {
    expect(swaggerVersion({ swagger: "2.0" } as any)).toBe(2);
  });
  it("v3", () => {
    expect(swaggerVersion({ openapi: "3.0.1" } as any)).toBe(3);
  });
  it("errs", () => {
    expect(() => swaggerVersion({} as any)).toThrow();
  });
});

describe("comment", () => {
  it("escapes markdown in comments", () => {
    const text = `Example markdown
**/some/url/path**`;

    expect(comment(text)).toBe(
      `/**
  * Example markdown
  * **\\/some/url/path**
  */
`
    );
  });
});

describe("tsPartial()", () => {
  it.each([["number"], ["string"], ["boolean"], ["null"], ["undefined"]])(
    "Should return a partial type with a generic of %p",
    (genericType: string) => {
      expect(tsPartial(genericType)).toBe(`Partial<${genericType}>`);
    }
  );
});

describe("tsReadonly()", () => {
  it("Should return readonly if isMutable true", () => {
    const isPrefixedReadonly = tsReadonly(true).startsWith("readonly ");
    expect(isPrefixedReadonly).toBe(true);
  });

  it("Should return not return readonly prefix if isMutable false", () => {
    const isPrefixedReadonly = tsReadonly(false).startsWith("");
    expect(isPrefixedReadonly).toBe(true);
  });
});

describe("tsUnionOf()", () => {
  it("Should return first type index at 0 if the type array length is only 1", () => {
    const unionType = tsUnionOf(["string"]);
    expect(unionType).toBe("string");
  });

  it("Should return union type string if multiple types specified", () => {
    const unionType = tsUnionOf(["string", "boolean", "number"]);
    expect(unionType).toBe("(string) | (boolean) | (number)");
  });
});

describe("isValidHTTPMethod()", () => {
  it("Should return false if the http method is invalid from regex", () => {
    const valid = isValidHTTPMethod("test");
    expect(valid).toBe(false);
  });

  it.each([
    [undefined, false],
    [null, false],
    ["", false],
    [{ cannotBeObject: true }, false],
    ["GET", true],
    ["POST", true],
    ["PUT", true],
    ["PATCH", true],
    ["DELETE", true],
    ["OPTIONS", true],
    ["INVALID", false],
  ])(
    "Should check the HTTP method %p to be %p in order to check remote fetch validity",
    (httpMethod: string | object | undefined | null, expectedOutcome: boolean) => {
      const convertedMethodToTest: any = httpMethod;

      const valid = isValidHTTPMethod(convertedMethodToTest);
      expect(valid).toBe(expectedOutcome);
    }
  );
});
