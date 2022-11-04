/**
 * Download OpenAPI schemas
 * Reference updating schemas without committing to the repo
 */

/* eslint-disable no-undef */

import fs from "node:fs";
import { URL } from "node:url";
import { fetch } from "undici";

export const FIXTURES_DIR = new URL("../test/fixtures/", import.meta.url);

const schemas = {
  "github-api.yaml":
    "https://raw.githubusercontent.com/github/rest-api-description/main/descriptions/api.github.com/api.github.com.yaml",
  "stripe-api.yaml": "https://raw.githubusercontent.com/stripe/openapi/master/openapi/spec3.yaml",
};

export default async function downloadSchemas() {
  await Promise.all(
    Object.entries(schemas).map(async ([name, url]) => {
      const result = await fetch(url);
      if (!result.ok) {
        console.error(`✘ Error fetching ${url}`);
        process.exit(1);
      }
      fs.writeFileSync(new URL(name, FIXTURES_DIR), await result.text());
    })
  );
}

downloadSchemas();
