import fs from "fs";
import path from "path";
import { execSync } from "child_process";

// Note(drew): OpenAPI support is already well-tested in v2/index.test.ts and
// v3/index.test.ts. So this file is mainly for testing other flags.

describe("cli", () => {
  it("--prettier-config (JSON)", () => {
    const expected = fs.readFileSync(path.join(__dirname, "expected", "prettier-json.ts"), "utf8");
    execSync(
      `../../bin/cli.js specs/petstore.yaml -o generated/prettier-json.ts --prettier-config fixtures/.prettierrc`,
      { cwd: __dirname }
    );
    const output = fs.readFileSync(path.join(__dirname, "generated", "prettier-json.ts"), "utf8");
    expect(output).toBe(expected);
  });

  it("--prettier-config (.js)", () => {
    const expected = fs.readFileSync(path.join(__dirname, "expected", "prettier-js.ts"), "utf8");
    execSync(
      `../../bin/cli.js specs/petstore.yaml -o generated/prettier-js.ts --prettier-config fixtures/prettier.config.js`,
      { cwd: __dirname }
    );
    const output = fs.readFileSync(path.join(__dirname, "generated", "prettier-js.ts"), "utf8");
    expect(output).toBe(expected);
  });

  it("stdout", () => {
    const expected = fs.readFileSync(path.join(__dirname, "expected", "stdout.ts"), "utf8");
    const result = execSync(`../../bin/cli.js specs/petstore.yaml`, { cwd: __dirname });
    expect(result.toString("utf8")).toBe(expected);
  });

  it("supports glob paths", () => {
    const expectedPetstore = fs.readFileSync(path.join(__dirname, "expected", "petstore.ts"), "utf8");
    const expectedManifold = fs.readFileSync(path.join(__dirname, "expected", "manifold.ts"), "utf8");
    execSync(`../../bin/cli.js \"specs/*.yaml\" -o generated/`, { cwd: __dirname }); // Quotes are necessary because shells like zsh treats glob weirdly
    const outputPetstore = fs.readFileSync(path.join(__dirname, "generated", "petstore.ts"), "utf8");
    const outputManifold = fs.readFileSync(path.join(__dirname, "generated", "manifold.ts"), "utf8");
    expect(outputPetstore).toBe(expectedPetstore);
    expect(outputManifold).toBe(expectedManifold);
  });
});
