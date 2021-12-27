const { expect } = require("chai");
const { execSync } = require("child_process");
const eol = require("eol");
const fs = require("fs");
const path = require("path");
const yaml = require("js-yaml");
const { default: openapiTS } = require("../../dist/cjs/index.js");

const cmd = `node ../../bin/cli.js`;
const cwd = __dirname;
const schemas = fs.readdirSync(path.join(cwd, "specs"));

describe("cli", () => {
  schemas.forEach((schema) => {
    const filename = schema.replace(".yaml", ".ts");

    it(`reads ${schema} spec (v2) from file`, async () => {
      execSync(`${cmd} specs/${schema} -o generated/${filename} --prettier-config .prettierrc`, { cwd });
      const generated = fs.readFileSync(path.join(cwd, "generated", filename), "utf8");
      const expected = eol.lf(fs.readFileSync(path.join(cwd, "expected", filename), "utf8"));
      expect(generated).to.equal(expected);
    });

    it(`reads ${schema} spec (v2) from file (immutable types)`, async () => {
      const filename = schema.replace(".yaml", ".immutable.ts");

      execSync(`${cmd} specs/${schema} -o generated/${filename} --prettier-config .prettierrc --immutable-types`, {
        cwd,
      });
      const generated = fs.readFileSync(path.join(cwd, "generated", filename), "utf8");
      const expected = eol.lf(fs.readFileSync(path.join(cwd, "expected", filename), "utf8"));
      expect(generated).to.equal(expected);
    });
  });

  it("reads spec (v2) from remote resource", async () => {
    execSync(
      `${cmd} https://raw.githubusercontent.com/drwpow/openapi-typescript/main/test/v2/specs/manifold.yaml -o generated/http.ts`,
      { cwd }
    );
    const generated = fs.readFileSync(path.join(cwd, "generated", "http.ts"), "utf8");
    const expected = eol.lf(fs.readFileSync(path.join(cwd, "expected", "http.ts"), "utf8"));
    expect(generated).to.equal(expected);
  });
});

describe("json", () => {
  schemas.forEach((schema) => {
    it(`reads ${schema} from JSON`, async () => {
      const schemaYAML = fs.readFileSync(path.join(cwd, "specs", schema), "utf8");
      const expected = eol.lf(fs.readFileSync(path.join(cwd, "expected", schema.replace(".yaml", ".ts")), "utf8"));
      const generated = await openapiTS(yaml.load(schemaYAML), {
        prettierConfig: path.join(cwd, "..','..','.prettierrc"),
      });
      expect(generated).to.equal(expected);
    });
  });
});
