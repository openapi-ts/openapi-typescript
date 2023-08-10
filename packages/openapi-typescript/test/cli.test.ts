import { execa } from "execa";
import { URL, fileURLToPath } from "node:url";
import os from "node:os";
import { readFile } from "./helpers.js";

const root = new URL("../", import.meta.url);
const cwd = os.platform() === "win32" ? fileURLToPath(root) : root; // execa bug: fileURLToPath required on Windows
const cmd = "./bin/cli.js";
const TIMEOUT = 90000;

describe("CLI", () => {
  // note: the snapshots in index.test.ts test the Node API; these test the CLI
  describe("snapshots", () => {
    test(
      "GitHub API",
      async () => {
        const expected = readFile(new URL("./examples/github-api.ts", root)).trim();
        const { stdout } = await execa(cmd, ["./examples/github-api.yaml"], { cwd });
        expect(stdout).toBe(expected);
      },
      TIMEOUT,
    );
    test(
      "GitHub API (next)",
      async () => {
        const expected = readFile(new URL("./examples/github-api-next.ts", root)).trim();
        const { stdout } = await execa(cmd, ["./examples/github-api-next.yaml"], { cwd });
        expect(stdout).toBe(expected);
      },
      TIMEOUT,
    );
    test(
      "Octokit GHES 3.6 Diff to API",
      async () => {
        const expected = readFile(new URL("./examples/octokit-ghes-3.6-diff-to-api.ts", root)).trim();
        const { stdout } = await execa(cmd, ["./examples/octokit-ghes-3.6-diff-to-api.json"], { cwd });
        expect(stdout).toBe(expected);
      },
      TIMEOUT,
    );
    test(
      "Stripe API",
      async () => {
        const expected = readFile(new URL("./examples/stripe-api.ts", root)).trim();
        const { stdout } = await execa(cmd, ["./examples/stripe-api.yaml"], { cwd });
        expect(stdout).toBe(expected);
      },
      TIMEOUT,
    );
    // this test runs too slowly on macos / windows in GitHub Actions (but not natively)
    test.skipIf(process.env.CI_ENV === "macos" || process.env.CI_ENV === "windows")(
      "DigitalOcean API (remote $refs)",
      async () => {
        const expected = readFile(new URL("./examples/digital-ocean-api.ts", root)).trim();
        const { stdout } = await execa(cmd, ["./examples/digital-ocean-api/DigitalOcean-public.v2.yaml"], {
          cwd,
        });
        expect(stdout).toBe(expected);
      },
      TIMEOUT,
    );
    test(
      "stdin",
      async () => {
        const expected = readFile(new URL("./examples/stripe-api.ts", root)).trim();
        const input = readFile(new URL("./examples/stripe-api.yaml", root));
        const { stdout } = await execa(cmd, { input });
        expect(stdout).toBe(expected);
      },
      TIMEOUT,
    );
  });

  describe("flags", () => {
    test("--help", async () => {
      const { stdout } = await execa(cmd, ["--help"], { cwd });
      expect(stdout).toEqual(expect.stringMatching(/^Usage\n\s+\$ openapi-typescript \[input\] \[options\]/));
    });

    test("--version", async () => {
      const { stdout } = await execa(cmd, ["--version"], { cwd });
      expect(stdout).toEqual(expect.stringMatching(/^v[\d.]+(-.*)?$/));
    });
  });
});
