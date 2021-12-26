import fs from "fs";
import path from "path";
import { execSync } from "child_process";
import { sanitizeLB } from "../test-utils";

// Note(drew): OpenAPI support is already well-tested in v2/index.test.ts and
// v3/index.test.ts. So this file is mainly for testing other flags.

const cmd = `node ../../bin/cli.js`;
const cwd = __dirname;

describe("cli", () => {
  it("--prettier-config (JSON)", async () => {
    execSync(`${cmd} specs/petstore.yaml -o generated/prettier-json.ts --prettier-config fixtures/.prettierrc`, {
      cwd,
    });
    const [generated, expected] = await Promise.all([
      fs.promises.readFile(path.join(__dirname, "generated", "prettier-json.ts"), "utf8"),
      fs.promises.readFile(path.join(__dirname, "expected", "prettier-json.ts"), "utf8"),
    ]);

    expect(generated).toBe(sanitizeLB(expected));
  });

  it("--prettier-config (.js)", async () => {
    execSync(`${cmd} specs/petstore.yaml -o generated/prettier-js.ts --prettier-config fixtures/prettier.config.js`, {
      cwd,
    });
    const [generated, expected] = await Promise.all([
      fs.promises.readFile(path.join(__dirname, "generated", "prettier-js.ts"), "utf8"),
      fs.promises.readFile(path.join(__dirname, "expected", "prettier-js.ts"), "utf8"),
    ]);
    expect(generated).toBe(sanitizeLB(expected));
  });

  it("stdout", async () => {
    const expected = fs.readFileSync(path.join(__dirname, "expected", "stdout.ts"), "utf8");
    const generated = execSync(`${cmd} specs/petstore.yaml`, { cwd });
    expect(generated.toString("utf8")).toBe(sanitizeLB(expected));
  });

  it("supports glob paths", async () => {
    execSync(`${cmd} "specs/*.yaml" -o generated/`, { cwd }); // Quotes are necessary because shells like zsh treats glob weirdly
    const [generatedPetstore, expectedPetstore, generatedManifold, expectedManifold] = await Promise.all([
      fs.promises.readFile(path.join(__dirname, "generated", "specs", "petstore.ts"), "utf8"),
      fs.promises.readFile(path.join(__dirname, "expected", "specs", "petstore.ts"), "utf8"),
      fs.promises.readFile(path.join(__dirname, "generated", "specs", "manifold.ts"), "utf8"),
      fs.promises.readFile(path.join(__dirname, "expected", "specs", "manifold.ts"), "utf8"),
    ]);
    expect(generatedPetstore).toBe(sanitizeLB(expectedPetstore));
    expect(generatedManifold).toBe(sanitizeLB(expectedManifold));
  });

  it("--header", async () => {
    // note: we can’t check headers passed to fetch() without mocking (and overcomplicating/flake-ifying the tests). simply testing the parsing is the biggest win.
    expect(() =>
      execSync(
        `${cmd} https://raw.githubusercontent.com/drwpow/openapi-typescript/main/tests/v2/specs/manifold.yaml --header "x-openapi-format:json" --header "x-openapi-version:3.0.1"`,
        { cwd }
      ).toString("utf8")
    ).not.toThrow();
  });

  it("--headersObject", async () => {
    // note: same as above—testing the parser is the biggest win; values can be tested trivially with manual debugging
    expect(() => {
      execSync(
        `${cmd} https://raw.githubusercontent.com/drwpow/openapi-typescript/main/tests/v2/specs/manifold.yaml --headersObject "{\\"x-boolean\\":true, \\"x-number\\":3.0, \\"x-string\\": \\"openapi\\"}"`,
        { cwd }
      );
    }).not.toThrow();
  });
});
