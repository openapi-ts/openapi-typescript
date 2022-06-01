import type { OpenAPI2, OpenAPI3, ReferenceObject } from "./types.js";

type CommentObject = {
  const?: boolean; // jsdoc without value
  default?: string; // jsdoc with value
  deprecated?: boolean; // jsdoc without value
  description?: string; // jsdoc with value
  enum?: boolean; // jsdoc without value
  example?: string; // jsdoc with value
  format?: string; // not jsdoc
  nullable?: boolean; // Node information
  title?: string; // not jsdoc
  type: string; // Type of node
};

const COMMENT_RE = /\*\//g;
const LB_RE = /\r?\n/g;
const DOUBLE_QUOTE_RE = /"/g;
const SINGLE_QUOTE_RE = /'/g;
const ESC_0_RE = /\~0/g;
const ESC_1_RE = /\~1/g;
const TILDE_RE = /\~/g;
const FS_RE = /\//g;

/**
 * Preparing comments from fields
 * @see {comment} for output examples
 * @returns void if not comments or jsdoc format comment string
 */
export function prepareComment(v: CommentObject): string | void {
  const commentsArray: Array<string> = [];

  // * Not JSDOC tags: [title, format]
  if (v.title) commentsArray.push(`${v.title} `);
  if (v.format) commentsArray.push(`Format: ${v.format} `);

  // * JSDOC tags without value
  // 'Deprecated' without value
  if (v.deprecated) commentsArray.push(`@deprecated `);

  // * JSDOC tags with value
  const supportedJsDocTags: Array<keyof CommentObject> = ["description", "default", "example"];
  for (let index = 0; index < supportedJsDocTags.length; index++) {
    const field = supportedJsDocTags[index];
    const allowEmptyString = field === "default" || field === "example";
    if (v[field] === undefined) {
      continue;
    }
    if (v[field] === "" && !allowEmptyString) {
      continue;
    }
    const serialized = typeof v[field] === "object" ? JSON.stringify(v[field], null, 2) : v[field];
    commentsArray.push(`@${field} ${serialized} `);
  }

  // * JSDOC 'Constant' without value
  if (v.const) commentsArray.push(`@constant `);

  // * JSDOC 'Enum' with type
  if (v.enum) {
    const canBeNull = v.nullable ? `|${null}` : "";
    commentsArray.push(`@enum {${v.type}${canBeNull}}`);
  }

  if (!commentsArray.length) return;

  return comment(commentsArray.join("\n"));
}

export function comment(text: string): string {
  const commentText = text.trim().replace(COMMENT_RE, "*\\/");

  // if single-line comment
  if (commentText.indexOf("\n") === -1) {
    return `/** ${commentText} */\n`;
  }

  // if multi-line comment
  return `/**
  * ${commentText.replace(LB_RE, "\n  * ")}
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

export type ParsedSimpleValue = string | number | boolean;

/**
 * For parsing CONST / ENUM single values
 * @param value - node.const or node.enum[I] for parsing
 * @param isNodeNullable  - node.nullable
 * @returns parsed value
 */
export function parseSingleSimpleValue(value: unknown, isNodeNullable = false): ParsedSimpleValue {
  if (typeof value === "string") return `'${value.replace(SINGLE_QUOTE_RE, "\\'")}'`;

  if (typeof value === "number" || typeof value === "boolean") return value;

  if (typeof value === "object") return JSON.stringify(value);

  if (value === null && !isNodeNullable) return "null";

  // Edge case
  return `${value}`;
}

/** Return type of node (works for v2 or v3, as there are no conflicting types) */
type SchemaObjectType =
  | "anyOf"
  | "array"
  | "boolean"
  | "const"
  | "enum"
  | "number"
  | "object"
  | "oneOf"
  | "ref"
  | "string"
  | "unknown";
export function nodeType(obj: any): SchemaObjectType {
  if (!obj || typeof obj !== "object") {
    return "unknown";
  }

  if (obj.$ref) {
    return "ref";
  }

  // const
  if (obj.const) {
    return "const";
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
  if (
    obj.type === "string" ||
    obj.type === "binary" ||
    obj.type === "byte" ||
    obj.type === "date" ||
    obj.type === "dateTime" ||
    obj.type === "password"
  ) {
    return "string";
  }

  // number
  if (obj.type === "integer" || obj.type === "number" || obj.type === "float" || obj.type === "double") {
    return "number";
  }

  // array
  if (obj.type === "array" || obj.items) {
    return "array";
  }

  // object
  if (
    obj.type === "object" ||
    obj.hasOwnProperty("allOf") ||
    obj.hasOwnProperty("anyOf") ||
    obj.hasOwnProperty("oneOf") ||
    obj.hasOwnProperty("properties") ||
    obj.hasOwnProperty("additionalProperties")
  ) {
    return "object";
  }

  // return unknown by default
  return "unknown";
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
    `✘  version missing from schema; specify whether this is OpenAPI v3 or v2 https://swagger.io/specification`
  );
}

/** Decode $ref (https://swagger.io/docs/specification/using-ref/#escape) */
export function decodeRef(ref: string): string {
  return ref.replace(ESC_0_RE, "~").replace(ESC_1_RE, "/").replace(DOUBLE_QUOTE_RE, '\\"');
}

/** Encode $ref (https://swagger.io/docs/specification/using-ref/#escape) */
export function encodeRef(ref: string): string {
  return ref.replace(TILDE_RE, "~0").replace(FS_RE, "~1");
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
  const typesWithValues = types.filter(Boolean);

  if (!typesWithValues.length) return "undefined"; // usually allOf/anyOf with empty input - so it's undefined

  if (typesWithValues.length === 1) return typesWithValues[0]; // don’t add parentheses around one thing
  return `(${typesWithValues.join(") & (")})`;
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
  if (!types.length) return "undefined"; // usually oneOf with empty input - so it's undefined

  if (types.length === 1) return `${types[0]}`; // don’t add parentheses around one thing
  return `(${types.join(") | (")})`;
}
