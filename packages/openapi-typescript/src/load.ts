import type { ComponentsObject, DiscriminatorObject, Fetch, GlobalContext, OpenAPI3, OperationObject, ParameterObject, PathItemObject, ReferenceObject, RequestBodyObject, ResponseObject, SchemaObject, Subschema } from "./types.js";
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

const EXT_RE = /\.(yaml|yml|json)#?\/?/i;
export const VIRTUAL_JSON_URL = `file:///_json`; // fake URL reserved for dynamic JSON

/** parse OpenAPI schema s YAML or JSON */
function parseSchema(source: string) {
  return source.trim().startsWith("{") ? JSON.parse(source) : yaml.load(source);
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
function parseHttpHeaders(httpHeaders: Record<string, unknown>): Record<string, unknown> {
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
        error(`Can’t parse key: ${k} into JSON format. Continuing with the next HTTP header that is specified`);
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
  httpHeaders?: Record<string, unknown>;
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
    if (schema.href !== options.rootURL.href) {
      schemaID = relativePath(options.rootURL, schema);
    }

    if (options.urlCache.has(schemaID)) {
      return options.schemas; // exit early if already indexed
    }
    options.urlCache.add(schemaID);

    // remote
    if (schema.protocol.startsWith("http")) {
      const headers: Record<string, string> = { "User-Agent": "openapi-typescript" };
      if (options.auth) headers.Authorization = options.auth;

      // Add custom parsed HTTP headers
      if (options.httpHeaders) {
        const parsedHeaders = parseHttpHeaders(options.httpHeaders);
        for (const [k, v] of Object.entries(parsedHeaders)) {
          headers[k] = v as string;
        }
      }
      const res = await options.fetch(schema, {
        method: (options.httpMethod as Dispatcher.HttpMethod) || "GET",
        headers,
      });
      const contents = await res.text();
      options.schemas[schemaID] = { hint, schema: parseSchema(contents) };
    }
    // local file
    else {
      const contents = fs.readFileSync(schema, "utf8");
      options.schemas[schemaID] = { hint, schema: parseSchema(contents) };
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
    options.schemas[schemaID] = { hint: "OpenAPI3", schema: parseSchema(contents) };
  }
  // 1c. inline
  else if (typeof schema === "object") {
    options.schemas[schemaID] = {
      hint: "OpenAPI3",
      schema: JSON.parse(JSON.stringify(schema)), // create deep clone of inline schema (don’t mutate)
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

  const refPromises: Promise<unknown>[] = [];
  walk(currentSchema, (rawNode, nodePath) => {
    // filter custom properties from allOf, anyOf, oneOf
    for (const k of ["allOf", "anyOf", "oneOf"]) {
      if (Array.isArray(rawNode[k])) {
        rawNode[k] = (rawNode as Record<string, SchemaObject[]>)[k].filter((o: SchemaObject | ReferenceObject) => {
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
    if (ref.filename === ".") {
      return; // local $ref; ignore
    }
    // $ref with custom "x-*" property
    if (ref.path.some((i) => i.startsWith("x-"))) {
      delete (node as unknown as Record<string, unknown>).$ref;
      return;
    }

    // hints help external partial schemas pick up where the root left off (for external complete/valid schemas, skip this)
    const isRemoteFullSchema = ref.path[0] === "paths" || ref.path[0] === "components"; // if the initial ref is "paths" or "components" this must be a full schema
    const hintPath: string[] = [...(nodePath as string[])];
    if (ref.filename) hintPath.push(ref.filename);
    hintPath.push(...ref.path);
    const hint = isRemoteFullSchema ? "OpenAPI3" : getHint({ path: hintPath, external: !!ref.filename, startFrom: options.hint });

    if (isRemoteURL(ref.filename) || isFilepath(ref.filename)) {
      const nextURL = new URL(ref.filename.startsWith("//") ? `https://${ref.filename}` : ref.filename);
      refPromises.push(load(nextURL, { ...options, hint }));
      node.$ref = node.$ref.replace(ref.filename, nextURL.href);
      return;
    }

    // if this is dynamic JSON (with no cwd), we have no idea how to resolve external URLs, so throw here
    if (options.rootURL.href === VIRTUAL_JSON_URL) {
      error(`Can’t resolve "${ref.filename}" from dynamic JSON. Either load this schema from a filepath/URL, or set the \`cwd\` option: \`openapiTS(schema, { cwd: '/path/to/cwd' })\`.`);
      process.exit(1);
    }

    const nextURL = new URL(ref.filename, schema instanceof URL ? schema : options.rootURL);
    const nextID = relativePath(schema instanceof URL ? schema : options.rootURL, nextURL);
    refPromises.push(load(nextURL, { ...options, hint }));
    node.$ref = node.$ref.replace(ref.filename, nextID);
  });
  await Promise.all(refPromises);

  // 3. transform $refs once, at the root schema, after all have been scanned & downloaded (much easier to do here when we have the context)
  if (schemaID === ".") {
    for (const subschemaID of Object.keys(options.schemas)) {
      walk(options.schemas[subschemaID].schema, (rawNode) => {
        if (!("$ref" in rawNode) || typeof rawNode.$ref !== "string") return;

        const node = rawNode as unknown as ReferenceObject;

        const ref = parseRef(node.$ref);

        // local $ref: convert into TS path
        if (ref.filename === ".") {
          if (subschemaID === "." || ref.path[0] === "external") {
            node.$ref = makeTSIndex(ref.path);
          } else {
            node.$ref = makeTSIndex(["external", subschemaID, ...ref.path]);
          }
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
        options.parameters[key] = rawNode as unknown as ParameterObject;
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
        const discriminator: DiscriminatorObject = { ...node.discriminator };

        // handle child oneOf types (mapping isn’t explicit from children)
        const oneOf: string[] = [];
        if (Array.isArray(node.oneOf)) {
          for (const child of node.oneOf) {
            if (!child || typeof child !== "object" || !("$ref" in child)) continue;
            oneOf.push(child.$ref);
          }
        }
        if (oneOf.length) discriminator.oneOf = oneOf;

        options.discriminators[schemaID === "." ? makeTSIndex(nodePath) : makeTSIndex(["external", k, ...nodePath])] = discriminator;
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

export interface GetHintOptions {
  path: string[];
  external: boolean;
  startFrom?: Subschema["hint"];
}

/**
 * Hinting
 * A remote `$ref` may point to anything—A full OpenAPI schema, partial OpenAPI schema, Schema Object, Parameter Object, etc.
 * The only way to parse its contents correctly is to trace the path from the root schema and infer the type it should be.
 * “Hinting” is the process of tracing its lineage back to the root schema to invoke the correct transformations on it.
 */
export function getHint({ path, external, startFrom }: GetHintOptions): Subschema["hint"] | undefined {
  if (startFrom && startFrom !== "OpenAPI3") {
    switch (startFrom) {
      case "OperationObject":
        return getHintFromOperationObject(path, external);
      case "RequestBodyObject":
        return getHintFromRequestBodyObject(path, external);
      case "ResponseObject":
        return getHintFromResponseObject(path, external);
      case "SchemaMap":
        return "SchemaObject";
      default:
        return startFrom;
    }
  }
  switch (path[0] as keyof OpenAPI3) {
    case "paths": {
      // if entire path item object is $ref’d, treat as schema map
      if (EXT_RE.test(path[2])) {
        return "SchemaMap";
      }
      return getHintFromPathItemObject(path.slice(2), external); // skip URL at [1]
    }
    case "components":
      return getHintFromComponentsObject(path.slice(1), external);
  }
  return undefined;
}
function getHintFromComponentsObject(path: (string | number)[], external: boolean): Subschema["hint"] | undefined {
  switch (path[0] as keyof ComponentsObject) {
    case "schemas":
    case "headers":
      return getHintFromSchemaObject(path.slice(2), external);
    case "parameters":
      return getHintFromParameterObject(path.slice(2), external);
    case "responses":
      return getHintFromResponseObject(path.slice(2), external);
    case "requestBodies":
      return getHintFromRequestBodyObject(path.slice(2), external);
    case "pathItems":
      return getHintFromPathItemObject(path.slice(2), external);
  }
  return "SchemaObject";
}
function getHintFromMediaTypeObject(path: (string | number)[], external: boolean): Subschema["hint"] {
  switch (path[0]) {
    case "schema":
      return getHintFromSchemaObject(path.slice(1), external);
  }
  return "MediaTypeObject";
}
function getHintFromOperationObject(path: (string | number)[], external: boolean): Subschema["hint"] {
  switch (path[0] as keyof OperationObject) {
    case "parameters":
      return "ParameterObject[]";
    case "requestBody":
      return getHintFromRequestBodyObject(path.slice(1), external);
    case "responses":
      return getHintFromResponseObject(path.slice(2), external); // skip the response code at [1]
  }
  return "OperationObject";
}
function getHintFromParameterObject(path: (string | number)[], external: boolean): Subschema["hint"] {
  switch (path[0]) {
    case "content":
      return getHintFromMediaTypeObject(path.slice(2), external); // skip content type at [1]
    case "schema":
      return getHintFromSchemaObject(path.slice(1), external);
  }
  return "ParameterObject";
}
function getHintFromPathItemObject(path: (string | number)[], external: boolean): Subschema["hint"] | undefined {
  switch (path[0] as keyof PathItemObject) {
    case "parameters": {
      if (typeof path[1] === "number") {
        return "ParameterObject[]";
      }
      return getHintFromParameterObject(path.slice(1), external);
    }
    default:
      return getHintFromOperationObject(path.slice(1), external);
  }
}
function getHintFromRequestBodyObject(path: (string | number)[], external: boolean): Subschema["hint"] {
  switch (path[0] as keyof RequestBodyObject) {
    case "content":
      return getHintFromMediaTypeObject(path.slice(2), external); // skip content type at [1]
  }
  return "RequestBodyObject";
}
function getHintFromResponseObject(path: (string | number)[], external: boolean): Subschema["hint"] {
  switch (path[0] as keyof ResponseObject) {
    case "headers":
      return getHintFromSchemaObject(path.slice(2), external); // skip name at [1]
    case "content":
      return getHintFromMediaTypeObject(path.slice(2), external); // skip content type at [1]
  }
  return "ResponseObject";
}
function getHintFromSchemaObject(path: (string | number)[], external: boolean): Subschema["hint"] {
  switch (path[0]) {
    case "allOf":
    case "anyOf":
    case "oneOf":
      return "SchemaMap";
  }
  // if this is external, and the path is [filename, key], then the external schema is probably a SchemaMap
  if (path.length >= 2 && external) {
    return "SchemaMap";
  }
  // otherwise, path length of 1 means partial schema is likely a SchemaObject (or it’s unknown, in which case assume SchemaObject)
  return "SchemaObject";
}
