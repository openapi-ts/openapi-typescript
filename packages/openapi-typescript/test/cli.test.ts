import { execa } from "execa";
import glob from "fast-glob";
import fs from "node:fs";
import os from "node:os";
import path from "node:path/posix"; // prevent issues with `\` on windows
import { fileURLToPath } from "node:url";
import { TestCase } from "./test-helpers.js";

const root = new URL("../", import.meta.url);
const cwd = os.platform() === "win32" ? fileURLToPath(root) : root; // execa bug: fileURLToPath required on Windows
const cmd = "./bin/cli.js";
const inputDir = "test/fixtures/cli-outputs/";
const outputDir = path.join(inputDir, "out/");
const TIMEOUT = 90000;

// fast-glob does not sort results
async function getOutputFiles() {
  return (await glob("**", { cwd: outputDir })).sort((a, b) =>
    a.localeCompare(b, undefined, { numeric: true }),
  );
}

describe("CLI", () => {
  const tests: TestCase<any, any>[] = [
    [
      "snapshot > GitHub API",
      {
        given: "./examples/github-api.yaml",
        want: new URL("./examples/github-api.ts", root),
        ci: { timeout: TIMEOUT },
      },
    ],
    [
      "snapshot > GitHub API (next)",
      {
        given: "./examples/github-api-next.yaml",
        want: new URL("./examples/github-api-next.ts", root),
        ci: { timeout: TIMEOUT },
      },
    ],
    [
      "snapshot > Octokit GHES 3.6 Diff to API",
      {
        given: "./examples/octokit-ghes-3.6-diff-to-api.json",
        want: new URL("./examples/octokit-ghes-3.6-diff-to-api.ts", root),
        ci: { timeout: TIMEOUT },
      },
    ],
    [
      "snapshot > Stripe API",
      {
        given: "./examples/stripe-api.yaml",
        want: new URL("./examples/stripe-api.ts", root),
        ci: { timeout: TIMEOUT },
      },
    ],
    [
      "snapshot > DigitalOcean",
      {
        given: "./examples/digital-ocean-api/DigitalOcean-public.v2.yaml",
        want: new URL("./examples/digital-ocean-api.ts", root),
        ci: {
          timeout: TIMEOUT,
          skipIf:
            process.env.CI_ENV === "macos" || process.env.CI_ENV === "windows", // this test runs too slowly on non-Ubuntu GitHub Actions runners
        },
      },
    ],
  ];

  describe.each(tests)("%s", (_, { given, want, ci }) => {
    test.skipIf(ci?.skipIf)(
      "test",
      async () => {
        let stdout: string;

        // treat URL inputs as stdin (source file)
        if (given instanceof URL) {
          stdout = (
            await execa(cmd, { input: fs.readFileSync(given, "utf8"), cwd })
          ).stdout;
        }
        // otherwise treat inputs as command-line arguments
        else {
          stdout = (await execa(cmd, [given], { cwd })).stdout;
        }

        if (want instanceof URL) {
          expect(stdout).toMatchFileSnapshot(fileURLToPath(want));
        } else {
          expect(stdout).toBe(want + "\n");
        }
      },
      ci?.timeout,
    );
  });

  test(
    "stdin",
    async () => {
      const input = fs.readFileSync(
        new URL("./examples/stripe-api.yaml", root),
        "utf8",
      );
      const { stdout } = await execa(cmd, { input, cwd });
      expect(stdout).toMatchFileSnapshot(
        fileURLToPath(new URL("./examples/stripe-api.ts", root)),
      );
    },
    TIMEOUT,
  );

  describe("flags", () => {
    test("--help", async () => {
      const { stdout } = await execa(cmd, ["--help"], { cwd });
      expect(stdout).toEqual(
        expect.stringMatching(
          /^Usage\n\s+\$ openapi-typescript \[input\] \[options\]/,
        ),
      );
    });

    test("--version", async () => {
      const { stdout } = await execa(cmd, ["--version"], { cwd });
      expect(stdout).toEqual(expect.stringMatching(/^v[\d.]+(-.*)?$/));
    });
  });

  describe("outputs", () => {
    beforeEach(() => {
      fs.rmSync(new URL(outputDir, root), { recursive: true, force: true });
    });

    test("single file to file", async () => {
      const inputFile = path.join(inputDir, "file-a.yaml");
      const outputFile = path.join(outputDir, "file-a.ts");
      await execa(cmd, [inputFile, "--output", outputFile], { cwd });
      const result = await getOutputFiles();
      expect(result).toEqual(["file-a.ts"]);
    });

    test("single file to directory", async () => {
      const inputFile = path.join(inputDir, "file-a.yaml");
      await execa(cmd, [inputFile, "--output", outputDir], { cwd });
      const result = await getOutputFiles();
      expect(result).toEqual(["test/fixtures/cli-outputs/file-a.ts"]);
    });

    test("single file (glob) to file", async () => {
      const inputFile = path.join(inputDir, "*-a.yaml");
      const outputFile = path.join(outputDir, "file-a.ts");
      await execa(cmd, [inputFile, "--output", outputFile], { cwd });
      const result = await getOutputFiles();
      expect(result).toEqual(["file-a.ts"]);
    });

    test("multiple files to file", async () => {
      const inputFile = path.join(inputDir, "*.yaml");
      const outputFile = path.join(outputDir, "file-a.ts");
      await expect(
        execa(cmd, [inputFile, "--output", outputFile], { cwd }),
      ).rejects.toThrow();
    });

    test("multiple files to directory", async () => {
      const inputFile = path.join(inputDir, "*.yaml");
      await execa(cmd, [inputFile, "--output", outputDir], { cwd });
      const result = await getOutputFiles();
      expect(result).toEqual([
        "test/fixtures/cli-outputs/file-a.ts",
        "test/fixtures/cli-outputs/file-b.ts",
      ]);
    });

    test("multiple nested files to directory", async () => {
      const inputFile = path.join(inputDir, "**/*.yaml");
      await execa(cmd, [inputFile, "--output", outputDir], { cwd });
      const result = await getOutputFiles();
      expect(result).toEqual([
        "test/fixtures/cli-outputs/file-a.ts",
        "test/fixtures/cli-outputs/file-b.ts",
        "test/fixtures/cli-outputs/nested/deep/file-e.ts",
        "test/fixtures/cli-outputs/nested/file-c.ts",
        "test/fixtures/cli-outputs/nested/file-d.ts",
      ]);
    });
  });

  describe("Redocly config", () => {
    test("accepts multiple APIs", async () => {
      await execa(cmd, ["--redocly"], { cwd });
      for (const schema of ["a", "b", "c"]) {
        expect(
          fs.readFileSync(
            new URL(`./fixtures/output/${schema}.ts`, import.meta.url),
          ),
        ).toMatchFileSnapshot(
          fileURLToPath(
            new URL("../examples/simple-example.ts", import.meta.url),
          ),
        );
      }
    });
  });
});
