import eol from "eol";
import fs from "fs";
import path from "path";
import openapiTS from "../../src/index";

describe("remote $refs", () => {
  it("resolves remote $refs", async () => {
    const generated = await openapiTS(path.join(__dirname, "fixtures", "remote-schema", "spec.yml"));
    const expected = eol.lf(fs.readFileSync(path.join(__dirname, "expected", "remote-schema.ts"), "utf8"));
    expect(generated).toBe(expected);
  });
});
