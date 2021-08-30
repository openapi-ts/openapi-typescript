import { parseSchema } from "../src/load";

// Mock Variables
const mockSchema = '{"testing": 123}';

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
});
