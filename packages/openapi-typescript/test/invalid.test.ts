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

  test("Unresolved $ref error messages", async () => {
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    await expect(() =>
      openapiTS({
        openapi: "3.1",
        info: { title: "test", version: "1.0" },
        components: {
          schemas: {
            Pet: {
              type: "object",
              properties: {
                category: { $ref: "#/components/schemas/NonExistingSchema" },
                type: { $ref: "#/components/schemas/AnotherSchema" },
              },
            },
          },
        },
      }),
    ).rejects.toThrowError("Can't resolve $ref at #/components/schemas/Pet/properties/type");

    expect(consoleErrorSpy).toHaveBeenCalledTimes(2);
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining("Can't resolve $ref at #/components/schemas/Pet/properties/category"),
    );
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining("Can't resolve $ref at #/components/schemas/Pet/properties/type"),
    );
  });
});
