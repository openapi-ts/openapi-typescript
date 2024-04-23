import openapiTS from "../src/index.js";

describe("Invalid schemas", () => {
  test("Swagger 2.0 throws", async () => {
    await expect(() => openapiTS({ swagger: "2.0" } as any)).rejects.toThrowError(
      "Unsupported Swagger version: 2.x. Use OpenAPI 3.x instead.",
    );
  });

  test("OpenAPI < 3 throws", async () => {
    await expect(() =>
      openapiTS({
        openapi: "2.0",
        info: { title: "Test", version: "1.0" },
      }),
    ).rejects.toThrowError("Unsupported OpenAPI version: 2.0");
  });

  test("Other missing required fields", async () => {
    await expect(() => openapiTS({} as any)).rejects.toThrowError("Unsupported schema format, expected `openapi: 3.x`");
  });
});
