import { escape, swaggerVersion, unescape } from "../../src/utils";

describe("escape", () => {
  it("escape", () => {
    expect(escape("string")).toBe("<@string@>");
  });
  it("unescape", () => {
    expect(unescape('"<@string@>"')).toBe("string");
  });
});

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
