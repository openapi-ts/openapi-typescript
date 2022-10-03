import openapiTS from "../dist/index.js";

describe("Swagger 2.0", () => {
  test("it throws error", async () => {
    await expect(
      (async () => {
        await openapiTS({ swagger: "2.0" } as any);
      })()
    ).rejects.toThrowError("Swagger 2.0 and older no longer supported. Please use v5.");
  });
});
