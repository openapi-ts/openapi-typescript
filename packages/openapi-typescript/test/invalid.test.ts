import { SpyInstance } from "vitest";
import openapiTS from "../src/index.js";

describe("Invalid schemas", () => {
  let consoleError: SpyInstance;
  let procExit: SpyInstance;

  beforeEach(() => {
    consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    procExit = vi.spyOn(process, "exit").mockImplementation((() => {}) as any);
  });

  afterAll(() => {
    vi.resetAllMocks();
  });

  test("Swagger 2.0 throws", async () => {
    await expect(() => openapiTS({ swagger: "2.0" } as any)).rejects.toThrow();
    expect(consoleError).toHaveBeenCalledWith(
      expect.stringContaining(
        "Unsupported Swagger version: 2.x. Use OpenAPI 3.x instead.",
      ),
    );
    expect(procExit).toHaveBeenCalledWith(1);
  });

  test("OpenAPI < 3 throws", async () => {
    await expect(() =>
      openapiTS({
        openapi: "2.0",
        info: { title: "Test", version: "1.0" },
      }),
    ).rejects.toThrow();
    expect(consoleError).toHaveBeenCalledWith(
      expect.stringContaining("Unsupported OpenAPI version: 2.0"),
    );
    expect(procExit).toHaveBeenCalledWith(1);
  });

  test("Other missing required fields", async () => {
    await expect(() => openapiTS({} as any)).rejects.toThrow();
    expect(consoleError).toHaveBeenCalledWith(
      expect.stringContaining(
        "Unsupported schema format, expected `openapi: 3.x`",
      ),
    );
    expect(procExit).toHaveBeenCalledWith(1);
  });
});
