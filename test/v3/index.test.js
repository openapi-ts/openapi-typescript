const { expect } = require("chai");
const { execSync } = require("child_process");
const eol = require("eol");
const fs = require("fs");
const path = require("path");
const yaml = require("js-yaml");
const { default: openapiTS } = require("../../dist/cjs/index.js");

const cmd = `node ../../bin/cli.js`;
const cwd = __dirname;
const schemas = fs.readdirSync(path.join(__dirname, "specs/"));

describe("cli", () => {
  schemas.forEach((schema) => {
    it(`reads ${schema} spec (v3) from file`, async () => {
      const filename = schema.replace(/\.(json|yaml)$/, ".ts");

      execSync(`${cmd} specs/${schema} -o generated/${filename} --prettier-config .prettierrc`, { cwd });
      const generated = fs.readFileSync(path.join(__dirname, "generated", filename), "utf8");
      const expected = eol.lf(fs.readFileSync(path.join(__dirname, "expected", filename), "utf8"));
      expect(generated).to.equal(expected);
    });

    it(`reads ${schema} spec (v3) from file (additional properties)`, async () => {
      const filename = schema.replace(/\.(json|yaml)/, ".additional.ts");

      execSync(
        `${cmd} specs/${schema} -o generated/${filename} --prettier-config .prettierrc --additional-properties`,
        { cwd }
      );
      const generated = fs.readFileSync(path.join(__dirname, "generated", filename), "utf8");
      const expected = eol.lf(fs.readFileSync(path.join(__dirname, "expected", filename), "utf8"));
      expect(generated).to.equal(expected);
    });

    it(`reads ${schema} spec (v3) from file (immutable types)`, async () => {
      const filename = schema.replace(/\.(json|yaml)/, ".immutable.ts");

      execSync(`${cmd} specs/${schema} -o generated/${filename} --prettier-config .prettierrc --immutable-types`, {
        cwd,
      });
      const generated = fs.readFileSync(path.join(__dirname, "generated", filename), "utf8");
      const expected = eol.lf(fs.readFileSync(path.join(__dirname, "expected", filename), "utf8"));
      expect(generated).to.equal(expected);
    });
  });

  it("reads spec (v3) from remote resource", async () => {
    execSync(
      `${cmd} https://raw.githubusercontent.com/drwpow/openapi-typescript/main/test/v3/specs/manifold.yaml -o generated/http.ts`,
      { cwd }
    );
    const generated = fs.readFileSync(path.join(__dirname, "generated", "http.ts"), "utf8");
    const expected = eol.lf(fs.readFileSync(path.join(__dirname, "expected", "http.ts"), "utf8"));
    expect(generated).to.equal(expected);
  });
});

describe("json", () => {
  schemas.forEach((schema) => {
    it(`reads ${schema} from JSON`, async () => {
      const spec = fs.readFileSync(path.join(__dirname, "specs", schema), "utf8");
      const generated = await openapiTS(yaml.load(spec), {
        prettierConfig: path.join(__dirname, "..", "..", ".prettierrc"),
      });
      const expected = eol.lf(
        fs.readFileSync(path.join(__dirname, "expected", schema.replace(/\.(json|yaml)$/, ".ts")), "utf8")
      );
      expect(generated).to.equal(expected);
    });
  });
});
