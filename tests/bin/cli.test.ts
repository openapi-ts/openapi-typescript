import fs from "fs";
import path from "path";
import { execSync } from "child_process";

// Note(drew): OpenAPI support is already well-tested in v2/index.test.ts and
// v3/index.test.ts. So this file is mainly for testing other flags.

describe("cli", () => {
  it("--prettier-config (JSON)", async () => {
    execSync(
      `../../bin/cli.js specs/petstore.yaml -o generated/prettier-json.ts --prettier-config fixtures/.prettierrc`,
      { cwd: __dirname }
    );
    const [generated, expected] = await Promise.all([
      fs.promises.readFile(path.join(__dirname, "generated", "prettier-json.ts"), "utf8"),
      fs.promises.readFile(path.join(__dirname, "expected", "prettier-json.ts"), "utf8"),
    ]);
    expect(generated).toBe(expected);
  });

  it("--prettier-config (.js)", async () => {
    execSync(
      `../../bin/cli.js specs/petstore.yaml -o generated/prettier-js.ts --prettier-config fixtures/prettier.config.js`,
      { cwd: __dirname }
    );
    const [generated, expected] = await Promise.all([
      fs.promises.readFile(path.join(__dirname, "generated", "prettier-js.ts"), "utf8"),
      fs.promises.readFile(path.join(__dirname, "expected", "prettier-js.ts"), "utf8"),
    ]);
    expect(generated).toBe(expected);
  });

  it("stdout", async () => {
    const expected = fs.readFileSync(path.join(__dirname, "expected", "stdout.ts"), "utf8");
    const generated = execSync(`../../bin/cli.js specs/petstore.yaml`, { cwd: __dirname });
    expect(generated.toString("utf8")).toBe(expected);
  });

  it("supports glob paths", async () => {
    execSync(`../../bin/cli.js "specs/*.yaml" -o generated/`, { cwd: __dirname }); // Quotes are necessary because shells like zsh treats glob weirdly
    const [generatedPetstore, expectedPetstore, generatedManifold, expectedManifold] = await Promise.all([
      fs.promises.readFile(path.join(__dirname, "generated", "specs", "petstore.ts"), "utf8"),
      fs.promises.readFile(path.join(__dirname, "expected", "petstore.ts"), "utf8"),
      fs.promises.readFile(path.join(__dirname, "generated", "specs", "manifold.ts"), "utf8"),
      fs.promises.readFile(path.join(__dirname, "expected", "manifold.ts"), "utf8"),
    ]);
    expect(generatedPetstore).toBe(expectedPetstore);
    expect(generatedManifold).toBe(expectedManifold);
  });
});
