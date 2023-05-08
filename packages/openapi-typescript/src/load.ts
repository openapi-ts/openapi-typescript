import type { ComponentsObject, Fetch, GlobalContext, OpenAPI3, OperationObject, ParameterObject, PathItemObject, ReferenceObject, RequestBodyObject, ResponseObject, SchemaObject, Subschema } from "./types.js";
import fs from "node:fs";
import path from "node:path";
import { Readable } from "node:stream";
import { URL } from "node:url";
import yaml from "js-yaml";
import type { Dispatcher } from "undici";
import { parseRef, error, makeTSIndex, walk, isRemoteURL, isFilepath } from "./utils.js";

interface SchemaMap {
  [id: string]: Subschema;
}

export const VIRTUAL_JSON_URL = `file:///_json`; // fake URL reserved for dynamic JSON

function parseYAML(schema: any): any {
  try {
    return yaml.load(schema);
  } catch (err: any) {
    error(`YAML: ${err.toString()}`);
    process.exit(1);
  }
}

function parseJSON(schema: any): any {
  try {
    return JSON.parse(schema);
  } catch (err: any) {
    error(`JSON: ${err.toString()}`);
    process.exit(1);
  }
}

export function resolveSchema(filename: string): URL {
  // option 1: remote
  if (isRemoteURL(filename)) return new URL(filename.startsWith("//") ? `https:${filename}` : filename);

  // option 2: local
  const localPath = path.isAbsolute(filename) ? new URL(`file://${filename}`) : new URL(filename, `file://${process.cwd()}/`);

  if (!fs.existsSync(localPath)) {
    error(`Could not locate ${filename}`);
    process.exit(1);
  } else if (fs.statSync(localPath).isDirectory()) {
    error(`${localPath} is a directory not a file`);
    process.exit(1);
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
function parseHttpHeaders(httpHeaders: Record<string, any>): Record<string, any> {
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
        error(`Cannot parse key: ${k} into JSON format. Continuing with the next HTTP header that is specified`);
      }
    }
  }

  return finalHeaders;
}

export interface LoadOptions extends GlobalContext {
  /** Subschemas may be any type; this helps transform correctly */
  hint?: Subschema["hint"];
  auth?: string;
  rootURL: URL;
  schemas: SchemaMap;
  urlCache: Set<string>;
  httpHeaders?: Record<string, any>;
  httpMethod?: string;
  fetch: Fetch;
  parameters: Record<string, ParameterObject>;
}

/** Load a schema from local path or remote URL */
export default async function load(schema: URL | Subschema | Readable, options: LoadOptions): Promise<{ [url: string]: Subschema }> {
  let schemaID = ".";
  // 1. load contents
  // 1a. URL
  if (schema instanceof URL) {
    const hint = options.hint ?? "OpenAPI3";

    // normalize ID
    if (schema.href !== options.rootURL.href) schemaID = relativePath(options.rootURL, schema);

    if (options.urlCache.has(schemaID)) return options.schemas; // exit early if already indexed
    options.urlCache.add(schemaID);

    const ext = path.extname(schema.pathname).toLowerCase();

    // remote
    if (schema.protocol.startsWith("http")) {
      const headers: Record<string, any> = { "User-Agent": "openapi-typescript" };
      if (options.auth) headers.Authorization = options.auth;

      // Add custom parsed HTTP headers
      if (options.httpHeaders) {
        const parsedHeaders = parseHttpHeaders(options.httpHeaders);
        for (const [k, v] of Object.entries(parsedHeaders)) {
          headers[k] = v;
        }
      }
      const res = await options.fetch(schema, {
        method: (options.httpMethod as Dispatcher.HttpMethod) || "GET",
        headers,
      });
      const contentType = res.headers.get("content-type");
      if (ext === ".json" || contentType?.includes("json")) {
        options.schemas[schemaID] = {
          hint,
          schema: parseJSON(await res.text()),
        };
      } else if (ext === ".yaml" || ext === ".yml" || contentType?.includes("yaml")) {
        options.schemas[schemaID] = {
          hint,
          schema: parseYAML(await res.text()),
        };
      }
    }
    // local file
    else {
      const contents = fs.readFileSync(schema, "utf8");
      if (ext === ".yaml" || ext === ".yml")
        options.schemas[schemaID] = {
          hint,
          schema: parseYAML(contents),
        };
      else if (ext === ".json")
        options.schemas[schemaID] = {
          hint,
          schema: parseJSON(contents),
        };
    }
  }
  // 1b. Readable stream
  else if (schema instanceof Readable) {
    const readable = schema;
    const contents = await new Promise<string>((resolve) => {
      readable.resume();
      readable.setEncoding("utf8");
      let content = "";
      readable.on("data", (chunk: string) => {
        content += chunk;
      });
      readable.on("end", () => {
        resolve(content.trim());
      });
    });
    // if file starts with '{' assume JSON
    options.schemas[schemaID] = {
      hint: "OpenAPI3",
      schema: contents.startsWith("{") ? parseJSON(contents) : parseYAML(contents),
    };
  }
  // 1c. inline
  else if (typeof schema === "object") {
    options.schemas[schemaID] = {
      hint: "OpenAPI3",
      schema: schema as any,
    };
  }
  // 1d. failsafe
  else {
    error(`Invalid schema`);
    process.exit(1);
  }

  // 2. resolve $refs
  const currentSchema = options.schemas[schemaID].schema;

  // 2a. remove "components.examples" first
  if (options.schemas[schemaID].hint === "OpenAPI3") {
    if ("components" in currentSchema && currentSchema.components && "examples" in currentSchema.components) delete currentSchema.components.examples;
  }

  const refPromises: Promise<any>[] = [];
  walk(currentSchema, (rawNode, nodePath) => {
    // filter custom properties from allOf, anyOf, oneOf
    for (const k of ["allOf", "anyOf", "oneOf"]) {
      if (Array.isArray(rawNode[k])) {
        rawNode[k] = (rawNode as any)[k].filter((o: SchemaObject | ReferenceObject) => {
          if (!o || typeof o !== "object" || Array.isArray(o)) throw new Error(`${nodePath}.${k}: Expected array of objects. Is your schema valid?`);
          if (!("$ref" in o) || typeof o.$ref !== "string") return true;
          const ref = parseRef(o.$ref);
          return !ref.path.some((i) => i.startsWith("x-")); // ignore all custom "x-*" properties
        });
      }
    }
    if (!rawNode || typeof rawNode !== "object" || Array.isArray(rawNode)) throw new Error(`${nodePath}: Expected object, got ${Array.isArray(rawNode) ? "array" : typeof rawNode}. Is your schema valid?`);
    if (!("$ref" in rawNode) || typeof rawNode.$ref !== "string") return;
    const node = rawNode as unknown as ReferenceObject;

    const ref = parseRef(node.$ref);
    if (ref.filename === ".") return; // local $ref; ignore
    // $ref with custom "x-*" property
    if (ref.path.some((i) => i.startsWith("x-"))) {
      delete (node as any).$ref;
      return;
    }

    // hints help external partial schemas pick up where the root left off (for external complete/valid schemas, skip this)
    const isRemoteFullSchema = ref.path[0] === "paths" || ref.path[0] === "components"; // if the initial ref is "paths" or "components" this must be a full schema
    const hint = isRemoteFullSchema ? "OpenAPI3" : getHint([...nodePath, ...ref.path], options.hint);

    // if root schema is remote and this is a relative reference, treat as remote
    if (schema instanceof URL) {
      const nextURL = new URL(ref.filename, schema);
      const nextID = relativePath(schema, nextURL);
      if (options.urlCache.has(nextID)) return;
      refPromises.push(load(nextURL, { ...options, hint }));
      node.$ref = node.$ref.replace(ref.filename, nextID);
      return;
    }
    // otherwise, if $ref is remote use that
    if (isRemoteURL(ref.filename) || isFilepath(ref.filename)) {
      const nextURL = new URL(ref.filename.startsWith("//") ? `https://${ref.filename}` : ref.filename);
      if (options.urlCache.has(nextURL.href)) return;
      refPromises.push(load(nextURL, { ...options, hint }));
      node.$ref = node.$ref.replace(ref.filename, nextURL.href);
      return;
    }
    // if this is dynamic JSON, we have no idea how to resolve external URLs, so throw here
    if (options.rootURL.href === VIRTUAL_JSON_URL) {
      error(`Can’t resolve "${ref.filename}" from dynamic JSON. Load this schema from a URL instead.`);
      process.exit(1);
    }
    error(`Can’t resolve "${ref.filename}"`);
    process.exit(1);
  });
  await Promise.all(refPromises);

  // 3. transform $refs once, at the root schema, after all have been scanned & downloaded (much easier to do here when we have the context)
  if (schemaID === ".") {
    for (const subschemaID of Object.keys(options.schemas)) {
      walk(options.schemas[subschemaID].schema, (rawNode, nodePath) => {
        if (!("$ref" in rawNode) || typeof rawNode.$ref !== "string") return;

        const node = rawNode as unknown as ReferenceObject;

        const ref = parseRef(node.$ref);

        // local $ref: convert into TS path
        if (ref.filename === ".") {
          node.$ref = makeTSIndex(ref.path);
        }
        // external $ref
        else {
          const refURL = new URL(ref.filename, new URL(subschemaID, options.rootURL));
          node.$ref = makeTSIndex(["external", relativePath(options.rootURL, refURL), ...ref.path]);
        }
      });
    }
  }

  // 4. collect parameters (which must be hoisted to the top)
  for (const k of Object.keys(options.schemas)) {
    walk(options.schemas[k].schema, (rawNode, nodePath) => {
      // note: 'in' is a unique required property of parameters. and parameters can live in subschemas (i.e. "parameters" doesn’t have to be part of the traceable path)
      if (typeof rawNode === "object" && "in" in rawNode) {
        const key = k === "." ? makeTSIndex(nodePath) : makeTSIndex(["external", k, ...nodePath]);
        options.parameters[key] = rawNode as any;
      }
    });
  }

  // 5. scan for discriminators (after everything’s resolved in one file)
  for (const k of Object.keys(options.schemas)) {
    // 4a. lazy stringification check is faster than deep-scanning a giant object for discriminators
    // since most schemas don’t use them
    if (JSON.stringify(options.schemas[k].schema).includes('"discriminator"')) {
      walk(options.schemas[k].schema, (rawNode, nodePath) => {
        const node = rawNode as unknown as SchemaObject;
        if (!node.discriminator) return;
        options.discriminators[schemaID === "." ? makeTSIndex(nodePath) : makeTSIndex(["external", k, ...nodePath])] = node.discriminator;
      });
    }
  }

  return options.schemas;
}

/** relative path from 2 URLs */
function relativePath(src: URL, dest: URL): string {
  const isSameOrigin = dest.protocol.startsWith("http") && src.protocol.startsWith("http") && dest.origin === src.origin;
  const isSameDisk = dest.protocol === "file:" && src.protocol === "file:";
  if (isSameOrigin || isSameDisk) {
    return path.posix.relative(path.posix.dirname(src.pathname), dest.pathname);
  }
  return dest.href;
}

/** given a path array (an array of indices), what type of object is this? */
export function getHint(path: (string | number)[], startFrom?: Subschema["hint"]): Subschema["hint"] | undefined {
  if (startFrom && startFrom !== "OpenAPI3") {
    switch (startFrom) {
      case "OperationObject":
        return getHintFromOperationObject(path);
      case "RequestBodyObject":
        return getHintFromRequestBodyObject(path);
      case "ResponseObject":
        return getHintFromResponseObject(path);
      default:
        return startFrom;
    }
  }
  switch (path[0] as keyof OpenAPI3) {
    case "paths":
      return getHintFromPathItemObject(path.slice(2)); // skip URL at [1]
    case "components":
      return getHintFromComponentsObject(path.slice(1));
  }
  return undefined;
}
function getHintFromComponentsObject(path: (string | number)[]): Subschema["hint"] | undefined {
  switch (path[0] as keyof ComponentsObject) {
    case "schemas":
    case "headers":
      return getHintFromSchemaObject(path.slice(2));
    case "parameters":
      return getHintFromParameterObject(path.slice(2));
    case "responses":
      return getHintFromResponseObject(path.slice(2));
    case "requestBodies":
      return getHintFromRequestBodyObject(path.slice(2));
    case "pathItems":
      return getHintFromPathItemObject(path.slice(2));
  }
  return "SchemaObject";
}
function getHintFromMediaTypeObject(path: (string | number)[]): Subschema["hint"] {
  switch (path[0]) {
    case "schema":
      return getHintFromSchemaObject(path.slice(1));
  }
  return "MediaTypeObject";
}
function getHintFromOperationObject(path: (string | number)[]): Subschema["hint"] {
  switch (path[0] as keyof OperationObject) {
    case "parameters":
      return "ParameterObject[]";
    case "requestBody":
      return getHintFromRequestBodyObject(path.slice(1));
    case "responses":
      return getHintFromResponseObject(path.slice(2)); // skip the response code at [1]
  }
  return "OperationObject";
}
function getHintFromParameterObject(path: (string | number)[]): Subschema["hint"] {
  switch (path[0]) {
    case "content":
      return getHintFromMediaTypeObject(path.slice(2)); // skip content type at [1]
    case "schema":
      return getHintFromSchemaObject(path.slice(1));
  }
  return "ParameterObject";
}
function getHintFromPathItemObject(path: (string | number)[]): Subschema["hint"] | undefined {
  switch (path[0] as keyof PathItemObject) {
    case "parameters": {
      if (typeof path[1] === "number") {
        return "ParameterObject[]";
      }
      return getHintFromParameterObject(path.slice(1));
    }
    default:
      return getHintFromOperationObject(path.slice(1));
  }
}
function getHintFromRequestBodyObject(path: (string | number)[]): Subschema["hint"] {
  switch (path[0] as keyof RequestBodyObject) {
    case "content":
      return getHintFromMediaTypeObject(path.slice(2)); // skip content type at [1]
  }
  return "RequestBodyObject";
}
function getHintFromResponseObject(path: (string | number)[]): Subschema["hint"] {
  switch (path[0] as keyof ResponseObject) {
    case "headers":
      return getHintFromSchemaObject(path.slice(2)); // skip name at [1]
    case "content":
      return getHintFromMediaTypeObject(path.slice(2)); // skip content type at [1]
  }
  return "ResponseObject";
}
function getHintFromSchemaObject(path: (string | number)[]): Subschema["hint"] {
  switch (path[0]) {
    case "allOf":
    case "anyOf":
    case "oneOf":
      return getHintFromSchemaObject(path.slice(2)); // skip array index at [1]
  }
  return "SchemaObject";
}
