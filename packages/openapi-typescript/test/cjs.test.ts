/* eslint-disable @typescript-eslint/no-var-requires */

// important: MUST use require()!
const { fileURLToPath } = require("node:url");
const openapiTS = require("../dist/index.cjs");

describe("CJS bundle", () => {
  it("basic", async () => {
    const output = await openapiTS(
      new URL("../examples/stripe-api.yaml", import.meta.url),
    );
    expect(output).toMatchFileSnapshot(
      fileURLToPath(new URL("../examples/stripe-api.ts", import.meta.url)),
    );
  });
});
