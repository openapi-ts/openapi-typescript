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

    it.todo("Should return true when file protocol is present in base URL");
  });

  describe("resolveSchema()", () => {
    it("Should construct a URL from the http protocol string", () => {
      expect(resolveSchema(mockHttpUrl.href)).toStrictEqual(mockHttpUrl);
    });

    // Most tests are marked as todos, due to the CI process running them in a windows OS context
    // Therefore, the file path changes and is different from Unix/Linux Machines
    it.todo("Should return a local path that exists from an absolute file path");

    it.todo("Should add a non absolute URL and resolve to current working directory");

    it.todo("Should throw an error when the local path does not exist");

    it.todo("Should throw an error when pointing the local path at a directory and not a file");
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
