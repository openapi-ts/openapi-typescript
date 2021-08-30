import { URL } from "url";

import { isFile, parseSchema } from "../src/load";

// Mock Variables
const mockSchema = '{"testing": 123}';
const mockHttpUrl = new URL("https://test.com");
const mockFileUrl = new URL("/myImage.png", "file://test");

describe("Load Schema Tests", () => {
  afterEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
  });

  describe("parseSchema()", () => {
    it("Should throw an error when parsing YAML formatted schema", () => {
      expect(() => parseSchema("}", "YAML")).toThrowError();
    });

    it("Should respond with parsed yaml", () => {
      expect(parseSchema(mockSchema, "YAML")).toMatchObject(JSON.parse(mockSchema));
    });

    it("Should throw an error when parsing JSON formatted schema", () => {
      expect(() => parseSchema("}", "JSON")).toThrowError();
    });

    it("Should return resolved json after being parsed", () => {
      expect(parseSchema(mockSchema, "JSON")).toEqual(JSON.parse(mockSchema));
    });
  });

  describe("isFile()", () => {
    it("Should return false when URL protocol is not of type file", () => {
      expect(isFile(mockHttpUrl)).toBe(false);
    });

    it("Should return true when file protocol is present in base URL", () => {
      expect(isFile(mockFileUrl)).toBe(true);
    });
  });
});
