import { dump as stringifyYaml } from "js-yaml";
import { Readable } from "node:stream";
import { Response, fetch as unidiciFetch } from "undici";
import internalLoad, { type LoadOptions } from "../src/load.js";
import type { Subschema } from "../src/types.js";

describe("Load", () => {
  describe("remote schema", () => {
    describe("in json", () => {
      test("type deduced from extension .json", async () => {
        const output = await load(new URL("https://example.com/openapi.json"), {
          async fetch() {
            return new Response(JSON.stringify(exampleSchema), {
              headers: { "Content-Type": "text/plain" },
            });
          },
        });
        expect(output["."].schema).toEqual(exampleSchema);
      });
      test("type deduced from Content-Type header", async () => {
        const output = await load(new URL("https://example.com/openapi"), {
          async fetch() {
            return new Response(JSON.stringify(exampleSchema), {
              headers: { "Content-Type": "application/json" },
            });
          },
        });
        expect(output["."].schema).toEqual(exampleSchema);
      });
      // Regression test for https://github.com/drwpow/openapi-typescript/issues/988
      test("type deduced from Content-Type header, in lowercase", async () => {
        const output = await load(new URL("https://example.com/openapi"), {
          async fetch() {
            return new Response(JSON.stringify(exampleSchema), {
              headers: { "content-type": "application/json" },
            });
          },
        });
        expect(output["."].schema).toEqual(exampleSchema);
      });
    });

    describe("in yaml", () => {
      test("type deduced from extension .yaml", async () => {
        const output = await load(new URL("https://example.com/openapi.yaml"), {
          async fetch() {
            return new Response(stringifyYaml(exampleSchema), {
              headers: { "Content-Type": "text/plain" },
            });
          },
        });
        expect(output["."].schema).toEqual(exampleSchema);
      });
      test("type deduced from extension .yml", async () => {
        const output = await load(new URL("https://example.com/openapi.yml"), {
          async fetch() {
            return new Response(stringifyYaml(exampleSchema), {
              headers: { "Content-Type": "text/plain" },
            });
          },
        });
        expect(output["."].schema).toEqual(exampleSchema);
      });
      test("type deduced from Content-Type header", async () => {
        const output = await load(new URL("https://example.com/openapi"), {
          async fetch() {
            return new Response(stringifyYaml(exampleSchema), {
              headers: { "Content-Type": "application/yaml" },
            });
          },
        });
        expect(output["."].schema).toEqual(exampleSchema);
      });
      // Regression test for https://github.com/drwpow/openapi-typescript/issues/988
      test("type deduced from Content-Type header, in lowercase", async () => {
        const output = await load(new URL("https://example.com/openapi"), {
          async fetch() {
            return new Response(stringifyYaml(exampleSchema), {
              headers: { "content-type": "application/yaml" },
            });
          },
        });
        expect(output["."].schema).toEqual(exampleSchema);
      });
    });
  });
});

const exampleSchema = {
  openapi: "3.1.0",
  paths: {
    "/foo": {
      get: {},
    },
  },
};

async function load(
  schema: URL | Subschema | Readable,
  options?: Partial<LoadOptions>
): Promise<{ [url: string]: Subschema }> {
  return internalLoad(schema, {
    rootURL: schema as URL,
    schemas: {},
    urlCache: new Set(),
    fetch: vi.fn(unidiciFetch),
    additionalProperties: false,
    emptyObjectsUnknown: false,
    alphabetize: false,
    defaultNonNullable: false,
    discriminators: {},
    immutableTypes: false,
    indentLv: 0,
    operations: {},
    parameters: {},
    pathParamsAsTypes: false,
    postTransform: undefined,
    silent: true,
    supportArrayLength: false,
    transform: undefined,
    ...options,
  });
}
