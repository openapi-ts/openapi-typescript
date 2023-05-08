import { SpyInstance } from "vitest";
import openapiTS from "../dist/index.js";

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
    await openapiTS({ swagger: "2.0" } as any);
    expect(consoleError).toHaveBeenCalledWith(
      expect.stringContaining("Swagger 2.0 and older no longer supported. Please use v5.")
    );
    expect(procExit).toHaveBeenCalledWith(1);
  });

  test("OpenAPI < 3 throws", async () => {
    await openapiTS({ openapi: "2.0", info: { title: "Test", version: "1.0" } });
    expect(consoleError).toHaveBeenCalledWith(
      expect.stringContaining('Unsupported OpenAPI version "2.0". Only 3.x is supported.')
    );
    expect(procExit).toHaveBeenCalledWith(1);
  });
});
