import { execa } from "execa";
import fs from "node:fs";
import { URL } from "node:url";

const cwd = new URL("../", import.meta.url);
const cmd = "./bin/cli.js";

describe("CLI", () => {
  // note: the snapshots in index.test.ts test the Node API; these test the CLI
  describe("snapshots", () => {
    test("GitHub API", async () => {
      const expected = fs.readFileSync(new URL("./examples/github-api.ts", cwd), "utf8").trim();
      const { stdout } = await execa(cmd, ["./examples/github-api.yaml"], { cwd });
      expect(stdout).toBe(expected);
    }, 30000);
    test("GitHub API (next)", async () => {
      const expected = fs.readFileSync(new URL("./examples/github-api-next.ts", cwd), "utf8").trim();
      const { stdout } = await execa(cmd, ["./examples/github-api-next.yaml"], { cwd });
      expect(stdout).toBe(expected);
    }, 30000);
    test("Octokit GHES 3.6 Diff to API", async () => {
      const expected = fs.readFileSync(new URL("./examples/octokit-ghes-3.6-diff-to-api.ts", cwd), "utf8").trim();
      const { stdout } = await execa(cmd, ["./examples/octokit-ghes-3.6-diff-to-api.json"], { cwd });
      expect(stdout).toBe(expected);
    }, 30000);
    test("Stripe API", async () => {
      const expected = fs.readFileSync(new URL("./examples/stripe-api.ts", cwd), "utf8").trim();
      const { stdout } = await execa(cmd, ["./examples/stripe-api.yaml"], { cwd });
      expect(stdout).toBe(expected);
    }, 30000);
    test("DigitalOcean API (remote $refs)", async () => {
      const expected = fs.readFileSync(new URL("./examples/digital-ocean-api.ts", cwd), "utf8").trim();
      const { stdout } = await execa(cmd, ["./examples/digital-ocean-api/DigitalOcean-public.v2.yaml"], {
        cwd,
      });
      expect(stdout).toBe(expected);
    }, 60000);
    test("stdin", async () => {
      const expected = fs.readFileSync(new URL("./examples/stripe-api.ts", cwd), "utf8").trim();
      const input = fs.readFileSync(new URL("./examples/stripe-api.yaml", cwd));
      const { stdout } = await execa(cmd, { input });
      expect(stdout).toBe(expected);
    }, 30000);
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
