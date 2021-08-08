import { swaggerVersion, comment, isValidHTTPMethod } from "../../src/utils";

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

describe("isValidHTTPMethod()", () => {
  it("Should return false if the http method is invalid fromr regex", () => {
    const valid = isValidHTTPMethod("test");
    expect(valid).toBe(false);
  });

  it.each([
    ["GET", true],
    ["POST", true],
    ["PUT", true],
    ["PATCH", true],
    ["DELETE", true],
    ["OPTIONS", true],
    ["INVALID", false],
  ])(
    "Should check the HTTP method %p to be %p in order to check remote fetch validity",
    (httpMethod: string, expectedOutcome: boolean) => {
      const valid = isValidHTTPMethod(httpMethod);
      expect(valid).toBe(expectedOutcome);
    }
  );
});
