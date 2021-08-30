import { resolve } from "path";
import { URL } from "url";
import { Headers } from "node-fetch";

import { isFile, parseHttpHeaders, parseSchema, resolveSchema } from "../src/load";

// Mock Variables
const mockSchema = '{"testing": 123}';
const currentWorkingDirectory = process.cwd();
const mockHttpUrl = new URL("https://test.com");
const mockFileUrl = new URL(`${currentWorkingDirectory}/package.json`, "file://");

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

  describe("resolveSchema()", () => {
    it("Should construct a URL from the http protocol string", () => {
      expect(resolveSchema(mockHttpUrl.href)).toStrictEqual(mockHttpUrl);
    });

    it("Should return a local path that exists from an absolute file path", () => {
      const newFile = resolve("package.json");
      expect(resolveSchema(newFile)).toStrictEqual(new URL(newFile, "file://"));
    });

    it("Should add a non absolute URL and resolve to current working directory", () => {
      expect(resolveSchema("package.json")).toStrictEqual(
        new URL(`${currentWorkingDirectory}/package.json`, "file://")
      );
    });

    it("Should throw an error when the local path does not exist", () => {
      const nonExistentURL = "file://test.gif";
      expect(() => resolveSchema(nonExistentURL)).toThrowError(`Could not locate ${nonExistentURL}`);
    });

    it("Should throw an error when pointing the local path at a directory and not a file", () => {
      const existingDirectory = resolve(currentWorkingDirectory, "src");
      const mockExistingURL = new URL(existingDirectory, "file://");
      expect(() => resolveSchema(existingDirectory)).toThrowError(`${mockExistingURL} is a directory not a file`);
    });
  });

  describe("parseHttpHeaders()", () => {
    it("Should return an empty object when headers passed are nullish", () => {
      expect(parseHttpHeaders(null)).toStrictEqual({});
    });

    it("Should return an empty object if headers is defined and not an object", () => {
      expect(parseHttpHeaders(true as any)).toStrictEqual({});
    });

    it("Should parse headers when added via the Map data structure", () => {
      const mockHeaderMap = new Map([["x-testing", true]]);

      expect(parseHttpHeaders(mockHeaderMap)).toStrictEqual({
        "x-testing": "true",
      });
    });

    it("Should parse headers when added via the Headers map data structure", () => {
      const mockHeaderMap = new Headers();
      mockHeaderMap.append("x-testing", "true");

      expect(parseHttpHeaders(mockHeaderMap)).toStrictEqual({
        "x-testing": "true",
      });
    });

    it("Should parse headers when passed as a vanilla JS/JSON object", () => {
      const mockHeaders = {
        "x-testing": true,
        "x-more": "I am testing parsed headers",
      };

      expect(parseHttpHeaders(mockHeaders)).toStrictEqual({
        "x-testing": "true",
        "x-more": "I am testing parsed headers",
      });
    });

    it("Should log an error when the header value cannot be parsed", () => {
      jest.spyOn(console, "error");

      const mockHeaders = {
        "x-testing": true,
        "x-more": "I am testing parsed headers",
        "cannot-parse": Math.random,
      };

      expect(parseHttpHeaders(mockHeaders as any)).toStrictEqual({
        "x-testing": "true",
        "x-more": "I am testing parsed headers",
        "cannot-parse": undefined,
      });
    });
  });
});
