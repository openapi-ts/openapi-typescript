import fs from "fs";
import path from "path";
import { execSync } from "child_process";

// Note(drew): OpenAPI support is already well-tested in v2/index.test.ts and
// v3/index.test.ts. So this file is mainly for testing other flags.

const PETSTORE_SCHEMA = fs.readFileSync(path.join(__dirname, "expected", "petstore.ts"), "utf8");

describe("cli", () => {
  it("--prettier-config (JSON)", () => {
    execSync(
      `../../pkg/bin/cli.js specs/petstore.yaml -o generated/petstore.ts --prettier-config fixtures/.prettierrc`,
      {
        cwd: __dirname,
      }
    );
    const generated = fs.readFileSync(path.join(__dirname, "generated", "petstore.ts"), "utf8");
    expect(generated).toBe(PETSTORE_SCHEMA);
  });

  it("--prettier-config (.js)", () => {
    execSync(
      `../../pkg/bin/cli.js specs/petstore.yaml -o generated/petstore.ts --prettier-config fixtures/prettier.config.js`,
      {
        cwd: __dirname,
      }
    );
    const generated = fs.readFileSync(path.join(__dirname, "generated", "petstore.ts"), "utf8");
    expect(generated).toBe(PETSTORE_SCHEMA);
  });

  it("stdin -> stdout", () => {
    const result = execSync(`../../pkg/bin/cli.js`, { cwd: __dirname, input: PETSTORE_SCHEMA });
    console.log(result.toString("utf-8"));
    expect(result.toString("utf-8")).toBe(PETSTORE_SCHEMA);
  });
});
