import fs from "fs";
import path from "path";
import http from "http";
import https from "https";
import { URL } from "url";
import mime from "mime";
import yaml from "js-yaml";

// config
const MAX_REDIRECT_COUNT = 10;

/** Simple fetch utility with support for redirect */
async function fetch(
  url: string,
  opts: https.RequestOptions,
  { silent = false, redirectCount = 0 } = {}
): Promise<{ body: string; contentType: string }> {
  return new Promise((resolve, reject) => {
    const { protocol } = new URL(url);
    if (protocol !== "http:" && protocol !== "https:") {
      throw new Error(`Unsupported protocol: "${protocol}". URL must start with "http://" or "https://".`);
    }

    const fetchMethod = protocol === "https:" ? https : http;
    const req = fetchMethod.request(url, opts, (res) => {
      let rawData = "";
      res.setEncoding("utf8");
      res.on("data", (chunk) => {
        rawData += chunk;
      });
      res.on("end", () => {
        if (!res.statusCode || !res.headers) return reject(rawData);

        // 2xx: OK
        if (res.statusCode >= 200 && res.statusCode < 300) {
          let contentType = (res.headers["content-type"] || "").split(";")[0].trim();
          if (!isJSON(contentType) || !isYAML(contentType)) contentType = mime.getType(url) || "";
          return resolve({ body: rawData, contentType });
        }

        // 3xx: follow redirect (if given)
        if (res.statusCode >= 300 && res.headers.location) {
          if (redirectCount >= MAX_REDIRECT_COUNT) {
            reject(`Max redirects exceeded`);
            return;
          }
          if (silent !== true) console.log(`🚥 Redirecting to ${res.headers.location}…`);
          return fetch(res.headers.location, opts, { silent, redirectCount: redirectCount + 1 }).then(resolve);
        }

        // 404: throw friendly message
        if (res.statusCode === 404) {
          return reject(
            `The URL ${url} could not be reached. Ensure the URL is correct, that you're connected to the internet and that the URL is reachable via a browser.`
          );
        }

        // everything else: throw
        return reject(rawData || `${res.statusCode} ${res.statusMessage}`);
      });
    });
    req.on("error", (err) => {
      reject(err);
    });
    req.end();
  });
}

function isYAML(contentType: string | null) {
  return contentType === "application/openapi+yaml" || contentType === "text/yaml";
}

function isJSON(contentType: string | null) {
  return (
    contentType === "application/json" ||
    contentType === "application/json5" ||
    contentType === "application/openapi+json"
  );
}

function parseSchema(schema: any, type: "YAML" | "JSON") {
  if (type === "YAML") {
    try {
      const s = yaml.load(schema);
      console.log({ type: typeof s });
      return s;
    } catch (err) {
      throw new Error(`YAML: ${err.toString()}`);
    }
  } else {
    try {
      return JSON.parse(schema);
    } catch (err) {
      throw new Error(`JSON: ${err.toString()}`);
    }
  }
}

/** Load a schema from local path or remote URL */
export default async function load(
  schema: string | Record<string, any>,
  { auth, silent }: { auth?: string; silent: boolean }
): Promise<Record<string, any>> {
  // if this is an object already, assume JSON and return as-is
  if (typeof schema !== "string") return schema;

  // this a local path or remote URL?
  let isRemote = false;
  try {
    new URL(schema); // if this isn’t a valid URL, assume local
    isRemote = true;
  } catch (err) {
    // ignore
  }

  // option 1: remote URL
  if (isRemote) {
    const { body, contentType } = await fetch(schema, { auth }, { silent });
    let contents: Record<string, any>; // Note: Record<string, any> is vague, but it at least guarantees `typeof object`

    if (isYAML(contentType)) {
      contents = parseSchema(body, "YAML");
    } else if (isJSON(contentType)) {
      contents = parseSchema(body, "JSON");
    } else {
      throw new Error(`Unknown format${contentType ? `: "${contentType}"` : ""}. Only YAML or JSON supported.`); // give up: unknown type
    }
    return contents;
  }

  // option 2: local path
  const srcPath = path.join(process.cwd(), schema);
  if (!fs.existsSync(srcPath)) {
    throw new Error(`Could not locate local schema ${schema}`);
  }

  let contents: any = await fs.promises.readFile(srcPath, "utf8");
  const contentType = mime.getType(srcPath);

  if (isYAML(contentType)) {
    contents = parseSchema(contents, "YAML");
  } else if (isJSON(contentType)) {
    contents = parseSchema(contents, "JSON");
  } else {
    throw new Error(`Unknown format: "${path.extname(schema) || schema}". Only YAML or JSON supported.`);
  }

  return contents;
}
