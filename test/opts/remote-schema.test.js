const { expect } = require("chai");
const fs = require("fs");
const eol = require("eol");
const path = require("path");
const { default: openapiTS } = require("../../dist/cjs/index.js");

describe("remote $refs", () => {
  it("resolves remote $refs", async () => {
    const generated = await openapiTS(path.join(__dirname, "fixtures", "remote-schema", "spec.yml"));
    const expected = eol.lf(fs.readFileSync(path.join(__dirname, "expected", "remote-schema.ts"), "utf8"));
    expect(generated).to.equal(expected);
  });
});
