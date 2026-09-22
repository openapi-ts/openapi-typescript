import openapiTS from "../src/index.js";
import { expectTypeScriptToCompile } from "./test-helpers.js";

test.each([false, true])("array dimensions and precedence with immutable: %s", async (immutable) => {
  const string = { type: "string" } as const;
  const numbers = { type: "array", items: { type: "number" } } as const;
  const schema = {
    openapi: "3.1.0",
    info: { title: "Array generation", version: "1.0.0" },
    components: {
      schemas: {
        Matrix: { type: "array", items: numbers },
        AnyOf: { type: "array", items: { anyOf: [string, numbers] } },
        ReversedAnyOf: { type: "array", items: { anyOf: [numbers, string] } },
        OneOf: { type: "array", items: { oneOf: [string, numbers] } },
        ReversedOneOf: { type: "array", items: { oneOf: [numbers, string] } },
        Tuples: {
          type: "array",
          items: {
            anyOf: [
              { type: "array", prefixItems: [string] },
              { type: "array", prefixItems: [{ type: "number" }] },
            ],
          },
        },
        TupleItems: { type: "array", items: { type: "array", prefixItems: [string] } },
        BoundedMatrix: { type: "array", minItems: 2, maxItems: 2, items: numbers },
        RestMatrix: { type: "array", minItems: 1, items: numbers },
        Transformed: { type: "array", items: { type: "string", format: "readonly-array" } },
        ConstantItems: { type: "array", items: { const: [1, 2] } },
        EmptyConstantItems: { type: "array", items: { const: [] } },
      },
    },
  };
  const generated = await openapiTS(JSON.stringify(schema), {
    immutable,
    arrayLength: true,
    transform(schema) {
      if (schema.format === "readonly-array") {
        return "readonly number[]";
      }
    },
  });
  expectTypeScriptToCompile(
    generated,
    `
type Schemas = components["schemas"];
const matrix: Schemas["Matrix"] = [[1, 2], [3]];
${immutable ? "// @ts-expect-error immutable outer array" : ""}
matrix.push([4]);
${immutable ? "// @ts-expect-error immutable inner array" : ""}
matrix[0].push(4);
// @ts-expect-error nested arrays retain both dimensions
const flat: Schemas["Matrix"] = [1];

const anyOf: Schemas["AnyOf"] = ["one", [1, 2]];
const reversedAnyOf: Schemas["ReversedAnyOf"] = anyOf;
const oneOf: Schemas["OneOf"] = anyOf;
const reversedOneOf: Schemas["ReversedOneOf"] = oneOf;
// @ts-expect-error compositions describe elements, not the outer array
const scalar: Schemas["AnyOf"] = "one";
// @ts-expect-error number arrays are elements, not the whole schema
const numbers: Schemas["OneOf"] = [1];
// @ts-expect-error reversing composition order keeps the array boundary
const reversedScalar: Schemas["ReversedOneOf"] = "one";

const tuples: Schemas["Tuples"] = [["one"], [1]];
// @ts-expect-error a union of tuples is still an element type
const flatTuple: Schemas["Tuples"] = ["one"];
const tupleItems: Schemas["TupleItems"] = [["one"], ["two"]];
// @ts-expect-error tuples retain their positions
const incorrectTuple: Schemas["TupleItems"] = [[1]];

const bounded: Schemas["BoundedMatrix"] = [[1], [2]];
// @ts-expect-error arrayLength limits the number of rows
const tooMany: Schemas["BoundedMatrix"] = [[1], [2], [3]];
// @ts-expect-error nested arrayLength does not add an extra dimension
const tooDeep: Schemas["BoundedMatrix"] = [[[1]]];
const rest: Schemas["RestMatrix"] = [[1], [2], [3]];
// @ts-expect-error minItems still requires a first row
const emptyRest: Schemas["RestMatrix"] = [];

const transformed: Schemas["Transformed"] = [[1]];
// @ts-expect-error hook-returned readonly applies to the inner array
transformed[0].push(2);
// @ts-expect-error custom array types remain element types
const transformedFlat: Schemas["Transformed"] = [1];
const constantItems: Schemas["ConstantItems"] = [[1, 2]];
// @ts-expect-error literal tuples are array elements
const flatConstantItems: Schemas["ConstantItems"] = [1, 2];
const emptyConstantItems: Schemas["EmptyConstantItems"] = [[]];
// @ts-expect-error empty constant arrays cannot contain elements
const nonemptyConstantItems: Schemas["EmptyConstantItems"] = [[1]];
`,
  );
});
