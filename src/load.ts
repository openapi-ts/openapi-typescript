import fs from "fs";
import path from "path";
import { URL } from "url";
import fetch, { Headers } from "node-fetch";
import mime from "mime";
import yaml from "js-yaml";
import { GlobalContext } from "./types";
import { parseRef } from "./utils";

type PartialSchema = Record<string, any>; // not a very accurate type, but this is easier to deal with before we know we’re dealing with a valid spec

function parseSchema(schema: any, type: "YAML" | "JSON") {
  if (type === "YAML") {
    try {
      return yaml.load(schema);
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

interface LoadOptions extends GlobalContext {
  rootURL: URL;
  schemas: { [url: string]: PartialSchema };
}

// temporary cache for load()
let urlCache = new Set<string>(); // URL cache (prevent URLs from being loaded over and over)

/** Load a schema from local path or remote URL */
export default async function load(schemaURL: URL, options: LoadOptions): Promise<{ [url: string]: PartialSchema }> {
  if (urlCache.has(schemaURL.href)) return options.schemas; // exit early if this has already been scanned
  urlCache.add(schemaURL.href); // add URL to cache

  const schemas = options.schemas;

  let contents = "";
  let contentType = "";

  if (isFile(schemaURL)) {
    // load local
    contents = await fs.promises.readFile(schemaURL, "utf8");
    contentType = mime.getType(schemaURL.href) || "";
  } else {
    // load remote
    const headers = new Headers();
    if (options.auth) headers.set("Authorization", options.auth);
    const res = await fetch(schemaURL.href, { method: "GET", headers });
    contentType = res.headers.get("Content-Type") || "";
    contents = await res.text();
  }

  const isYAML = contentType === "application/openapi+yaml" || contentType === "text/yaml";
  const isJSON =
    contentType === "application/json" ||
    contentType === "application/json5" ||
    contentType === "application/openapi+json";
  if (isYAML) {
    schemas[schemaURL.href] = parseSchema(contents, "YAML");
  } else if (isJSON) {
    schemas[schemaURL.href] = parseSchema(contents, "JSON");
  } else {
    // if contentType is unknown, guess
    try {
      schemas[schemaURL.href] = parseSchema(contents, "JSON");
    } catch (err1) {
      try {
        schemas[schemaURL.href] = parseSchema(contents, "YAML");
      } catch (err2) {
        throw new Error(`Unknown format${contentType ? `: "${contentType}"` : ""}. Only YAML or JSON supported.`); // give up: unknown type
      }
    }
  }

  // scan $refs, but don’t transform (load everything in parallel)
  const refPromises: Promise<any>[] = [];
  schemas[schemaURL.href] = JSON.parse(JSON.stringify(schemas[schemaURL.href]), (k, v) => {
    if (k !== "$ref" || typeof v !== "string") return v;

    const { url: refURL } = parseRef(v);
    if (refURL) {
      // load $refs (only if new) and merge subschemas with top-level schema
      const nextURL =
        refURL.startsWith("http://") || refURL.startsWith("https://") ? new URL(refURL) : new URL(refURL, schemaURL);
      refPromises.push(
        load(nextURL, options).then((subschemas) => {
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
  if (schemaURL.href === options.rootURL.href) {
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
