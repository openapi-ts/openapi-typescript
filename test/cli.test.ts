import { execa } from "execa";
import fs from "node:fs";
import { URL } from "node:url";

const cwd = new URL("../", import.meta.url);
const cmd = "./bin/cli.js";

describe("CLI", () => {
  describe("snapshots", () => {
    test("GitHub API", async () => {
      const expected = fs.readFileSync(new URL("./examples/github-api.ts", cwd), "utf8").trim();
      const { stdout } = await execa(cmd, ["./test/fixtures/github-api.yaml"], { cwd });
      expect(stdout).toBe(expected);
    });
    test("Stripe API", async () => {
      const expected = fs.readFileSync(new URL("./examples/stripe-api.ts", cwd), "utf8").trim();
      const { stdout } = await execa(cmd, ["./test/fixtures/stripe-api.yaml"], {
        cwd,
      });
      expect(stdout).toBe(expected);
    });
    test("stdin", async () => {
      const expected = fs.readFileSync(new URL("./examples/stripe-api.ts", cwd), "utf8").trim();
      const input = fs.readFileSync(new URL("./test/fixtures/stripe-api.yaml", cwd));
      const { stdout } = await execa(cmd, { input });
      expect(stdout).toBe(expected);
    });
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
