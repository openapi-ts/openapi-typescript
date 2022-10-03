type CommentObject = {
  const?: unknown; // jsdoc without value
  default?: unknown; // jsdoc with value
  deprecated?: boolean; // jsdoc without value
  description?: string; // jsdoc with value
  enum?: unknown[]; // jsdoc without value
  example?: string; // jsdoc with value
  format?: string; // not jsdoc
  nullable?: boolean; // Node information
  summary?: string; // not jsdoc
  title?: string; // not jsdoc
  type?: string | string[]; // Type of node
};

const COMMENT_RE = /\*\//g;
export const LB_RE = /\r?\n/g;
export const DOUBLE_QUOTE_RE = /"/g;
const ESC_0_RE = /~0/g;
const ESC_1_RE = /~1/g;
const TILDE_RE = /~/g;
const FS_RE = /\//g;
const TS_UNION_INTERSECTION_RE = /[&|]/;
const JS_OBJ_KEY = /^[A-Za-z0-9_$]+$/;

/**
 * Preparing comments from fields
 * @see {comment} for output examples
 * @returns void if not comments or jsdoc format comment string
 */
export function getSchemaObjectComment(v: CommentObject, indentLv?: number): string | undefined {
  if (!v || typeof v !== "object") return;
  const output: string[] = [];

  // * Not JSDOC tags: [title, format]
  if (v.title) output.push(`${v.title} `);
  if (v.summary) output.push(`${v.summary} `);
  if (v.format) output.push(`Format: ${v.format} `);

  // * JSDOC tags without value
  // 'Deprecated' without value
  if (v.deprecated) output.push(`@deprecated `);

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
    output.push(`@${field} ${serialized} `);
  }

  // * JSDOC 'Constant' without value
  if ("const" in v) output.push(`@constant `);

  // * JSDOC 'Enum' with type
  if (v.enum) {
    let type = "unknown";
    if (Array.isArray(v.type)) type = v.type.join("|");
    else if (typeof v.type === "string") type = v.type;
    output.push(`@enum {${type}${v.nullable ? `|null` : ""}}`);
  }

  return output.length ? comment(output.join("\n"), indentLv) : undefined;
}

/** wrap any string in a JSDoc-style comment wrapper */
export function comment(text: string, indentLv?: number): string {
  const commentText = text.trim().replace(COMMENT_RE, "*\\/");

  // if single-line comment
  if (commentText.indexOf("\n") === -1) return `/** ${commentText} */`;

  // if multi-line comment
  const ln = indent(" * ", indentLv || 0);
  return ["/**", `${ln}${commentText.replace(LB_RE, `\n${ln}`)}`, indent(" */", indentLv || 0)].join("\n");
}

/** handle any valid $ref */
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

const INDEX_PARTS_RE = /\[("(\\"|[^"])+"|'(\\'|[^'])+')]/g;

/** Parse TS index */
export function parseTSIndex(type: string): string[] {
  const parts: string[] = [];
  const bracketI = type.indexOf("[");
  if (bracketI === -1) return [type];

  parts.push(type.substring(0, bracketI));
  const matches = type.match(INDEX_PARTS_RE);
  if (matches) {
    for (const m of matches) parts.push(m.substring('["'.length, m.length - '"]'.length));
  }
  return parts;
}

/** Make TS index */
export function makeTSIndex(parts: string[]): string {
  return `${parts[0]}[${parts.slice(1).map(escStr).join("][")}]`;
}

export type ParsedSimpleValue = string | number | boolean;

/** decode $ref (https://swagger.io/docs/specification/using-ref/#escape) */
export function decodeRef(ref: string): string {
  return ref.replace(ESC_0_RE, "~").replace(ESC_1_RE, "/").replace(DOUBLE_QUOTE_RE, '\\"');
}

/** encode $ref (https://swagger.io/docs/specification/using-ref/#escape) */
export function encodeRef(ref: string): string {
  return ref.replace(TILDE_RE, "~0").replace(FS_RE, "~1");
}

/** T[] */
export function tsArrayOf(type: string): string {
  return `(${type})[]`;
}

/** X & Y & Z; */
export function tsIntersectionOf(...types: string[]): string {
  if (types.length === 1) return String(types[0]); // don’t add parentheses around one thing
  return types.map((t) => (TS_UNION_INTERSECTION_RE.test(t) ? `(${t})` : t)).join(" & ");
}

/** NonNullable<T> */
export function tsNonNullable(type: string): string {
  return `NonNullable<${type}>`;
}

/** OneOf<T> (custom) */
export function tsOneOf(...types: string[]): string {
  if (types.length === 1) return types[0];
  return `OneOf<[${types.join(", ")}]>`;
}

/** Pick<T> */
export function tsPick(root: string, keys: string[]): string {
  return `Pick<${root}, ${tsUnionOf(...keys.map(escStr))}>`;
}

/** Omit<T> */
export function tsOmit(root: string, keys: string[]): string {
  return `Omit<${root}, ${tsUnionOf(...keys.map(escStr))}>`;
}

/** make a given property key optional */
export function tsOptionalProperty(key: string): string {
  return `${key}?`;
}

/** make a given type readonly */
export function tsReadonly(type: string): string {
  return `readonly ${type}`;
}

/** [T, A, B, ...] */
export function tsTupleOf(...types: string[]): string {
  return `[${types.join(", ")}]`;
}

/** X | Y | Z */
export function tsUnionOf(...types: Array<string | number | boolean>): string {
  if (types.length === 1) return String(types[0]); // don’t add parentheses around one thing
  return types.map((t) => (TS_UNION_INTERSECTION_RE.test(String(t)) ? `(${t})` : t)).join(" | ");
}

/** escape string value */
export function escStr(input: string): string {
  if (typeof input !== "string") return input;
  return `"${input.trim().replace(DOUBLE_QUOTE_RE, '\\"')}"`;
}

/** surround a JS object key with quotes, if needed */
export function escObjKey(input: string): string {
  return JS_OBJ_KEY.test(input) ? input : escStr(input);
}

/** Indent a string */
export function indent(input: string, level: number) {
  return "  ".repeat(level).concat(input);
}

/** call Object.entries() and optionally sort */
export function getEntries<T>(obj: ArrayLike<T> | Record<string, T>, alphabetize?: boolean) {
  const entries = Object.entries(obj);
  if (alphabetize) entries.sort(([a], [b]) => a.localeCompare(b, "en", { numeric: true }));
  return entries;
}

/** verify OpenAPI version of an unknown schema */
export function checkOpenAPIVersion(schema: Record<string, unknown | undefined>): void {
  if ("swagger" in schema && typeof schema.swagger === "string")
    throw new Error("Swagger 2.0 and older no longer supported. Please use v5.");
  if ("openapi" in schema && typeof schema.openapi === "string") {
    const version = parseInt(schema.openapi);
    if (version <= 2 || version >= 4)
      throw new Error(`Unknown OpenAPI version "${schema.version}". Only 3.x is supported.`);
  }
}
