import { OpenAPI2, OpenAPI3, ReferenceObject } from "./types";

export function comment(text: string): string {
  const commentText = text.trim().replace(/\*\//g, "*\\/");

  // if single-line comment
  if (commentText.indexOf("\n") === -1) {
    return `/** ${commentText} */\n`;
  }

  // if multi-line comment
  return `/**
  * ${commentText.replace(/\r?\n/g, "\n  * ")}
  */\n`;
}

export function parseRef(ref: string): { url?: string; parts: string[] } {
  if (typeof ref !== "string" || !ref.includes("#")) return { parts: [] };
  const [url, parts] = ref.split("#");
  return {
    url: url || undefined,
    parts: parts
      .split("/") // split by special character
      .filter((p) => !!p) // remove empty parts
      .map(decodeRef), // decode encoded chars
  };
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
  if (Array.isArray(obj.enum) && obj.enum.length) {
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
  if ("openapi" in definition) {
    // OpenAPI version requires semver, therefore will always be string
    if (parseInt(definition.openapi, 10) === 3) {
      return 3;
    }
  }

  // OpenAPI 2
  if ("swagger" in definition) {
    // note: swagger 2.0 may be parsed as a number
    if (typeof definition.swagger === "number" && Math.round(definition.swagger as number) === 2) {
      return 2;
    }
    if (parseInt(definition.swagger, 10) === 2) {
      return 2;
    }
  }

  throw new Error(
    `🚏 version missing from schema; specify whether this is OpenAPI v3 or v2 https://swagger.io/specification`
  );
}

/** Decode $ref (https://swagger.io/docs/specification/using-ref/#escape) */
export function decodeRef(ref: string): string {
  return ref.replace(/\~0/g, "~").replace(/\~1/g, "/").replace(/"/g, '\\"');
}

/** Encode $ref (https://swagger.io/docs/specification/using-ref/#escape) */
export function encodeRef(ref: string): string {
  return ref.replace(/\~/g, "~0").replace(/\//g, "~1");
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

export function tsReadonly(immutable: boolean): string {
  return immutable ? "readonly " : "";
}

/** Convert [X, Y, Z] into X | Y | Z */
export function tsUnionOf(types: Array<string | number | boolean>): string {
  if (types.length === 1) return `${types[0]}`; // don’t add parentheses around one thing
  return `(${types.join(") | (")})`;
}
