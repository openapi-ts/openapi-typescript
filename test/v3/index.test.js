import { expect } from "chai";
import { execSync } from "child_process";
import eol from "eol";
import fs from "fs";
import yaml from "js-yaml";
import openapiTS from "../../dist/index.js";
import { fileURLToPath } from "url";

const cmd = `node ../../bin/cli.js`;
const cwd = new URL(".", import.meta.url);
const schemas = fs.readdirSync(new URL("./specs/", cwd));

describe("cli", () => {
  schemas.forEach((schema) => {
    it(`reads ${schema} spec (v3) from file`, async () => {
      const filename = schema.replace(/\.(json|yaml)$/, ".ts");

      execSync(`${cmd} specs/${schema} -o generated/${filename} --prettier-config fixtures/.prettierrc`, { cwd });
      const generated = fs.readFileSync(new URL(`./generated/${filename}`, cwd), "utf8");
      const expected = eol.lf(fs.readFileSync(new URL(`./expected/${filename}`, cwd), "utf8"));
      expect(generated).to.equal(expected);
    });

    it(`reads ${schema} spec (v3) from file (additional properties)`, async () => {
      const filename = schema.replace(/\.(json|yaml)/, ".additional.ts");

      execSync(
        `${cmd} specs/${schema} -o generated/${filename} --prettier-config fixtures/.prettierrc --additional-properties`,
        { cwd }
      );
      const generated = fs.readFileSync(new URL(`./generated/${filename}`, cwd), "utf8");
      const expected = eol.lf(fs.readFileSync(new URL(`./expected/${filename}`, cwd), "utf8"));
      expect(generated).to.equal(expected);
    });

    it(`reads ${schema} spec (v3) from file (immutable types)`, async () => {
      const filename = schema.replace(/\.(json|yaml)/, ".immutable.ts");

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

    it(`reads ${schema} spec (v3) from file (exported type instead of interface)`, async () => {
      const filename = schema.replace(/\.(json|yaml)/, ".exported-type.ts");

      execSync(`${cmd} specs/${schema} -o generated/${filename} --prettier-config fixtures/.prettierrc --export-type`, {
        cwd,
      });
      const generated = fs.readFileSync(new URL(`./generated/${filename}`, cwd), "utf8");
      const expected = eol.lf(fs.readFileSync(new URL(`./expected/${filename}`, cwd), "utf8"));
      expect(generated).to.equal(expected);
    });

    it(`reads ${schema} spec (v3) from file (generate tuples using array minItems / maxItems)`, async () => {
      const filename = schema.replace(/\.(json|yaml)/, ".support-array-length.ts");

      execSync(
        `${cmd} specs/${schema} -o generated/${filename} --prettier-config fixtures/.prettierrc --support-array-length`,
        {
          cwd,
        }
      );
      const generated = fs.readFileSync(new URL(`./generated/${filename}`, cwd), "utf8");
      const expected = eol.lf(fs.readFileSync(new URL(`./expected/${filename}`, cwd), "utf8"));
      expect(generated).to.equal(expected);
    });
  });

  it("reads spec (v3) from remote resource", async () => {
    execSync(
      `${cmd} https://raw.githubusercontent.com/drwpow/openapi-typescript/main/test/v3/specs/manifold.yaml -o generated/http.ts`,
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
      const spec = fs.readFileSync(new URL(`./specs/${schema}`, cwd), "utf8");
      const generated = await openapiTS(yaml.load(spec), {
        prettierConfig: fileURLToPath(new URL("fixtures/.prettierrc", cwd)),
      });
      const expected = eol.lf(
        fs.readFileSync(new URL(`./expected/${schema.replace(/\.(json|yaml)$/, ".ts")}`, cwd), "utf8")
      );
      expect(generated).to.equal(expected);
    });
  });
});
