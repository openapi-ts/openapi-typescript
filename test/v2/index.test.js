import { expect } from "chai";
import { execSync } from "child_process";
import eol from "eol";
import fs from "fs";
import yaml from "js-yaml";
import { fileURLToPath } from "url";
import openapiTS from "../../dist/index.js";

const cmd = `node ../../bin/cli.js`;
const cwd = new URL(".", import.meta.url);
const schemas = fs.readdirSync(new URL("./specs/", cwd));

describe("cli", () => {
  schemas.forEach((schema) => {
    const filename = schema.replace(".yaml", ".ts");

    it(`reads ${schema} spec (v2) from file`, async () => {
      execSync(`${cmd} specs/${schema} -o generated/${filename} --prettier-config fixtures/.prettierrc`, { cwd });
      const generated = fs.readFileSync(new URL(`./generated/${filename}`, cwd), "utf8");
      const expected = eol.lf(fs.readFileSync(new URL(`./expected/${filename}`, cwd), "utf8"));
      expect(generated).to.equal(expected);
    });

    it(`reads ${schema} spec (v2) from file (immutable types)`, async () => {
      const filename = schema.replace(".yaml", ".immutable.ts");

      execSync(
        `${cmd} specs/${schema} -o generated/${filename} --prettier-config fixtures/.prettierrc --immutable-types`,
        {
          cwd,
        }
      );
      const generated = fs.readFileSync(new URL(`./generated/${filename}`, cwd), "utf8");
      const expected = eol.lf(fs.readFileSync(new URL(`./expected/${filename}`, cwd), "utf8"));
      expect(generated).to.equal(expected);
    });
  });

  it("reads spec (v2) from remote resource", async () => {
    execSync(
      `${cmd} https://raw.githubusercontent.com/drwpow/openapi-typescript/main/test/v2/specs/manifold.yaml -o generated/http.ts`,
      { cwd }
    );
    const generated = fs.readFileSync(new URL("./generated/http.ts", cwd), "utf8");
    const expected = eol.lf(fs.readFileSync(new URL("./expected/http.ts", cwd), "utf8"));
    expect(generated).to.equal(expected);
  });
});

describe("json", () => {
  schemas.forEach((schema) => {
    it(`reads ${schema} from JSON`, async () => {
      const schemaYAML = fs.readFileSync(new URL(`./specs/${schema}`, cwd), "utf8");
      const expected = eol.lf(fs.readFileSync(new URL(`./expected/${schema.replace(".yaml", ".ts")}`, cwd), "utf8"));
      const generated = await openapiTS(yaml.load(schemaYAML), {
        prettierConfig: fileURLToPath(new URL("fixtures/.prettierrc", cwd)),
      });
      expect(generated).to.equal(expected);
    });
  });
});
