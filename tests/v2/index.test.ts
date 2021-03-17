import { execSync } from "child_process";
import { readdirSync, readFileSync } from "fs";
import { join } from "path";

const schemas = readdirSync(join(__dirname, "specs"));

// simple snapshot tests with valid schemas to make sure it can generally parse & generate output
describe("cli", () => {
  schemas.forEach((schema) => {
    const output = schema.replace(".yaml", ".ts");

    it(`reads ${schema} spec (v2) from file`, () => {
      execSync(`../../bin/cli.js specs/${schema} -o generated/${output} --prettier-config .prettierrc`, {
        cwd: __dirname,
      });
      const expected = readFileSync(join(__dirname, "expected", output), "utf8");
      const generated = readFileSync(join(__dirname, "generated", output), "utf8");
      expect(generated).toBe(expected);
    });

    it(`reads ${schema} spec (v2) from file`, () => {
      const output = schema.replace(".yaml", ".immutable.ts");

      execSync(
        `../../bin/cli.js specs/${schema} -o generated/${output} --prettier-config .prettierrc --immutable-types`,
        {
          cwd: __dirname,
        }
      );

      const expected = readFileSync(join(__dirname, "expected", output), "utf8");
      const generated = readFileSync(join(__dirname, "generated", output), "utf8");
      expect(generated).toBe(expected);
    });
  });

  it("reads spec (v2) from remote resource", () => {
    execSync(
      "../../bin/cli.js https://raw.githubusercontent.com/drwpow/openapi-typescript/main/tests/v2/specs/manifold.yaml -o generated/http.ts",
      {
        cwd: __dirname,
      }
    );
    const expected = readFileSync(join(__dirname, "expected", "http.ts"), "utf8");
    const generated = readFileSync(join(__dirname, "generated", "http.ts"), "utf8");
    expect(generated).toBe(expected);
  });
});
