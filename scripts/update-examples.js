import { execSync } from "node:child_process";
import { URL } from "node:url";

const specs = {
  "github-api":
    "https://raw.githubusercontent.com/github/rest-api-description/main/descriptions/api.github.com/api.github.com.yaml",
  "stripe-api": "https://raw.githubusercontent.com/stripe/openapi/master/openapi/spec3.yaml",
  // add more
};

async function generateSchemas() {
  await Promise.all(
    Object.entries(specs).map(async ([name, url]) => {
      await execSync(`node ./bin/cli.js ${url} -o ./examples/${name}.ts`, { cwd: new URL("../", import.meta.url) });
    })
  );
}

generateSchemas();
