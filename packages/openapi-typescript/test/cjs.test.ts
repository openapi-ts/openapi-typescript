/* eslint-disable @typescript-eslint/no-var-requires */

// important: MUST use require()!
const fs = require("node:fs");
const { fileURLToPath, URL } = require("node:url");
const openapiTS = require("../dist/index.cjs");
const yaml = require("js-yaml");

describe("CJS bundle", () => {
  it("basic", async () => {
    const input = yaml.load(fs.readFileSync(new URL("../examples/stripe-api.yaml", import.meta.url), "utf8"));
    const output = await openapiTS(input);
    expect(output).toMatchFileSnapshot(fileURLToPath(new URL("../examples/stripe-api.ts", import.meta.url)));
  });
});
