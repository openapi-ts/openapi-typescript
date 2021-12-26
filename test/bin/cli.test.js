const { expect } = require("chai");
const eol = require("eol");
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

// Note(drew): OpenAPI support is already well-tested in v2/index.test.ts and
// v3/index.test.ts. Only use these tests for testing CLI flags.

const cmd = `node ../../bin/cli.js`;
const cwd = __dirname;

describe("cli", () => {
  it("--prettier-config (JSON)", async () => {
    execSync(`${cmd} specs/petstore.yaml -o generated/prettier-json.ts --prettier-config fixtures/.prettierrc`, {
      cwd,
    });
    const generated = fs.readFileSync(path.join(cwd, "generated", "prettier-json.ts"), "utf8");
    const expected = eol.lf(fs.readFileSync(path.join(cwd, "expected", "prettier-json.ts"), "utf8"));
    expect(generated).to.equal(expected);
  });

  it("--prettier-config (.js)", async () => {
    execSync(`${cmd} specs/petstore.yaml -o generated/prettier-js.ts --prettier-config fixtures/prettier.config.js`, {
      cwd,
    });
    const generated = fs.readFileSync(path.join(cwd, "generated", "prettier-js.ts"), "utf8");
    const expected = eol.lf(fs.readFileSync(path.join(cwd, "expected", "prettier-js.ts"), "utf8"));
    expect(generated).to.equal(expected);
  });

  it("stdout", async () => {
    const generated = execSync(`${cmd} specs/petstore.yaml`, { cwd });
    const expected = eol.lf(fs.readFileSync(path.join(cwd, "expected", "stdout.ts"), "utf8"));
    expect(generated.toString("utf8")).to.equal(expected);
  });

  it("supports glob paths", async () => {
    execSync(`${cmd} "specs/*.yaml" -o generated/`, { cwd }); // Quotes are necessary because shells like zsh treats glob weirdly
    const generatedPetstore = fs.readFileSync(path.join(cwd, "generated", "specs", "petstore.ts"), "utf8");
    const expectedPetstore = eol.lf(fs.readFileSync(path.join(cwd, "expected", "specs", "petstore.ts"), "utf8"));
    expect(generatedPetstore).to.equal(expectedPetstore);

    const generatedManifold = fs.readFileSync(path.join(cwd, "generated", "specs", "manifold.ts"), "utf8");
    const expectedManifold = eol.lf(fs.readFileSync(path.join(cwd, "expected", "specs", "manifold.ts"), "utf8"));
    expect(generatedManifold).to.equal(expectedManifold);
  });

  it("--header", async () => {
    // note: we can’t check headers passed to fetch() without mocking (and overcomplicating/flake-ifying the tests). simply testing the parsing is the biggest win.
    expect(() =>
      execSync(
        `${cmd} https://raw.githubusercontent.com/drwpow/openapi-typescript/main/tests/v2/specs/manifold.yaml --header "x-openapi-format:json" --header "x-openapi-version:3.0.1"`,
        { cwd }
      ).toString("utf8")
    ).not.to.throw();
  });

  it("--headersObject", async () => {
    // note: same as above—testing the parser is the biggest win; values can be tested trivially with manual debugging
    expect(() => {
      execSync(
        `${cmd} https://raw.githubusercontent.com/drwpow/openapi-typescript/main/tests/v2/specs/manifold.yaml --headersObject "{\\"x-boolean\\":true, \\"x-number\\":3.0, \\"x-string\\": \\"openapi\\"}"`,
        { cwd }
      );
    }).not.to.throw();
  });
});
