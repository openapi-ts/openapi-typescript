import fs from "fs";
import path from "path";
import { execSync } from "child_process";

// simple snapshot tests with valid schemas to make sure it can generally parse & generate output
describe("cli", () => {
  ["stripe", "manifold", "petstore"].forEach((file) => {
    it(`reads ${file} spec (v2) from file`, () => {
      execSync(`../../pkg/bin/cli.js specs/${file}.yaml -o generated/${file}.ts`, {
        cwd: __dirname,
      });
      const expected = fs.readFileSync(path.join(__dirname, "expected", `${file}.ts`), "utf8");
      const generated = fs.readFileSync(path.join(__dirname, "generated", `${file}.ts`), "utf8");
      expect(generated).toBe(expected);
    });
  });

  it("reads spec (v2) from remote resource", () => {
    execSync(
      "../../pkg/bin/cli.js https://raw.githubusercontent.com/drwpow/openapi-typescript/main/tests/v2/specs/manifold.yaml -o generated/http.ts",
      {
        cwd: __dirname,
      }
    );
    const expected = fs.readFileSync(path.join(__dirname, "expected", "http.ts"), "utf8");
    const generated = fs.readFileSync(path.join(__dirname, "generated", "http.ts"), "utf8");
    expect(generated).toBe(expected);
  });
});
