import { OpenAPI2, OpenAPI3, ReferenceObject } from "./types";

export function comment(text: string): string {
  const commentText = text.trim();

  // if single-line comment
  if (commentText.indexOf("\n") === -1) {
    return `/** ${commentText} */\n`;
  }

  // if multi-line comment
  return `/**
  * ${commentText.replace(/\r?\n/g, "\n  * ")}
  */\n`;
}

/** shim for Object.fromEntries() for Node < 13 */
export function fromEntries(entries: [string, any][]): Record<string, unknown> {
  return entries.reduce((obj, [key, val]) => ({ ...obj, [key]: val }), {});
}

/** Is this a ReferenceObject? (note: this is just a TypeScript helper for nodeType() below) */
export function isRef(obj: any): obj is ReferenceObject {
  return !!obj.$ref;
}

/** Return type of node (works for v2 or v3, as there are no conflicting types) */
type SchemaObjectType = "anyOf" | "array" | "boolean" | "enum" | "number" | "object" | "oneOf" | "ref" | "string";
export function nodeType(obj: any): SchemaObjectType | undefined {
  if (!obj || typeof obj !== "object") {
    return undefined;
  }

  if (obj.$ref) {
    return "ref";
  }

  // enum
  if (Array.isArray(obj.enum)) {
    return "enum";
  }

  // boolean
  if (obj.type === "boolean") {
    return "boolean";
  }

  // string
  if (["binary", "byte", "date", "dateTime", "password", "string"].includes(obj.type)) {
    return "string";
  }

  // number
  if (["double", "float", "integer", "number"].includes(obj.type)) {
    return "number";
  }

  // array
  if (obj.type === "array" || obj.items) {
    return "array";
  }

  // return object by default
  return "object";
}

/** Return OpenAPI version from definition */
export function swaggerVersion(definition: OpenAPI2 | OpenAPI3): 2 | 3 {
  // OpenAPI 3
  const { openapi } = definition as OpenAPI3;
  if (openapi && parseInt(openapi, 10) === 3) {
    return 3;
  }

  // OpenAPI 2
  const { swagger } = definition as OpenAPI2;
  if (swagger && parseInt(swagger, 10) === 2) {
    return 2;
  }

  throw new Error(
    `🚏 version missing from schema; specify whether this is OpenAPI v3 or v2 https://swagger.io/specification`
  );
}

/** Convert $ref to TS ref */
export function transformRef(ref: string, root = ""): string {
  // TODO: load external file
  const isExternalRef = !ref.startsWith("#"); // if # isn’t first character, we can assume this is a remote schema
  if (isExternalRef) return "any";

  const parts = ref.replace(/^#\//, root).split("/");
  return `${parts[0]}["${parts.slice(1).join('"]["')}"]`;
}

/** Convert T into T[]; */
export function tsArrayOf(type: string): string {
  return `(${type})[]`;
}

/** Convert array of types into [T, A, B, ...] */
export function tsTupleOf(types: string[]): string {
  return `[${types.join(", ")}]`;
}

/** Convert T, U into T & U; */
export function tsIntersectionOf(types: string[]): string {
  if (types.length === 1) return types[0]; // don’t add parentheses around one thing
  return `(${types.join(") & (")})`;
}

/** Convert T into Partial<T> */
export function tsPartial(type: string): string {
  return `Partial<${type}>`;
}

/** Convert [X, Y, Z] into X | Y | Z */
export function tsUnionOf(types: Array<string | number | boolean>): string {
  if (types.length === 1) return `${types[0]}`; // don’t add parentheses around one thing
  return `(${types.join(") | (")})`;
}

/** Convert the components object and a 'components["parameters"]["param"]' string into the `param` object **/
export function unrefComponent(components: any, ref: string): any {
  const [type, object] = ref.match(/(?<=\[")([^"]+)/g) as string[];
  return components[type][object];
}
