import fs from "fs";
import path from "path";
import { execSync } from "child_process";

describe("cli", () => {
  ["github", "stripe", "manifold", "petstore"].forEach((file) => {
    it(`reads ${file} spec (v3) from file`, () => {
      execSync(`../../pkg/bin/cli.js specs/${file}.yaml -o generated/${file}.ts`, {
        cwd: __dirname,
      });
      const expected = fs.readFileSync(path.join(__dirname, "expected", `${file}.ts`), "utf8");
      const generated = fs.readFileSync(path.join(__dirname, "generated", `${file}.ts`), "utf8");
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
