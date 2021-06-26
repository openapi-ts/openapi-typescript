import fs from "fs";
import path from "path";
import { execSync } from "child_process";
import { sanitizeLB } from "../test-utils";

// Note(drew): OpenAPI support is already well-tested in v2/index.test.ts and
// v3/index.test.ts. So this file is mainly for testing other flags.

const cmd = `node ../../bin/cli.js`;

describe("cli", () => {
  it("--prettier-config (JSON)", async () => {
    execSync(`${cmd} specs/petstore.yaml -o generated/prettier-json.ts --prettier-config fixtures/.prettierrc`, {
      cwd: __dirname,
    });
    const [generated, expected] = await Promise.all([
      fs.promises.readFile(path.join(__dirname, "generated", "prettier-json.ts"), "utf8"),
      fs.promises.readFile(path.join(__dirname, "expected", "prettier-json.ts"), "utf8"),
    ]);
    expect(generated).toBe(sanitizeLB(expected));
  });

  it("--prettier-config (.js)", async () => {
    execSync(`${cmd} specs/petstore.yaml -o generated/prettier-js.ts --prettier-config fixtures/prettier.config.js`, {
      cwd: __dirname,
    });
    const [generated, expected] = await Promise.all([
      fs.promises.readFile(path.join(__dirname, "generated", "prettier-js.ts"), "utf8"),
      fs.promises.readFile(path.join(__dirname, "expected", "prettier-js.ts"), "utf8"),
    ]);
    expect(generated).toBe(sanitizeLB(expected));
  });

  it("stdout", async () => {
    const expected = fs.readFileSync(path.join(__dirname, "expected", "stdout.ts"), "utf8");
    const generated = execSync(`${cmd} specs/petstore.yaml`, { cwd: __dirname });
    expect(generated.toString("utf8")).toBe(sanitizeLB(expected));
  });

  it("supports glob paths", async () => {
    execSync(`${cmd} "specs/*.yaml" -o generated/`, { cwd: __dirname }); // Quotes are necessary because shells like zsh treats glob weirdly
    const [generatedPetstore, expectedPetstore, generatedManifold, expectedManifold] = await Promise.all([
      fs.promises.readFile(path.join(__dirname, "generated", "specs", "petstore.ts"), "utf8"),
      fs.promises.readFile(path.join(__dirname, "expected", "petstore.ts"), "utf8"),
      fs.promises.readFile(path.join(__dirname, "generated", "specs", "manifold.ts"), "utf8"),
      fs.promises.readFile(path.join(__dirname, "expected", "manifold.ts"), "utf8"),
    ]);
    expect(generatedPetstore).toBe(sanitizeLB(expectedPetstore));
    expect(generatedManifold).toBe(sanitizeLB(expectedManifold));
  });
});
