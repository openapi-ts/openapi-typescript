import type { GlobalContext, Headers } from "./types.js";
import type { Dispatcher } from "undici";
import fs from "fs";
import yaml from "js-yaml";
import mime from "mime";
import path from "path";
import { Readable } from "stream";
import { request } from "undici";
import { URL } from "url";
import { parseRef } from "./utils.js";

type PartialSchema = Record<string, any>; // not a very accurate type, but this is easier to deal with before we know we’re dealing with a valid spec
type SchemaMap = { [url: string]: PartialSchema };

const RED = "\u001b[31m";
const RESET = "\u001b[0m";

export const VIRTUAL_JSON_URL = `file:///_json`; // fake URL reserved for dynamic JSON

function parseSchema(schema: any, type: "YAML" | "JSON") {
  if (type === "YAML") {
    try {
      return yaml.load(schema);
    } catch (err: any) {
      throw new Error(`YAML: ${err.toString()}`);
    }
  } else {
    try {
      return JSON.parse(schema);
    } catch (err: any) {
      throw new Error(`JSON: ${err.toString()}`);
    }
  }
}

function isFile(url: URL): boolean {
  return url.protocol === "file:";
}

export function resolveSchema(url: string): URL {
  // option 1: remote
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return new URL(url);
  }

  // option 2: local
  const localPath = path.isAbsolute(url) ? new URL("", `file://${url}`) : new URL(url, `file://${process.cwd()}/`); // if absolute path is provided use that; otherwise search cwd\

  if (!fs.existsSync(localPath)) {
    throw new Error(`Could not locate ${url}`);
  } else if (fs.statSync(localPath).isDirectory()) {
    throw new Error(`${localPath} is a directory not a file`);
  }

  return localPath;
}

/**
 * Accepts income HTTP headers and appends them to
 * the fetch request for the schema.
 *
 * @param {HTTPHeaderMap} httpHeaders
 * @return {Record<string, string>}  {Record<string, string>} Final HTTP headers outcome.
 */
function parseHttpHeaders(httpHeaders: Record<string, any>): Headers {
  const finalHeaders: Record<string, string> = {};

  // Obtain the header key
  for (const [k, v] of Object.entries(httpHeaders)) {
    // If the value of the header is already a string, we can move on, otherwise we have to parse it
    if (typeof v === "string") {
      finalHeaders[k] = v;
    } else {
      try {
        const stringVal = JSON.stringify(v);
        finalHeaders[k] = stringVal;
      } catch (err) {
        /* istanbul ignore next */
        console.error(
          `${RED}Cannot parse key: ${k} into JSON format. Continuing with the next HTTP header that is specified${RESET}`
        );
      }
    }
  }

  return finalHeaders;
}

interface LoadOptions extends GlobalContext {
  rootURL: URL;
  schemas: SchemaMap;
  urlCache?: Set<string>; // URL cache (prevent URLs from being loaded over and over)
  httpHeaders?: Headers;
  httpMethod?: string;
}

/** Load a schema from local path or remote URL */
export default async function load(
  schema: URL | PartialSchema | Readable,
  options: LoadOptions
): Promise<{ [url: string]: PartialSchema }> {
  const urlCache = options.urlCache || new Set<string>();

  // if this is dynamically-passed-in JSON, we’ll have to change a few things
  const isJSON = schema instanceof URL == false && schema instanceof Readable == false;
  let schemaID = isJSON || schema instanceof Readable ? new URL(VIRTUAL_JSON_URL).href : (schema.href as string);

  const schemas = options.schemas;

  // scenario 1: load schema from dynamic JSON
  if (isJSON) {
    schemas[schemaID] = schema;
  }
  // scenario 2: fetch schema from URL (local or remote)
  else {
    if (urlCache.has(schemaID)) return options.schemas; // exit early if this has already been scanned
    urlCache.add(schemaID); // add URL to cache

    let contents = "";
    let contentType = "";
    const schemaURL = schema instanceof Readable ? new URL(VIRTUAL_JSON_URL) : (schema as URL); // helps TypeScript

    if (schema instanceof Readable) {
      const readable = schema;
      contents = await new Promise<string>((resolve) => {
        readable.resume();
        readable.setEncoding("utf8");

        let content = "";
        readable.on("data", (chunk: string) => {
          content += chunk;
        });

        readable.on("end", () => {
          resolve(content);
        });
      });
      contentType = "text/yaml";
    } else if (isFile(schemaURL)) {
      // load local
      contents = fs.readFileSync(schemaURL, "utf8");
      contentType = mime.getType(schemaID) || "";
    } else {
      // load remote
      const headers: Headers = {
        "User-Agent": "openapi-typescript",
      };
      if (options.auth) headers.Authorization = options.auth;

      // Add custom parsed HTTP headers
      if (options.httpHeaders) {
        const parsedHeaders = parseHttpHeaders(options.httpHeaders);
        for (const [k, v] of Object.entries(parsedHeaders)) {
          headers[k] = v;
        }
      }

      const res = await request(schemaID, { method: (options.httpMethod as Dispatcher.HttpMethod) || "GET", headers });
      if (Array.isArray(res.headers["Content-Type"])) contentType = res.headers["Content-Type"][0];
      else if (res.headers["Content-Type"]) contentType = res.headers["Content-Type"];
      contents = await res.body.text();
    }

    const isYAML = contentType === "application/openapi+yaml" || contentType === "text/yaml";
    const isJSON =
      contentType === "application/json" ||
      contentType === "application/json5" ||
      contentType === "application/openapi+json";
    if (isYAML) {
      schemas[schemaID] = parseSchema(contents, "YAML");
    } else if (isJSON) {
      schemas[schemaID] = parseSchema(contents, "JSON");
    } else {
      // if contentType is unknown, guess
      try {
        schemas[schemaID] = parseSchema(contents, "JSON");
      } catch (err1) {
        try {
          schemas[schemaID] = parseSchema(contents, "YAML");
        } catch (err2) {
          throw new Error(`Unknown format${contentType ? `: "${contentType}"` : ""}. Only YAML or JSON supported.`); // give up: unknown type
        }
      }
    }
  }

  // scan $refs, but don’t transform (load everything in parallel)
  const refPromises: Promise<any>[] = [];
  schemas[schemaID] = JSON.parse(JSON.stringify(schemas[schemaID]), (k, v) => {
    if (k !== "$ref" || typeof v !== "string") return v;

    const { url: refURL } = parseRef(v);
    if (refURL) {
      // load $refs (only if new) and merge subschemas with top-level schema
      const isRemoteURL = refURL.startsWith("http://") || refURL.startsWith("https://");

      // if this is dynamic JSON, we have no idea how to resolve relative URLs, so throw here
      if (isJSON && !isRemoteURL) {
        throw new Error(`Can’t load URL "${refURL}" from dynamic JSON. Load this schema from a URL instead.`);
      }

      const nextURL = isRemoteURL ? new URL(refURL) : new URL(refURL, schema as URL);
      refPromises.push(
        load(nextURL, { ...options, urlCache }).then((subschemas) => {
          for (const subschemaURL of Object.keys(subschemas)) {
            schemas[subschemaURL] = subschemas[subschemaURL];
          }
        })
      );
      return v.replace(refURL, nextURL.href); // resolve relative URLs to absolute URLs so the schema can be flattened
    }
    return v;
  });
  await Promise.all(refPromises);

  // transform $refs once, at the root schema, after all have been scanned & downloaded (much easier to do here when we have the context)
  if (schemaID === options.rootURL.href) {
    for (const subschemaURL of Object.keys(schemas)) {
      // transform $refs in schema
      schemas[subschemaURL] = JSON.parse(JSON.stringify(schemas[subschemaURL]), (k, v) => {
        if (k !== "$ref" || typeof v !== "string") return v;
        if (!v.includes("#")) return v; // already transformed; skip

        const { url, parts } = parseRef(v);
        // scenario 1: resolve all external URLs so long as they don’t point back to root schema
        if (url && new URL(url).href !== options.rootURL.href) {
          const relativeURL =
            isFile(new URL(url)) && isFile(options.rootURL)
              ? path.posix.relative(path.posix.dirname(options.rootURL.href), url)
              : url;
          return `external["${relativeURL}"]["${parts.join('"]["')}"]`; // export external ref
        }
        // scenario 2: treat all $refs in external schemas as external
        if (!url && subschemaURL !== options.rootURL.href) {
          const relativeURL =
            isFile(new URL(subschemaURL)) && isFile(options.rootURL)
              ? path.posix.relative(path.posix.dirname(options.rootURL.href), subschemaURL)
              : subschemaURL;
          return `external["${relativeURL}"]["${parts.join('"]["')}"]`; // export external ref
        }

        // References to properties of schemas like `#/components/schemas/Pet/properties/name`
        // requires the components to be wrapped in a `properties` object. But to keep
        // backwards compatibility we should instead just remove the `properties` part.
        // For us to recognize the `properties` part it simply has to be the second last.
        if (parts[parts.length - 2] === "properties") {
          parts.splice(parts.length - 2, 1);
        }

        // scenario 3: transform all $refs pointing back to root schema
        const [base, ...rest] = parts;

        return `${base}["${rest.join('"]["')}"]`; // transform other $refs to the root schema (including external refs that point back to the root schema)
      });

      // use relative keys for external schemas (schemas generated on different machines should have the same namespace)
      if (subschemaURL !== options.rootURL.href) {
        const relativeURL =
          isFile(new URL(subschemaURL)) && isFile(options.rootURL)
            ? path.posix.relative(path.posix.dirname(options.rootURL.href), subschemaURL)
            : subschemaURL;
        if (relativeURL !== subschemaURL) {
          schemas[relativeURL] = schemas[subschemaURL];
          delete schemas[subschemaURL];
        }
      }
    }
  }

  return schemas;
}
