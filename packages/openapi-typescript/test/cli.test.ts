import { execa } from "execa";
import fs from "node:fs";
import os from "node:os";
import { fileURLToPath } from "node:url";
import type { TestCase } from "./test-helpers.js";

const root = new URL("../", import.meta.url);
const cwd = os.platform() === "win32" ? fileURLToPath(root) : root; // execa bug: fileURLToPath required on Windows
const cmd = "./bin/cli.js";
const TIMEOUT = 90000;

describe("CLI", () => {
  const tests: TestCase<any, any>[] = [
    [
      "snapshot > GitHub API",
      {
        given: ["./examples/github-api.yaml"],
        want: new URL("./examples/github-api.ts", root),
        ci: { timeout: TIMEOUT },
      },
    ],
    [
      "snapshot > GitHub API (immutable)",
      {
        given: ["./examples/github-api.yaml", "--immutable"],
        want: new URL("./examples/github-api-immutable.ts", root),
        ci: { timeout: TIMEOUT },
      },
    ],
    [
      "snapshot > GitHub API (types + immutable)",
      {
        given: ["./examples/github-api.yaml", "--immutable", "--export-type"],
        want: new URL("./examples/github-api-export-type-immutable.ts", root),
        ci: { timeout: TIMEOUT },
      },
    ],
    [
      "snapshot > GitHub API (next)",
      {
        given: ["./examples/github-api-next.yaml"],
        want: new URL("./examples/github-api-next.ts", root),
        ci: { timeout: TIMEOUT },
      },
    ],
    [
      "snapshot > Octokit GHES 3.6 Diff to API",
      {
        given: ["./examples/octokit-ghes-3.6-diff-to-api.json"],
        want: new URL("./examples/octokit-ghes-3.6-diff-to-api.ts", root),
        ci: { timeout: TIMEOUT },
      },
    ],
    [
      "snapshot > Stripe API",
      {
        given: ["./examples/stripe-api.yaml"],
        want: new URL("./examples/stripe-api.ts", root),
        ci: { timeout: TIMEOUT },
      },
    ],
    [
      "snapshot > DigitalOcean",
      {
        given: ["./examples/digital-ocean-api/DigitalOcean-public.v2.yaml"],
        want: new URL("./examples/digital-ocean-api.ts", root),
        ci: { timeout: TIMEOUT },
      },
    ],
  ];

  for (const [testName, { given, want, ci }] of tests) {
    test.skipIf(ci?.skipIf)(
      testName,
      async () => {
        const { stdout } = await execa(cmd, given, { cwd });
        if (want instanceof URL) {
          expect(stdout).toMatchFileSnapshot(fileURLToPath(want));
        } else {
          expect(stdout).toBe(want + "\n");
        }
      },
      ci?.timeout,
    );
  }

  test(
    "stdin",
    async () => {
      const input = fs.readFileSync(
        new URL("./examples/stripe-api.yaml", root),
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

  describe("Redocly config", () => {
    // TODO: why won’t this run on Windows?
    test.skipIf(os.platform() === "win32")("automatic config", async () => {
      /* eslint-disable @typescript-eslint/no-shadow */

      // note: we have to change the cwd here for the automatic config to pick up properly
      const root = new URL("./fixtures/redocly/", import.meta.url);
      const cwd = os.platform() === "win32" ? fileURLToPath(root) : root;

      await execa("../../../bin/cli.js", { cwd });
      for (const schema of ["a", "b", "c"]) {
        expect(
          fs.readFileSync(new URL(`./output/${schema}.ts`, root), "utf8"),
        ).toMatchFileSnapshot(
          fileURLToPath(new URL("../../../examples/simple-example.ts", root)),
        );
      }
      /* eslint-enable @typescript-eslint/no-shadow */
    });

    test("--redoc config", async () => {
      await execa(cmd, ["--redoc", "test/fixtures/redocly-flag/redocly.yaml"], {
        cwd,
      });
      for (const schema of ["a", "b", "c"]) {
        expect(
          fs.readFileSync(
            new URL(`./test/fixtures/redocly-flag/output/${schema}.ts`, root),
            "utf8",
          ),
        ).toMatchFileSnapshot(
          fileURLToPath(new URL("./examples/simple-example.ts", root)),
        );
      }
    });
  });
});
