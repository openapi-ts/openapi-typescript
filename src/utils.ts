import { OpenAPI2, OpenAPI3 } from "./types";

// shim for Object.fromEntries() for Node < 13
export function fromEntries(entries: [string, any][]): object {
  return entries.reduce((obj, [key, val]) => ({ ...obj, [key]: val }), {});
}

/**
 * Escape/unescape
 * JSON handles most of the transformation for us, but it can’t handle refs, so
 * they will all get converted to strings. We need a special “this is a ref”
 * placeholder to distinguish it from actual strings (also, we can’t assume
 * that "string" in JSON is a TypeScript type and not the actual string
 * "string")!
 */
export function escape(text: string): string {
  return `<@${text}@>`;
}

export function unescape(text: string): string {
  // the " replaces surrounding quotes, if any
  const REMOVE_OPENER = /["|\\"]?<\@/g;
  const REMOVE_CLOSER = /\@>["|\\"]?/g;
  const ESCAPE_NEWLINES = /\\n/g;
  return text
    .replace(REMOVE_OPENER, "")
    .replace(REMOVE_CLOSER, "")
    .replace(ESCAPE_NEWLINES, "\n");
}

export function isArrayNode(node: any): boolean {
  if (!isSchemaObj(node)) {
    return false;
  }
  return node.type === "array" && node.items;
}

/**
 * Return true if object type
 */
export function isObjNode(node: any): boolean {
  if (!isSchemaObj(node)) {
    return false;
  }
  return (
    (node.type && node.type === "object") ||
    !!node.properties ||
    !!node.allOf ||
    !!node.additionalProperties
  );
}

/**
 * Return true if item is schema object
 */
export function isSchemaObj(obj: any): boolean {
  if (!obj || typeof obj !== "object" || Array.isArray(obj)) {
    return false;
  }
  return (
    !!obj.type || !!obj.properties || !!obj.allOf || !!obj.additionalProperties
  );
}

/**
 * Rename object with ? keys if optional
 */
export function makeOptional(obj: any, required?: string[]): any {
  if (typeof obj !== "object" || !Object.keys(obj).length) {
    return obj;
  }
  return fromEntries(
    Object.entries(obj).map(([key, val]) => {
      const sanitized = unescape(key).replace(/\?$/, "");

      if (Array.isArray(required) && required.includes(key)) {
        return [sanitized, val]; // required: no `?`
      }

      return [escape(`${sanitized}?`), val]; // optional: `?`
    })
  );
}

/**
 * Return OpenAPI version from definition
 */
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

/**
 * Convert T into T[];
 */
export function tsArrayOf(type: string): string {
  return type.concat("[]");
}

/**
 * Convert T, U into T & U;
 */
export function tsIntersectionOf(types: string[]): string {
  return types.join(" & ");
}

/**
 * Convert [X, Y, Z] into X | Y | Z
 */
export function tsUnionOf(types: string[]): string {
  return types.join(" | ");
}
