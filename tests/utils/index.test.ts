import { swaggerVersion, comment } from "../../src/utils";

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
