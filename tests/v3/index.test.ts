import fs from "fs";
import path from "path";
import { execSync } from "child_process";

const schemas = fs.readdirSync(path.join(__dirname, "specs"));

describe("cli", () => {
  schemas.forEach((schema) => {
    const output = schema.replace(/\ya?ml$/i, "ts");
    it(`reads ${schema} spec (v3) from file`, () => {
      execSync(`../../pkg/bin/cli.js specs/${schema} -o generated/${output}`, {
        cwd: __dirname,
      });
      const expected = fs.readFileSync(path.join(__dirname, "expected", output), "utf8");
      const generated = fs.readFileSync(path.join(__dirname, "generated", output), "utf8");
      expect(generated).toBe(expected);
    });
  });

  it("reads spec (v3) from remote resource", () => {
    execSync(
      "../../pkg/bin/cli.js https://raw.githubusercontent.com/drwpow/openapi-typescript/main/tests/v3/specs/manifold.yaml -o generated/http.ts",
      {
        cwd: __dirname,
      }
    );
    const expected = fs.readFileSync(path.join(__dirname, "expected", "http.ts"), "utf8");
    const generated = fs.readFileSync(path.join(__dirname, "generated", "http.ts"), "utf8");
    expect(generated).toBe(expected);
  });
});
