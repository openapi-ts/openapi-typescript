import type { OasRef, Referenced } from "@redocly/openapi-core";
import { parseRef } from "@redocly/openapi-core/lib/ref-utils.js";
import type { ParameterObject } from "../types.js";

export const JS_PROPERTY_INDEX_RE = /^[A-Za-z_$][A-Za-z_$0-9]*$/;
export const JS_ENUM_INVALID_CHARS_RE = /[^A-Za-z_$0-9]+(.)?/g;
export const JS_PROPERTY_INDEX_INVALID_CHARS_RE = /[^A-Za-z_$0-9]+/g;
export const SPECIAL_CHARACTER_MAP: Record<string, string> = {
  "+": "Plus",
  // Add more mappings as needed
};

/**
 * A generated TypeScript source fragment.
 *
 * Two flavours exist, and mixing them up shifts indentation:
 *
 * - **expression fragments** (`string`, `Foo | Bar`, an object/tuple literal) start
 *   with no leading whitespace and are meant to be appended after `name: ` or `= `.
 *   A multi-line expression still carries the absolute indentation of its own
 *   interior lines, and its closing `}` / `]` sits at the fragment’s `indent`.
 * - **line fragments** (`propertySignature`, `typeAlias`, …) already include the
 *   leading indentation of their own line.
 *
 * Builders preserve the compiler printer's formatting without depending on its
 * API at runtime.
 */
export type TSNode = string;

/** One indentation level. Matches the TypeScript printer’s 4-space default. */
export const INDENT = "    ";

// Primitive type keywords & literals
export const BOOLEAN = "boolean";
export const FALSE = "false";
export const NEVER = "never";
export const NULL = "null";
export const NUMBER = "number";
export const STRING = "string";
export const TRUE = "true";
export const UNDEFINED = "undefined";
export const UNKNOWN = "unknown";

const COMMENT_LB_RE = /\r?\n/g;
const COMMENT_RE = /\*\//g;

export interface AnnotatedSchemaObject {
  const?: unknown; // jsdoc without value
  default?: unknown; // jsdoc with value
  deprecated?: boolean; // jsdoc without value
  description?: string; // jsdoc with value
  enum?: unknown[]; // jsdoc without value
  example?: string; // jsdoc with value
  examples?: unknown;
  format?: string; // not jsdoc
  nullable?: boolean; // Node information
  summary?: string; // not jsdoc
  title?: string; // not jsdoc
  type?: string | string[]; // Type of node
}

/**
 * Render a comment body (the text that follows `/*`, including its leading `*`)
 * into an indented block comment, replaying how the TypeScript printer emitted
 * synthetic leading comments.
 *
 * Note: the printer strips trailing whitespace from every emitted line, which
 * matters for multi-line comments whose continuation lines end in padding.
 */
function renderComment(text: string, indent: string): string {
  const body = `/*${text}*/`;
  return `${indent}${body
    .split("\n")
    .map((line) => line.replace(/[ \t]+$/, ""))
    .join(`\n${indent}`)}`;
}

/**
 * Preparing comments from fields
 * @see {comment} for output examples
 * @returns empty string if no comment, else the JSDoc block (with trailing newline)
 */
export function addJSDocComment(schemaObject: AnnotatedSchemaObject, indent = ""): string {
  if (!schemaObject || typeof schemaObject !== "object" || Array.isArray(schemaObject)) {
    return "";
  }
  const output: string[] = [];

  // Not JSDoc tags: [title, format]
  if (schemaObject.title) {
    output.push(schemaObject.title.trim().replace(COMMENT_LB_RE, "\n *     "));
  }
  if (schemaObject.summary) {
    output.push(schemaObject.summary.trim().replace(COMMENT_LB_RE, "\n *     "));
  }
  if (schemaObject.format) {
    output.push(`Format: ${schemaObject.format}`);
  }

  // JSDoc tags without value
  // 'Deprecated' without value
  if (schemaObject.deprecated) {
    output.push("@deprecated");
  }

  // JSDoc tags with value
  const supportedJsDocTags = ["description", "default", "example"] as const;
  for (const field of supportedJsDocTags) {
    const allowEmptyString = field === "default" || field === "example";
    if (schemaObject[field] === undefined) {
      continue;
    }
    if (schemaObject[field] === "" && !allowEmptyString) {
      continue;
    }
    const serialized =
      typeof schemaObject[field] === "object" ? JSON.stringify(schemaObject[field], null, 2) : schemaObject[field];
    output.push(`@${field} ${String(serialized).trim().replace(COMMENT_LB_RE, "\n *     ")}`);
  }

  if (Array.isArray(schemaObject.examples)) {
    for (const example of schemaObject.examples) {
      const serialized = typeof example === "object" ? JSON.stringify(example, null, 2) : example;
      output.push(`@example ${String(serialized).trim().replace(COMMENT_LB_RE, "\n *     ")}`);
    }
  }

  // JSDoc 'Constant' without value
  if ("const" in schemaObject) {
    output.push("@constant");
  }

  // JSDoc 'Enum' with type
  if (schemaObject.enum) {
    let type = "unknown";
    if (Array.isArray(schemaObject.type)) {
      type = schemaObject.type.join("|");
    } else if (typeof schemaObject.type === "string") {
      type = schemaObject.type;
    }
    output.push(`@enum {${type}${schemaObject.nullable ? "|null" : ""}}`);
  }

  // attach comment if it has content
  if (!output.length) {
    return "";
  }

  // Check if any output item contains multi-line content (has internal line breaks)
  const hasMultiLineContent = output.some((item) => item.includes("\n"));

  let text =
    output.length === 1 && !hasMultiLineContent ? `* ${output.join("\n")} ` : `*\n * ${output.join("\n * ")}\n `;
  text = text.replace(COMMENT_RE, "*\\/"); // prevent inner comments from leaking

  return `${renderComment(text, indent)}\n`;
}

/**
 * Render comment lines as a multi-line JSDoc block, indented at `indent` and
 * terminated by a newline.
 *
 * Public helper for `transformProperty`, which may need to annotate a property
 * (e.g. with validation tags) the same way `addJSDocComment` does internally.
 */
export function tsComment(lines: string[], indent = ""): TSNode {
  // an embedded line break would escape the ` * ` gutter, so flatten each line
  const flat = lines.flatMap((line) => line.split(COMMENT_LB_RE));
  const text = `*\n * ${flat.join("\n * ")}\n `.replace(COMMENT_RE, "*\\/");
  return `${renderComment(text, indent)}\n`;
}

// ---------------------------------------------------------------------------
// Expression fragments
// ---------------------------------------------------------------------------

/** A `{ ... }` object type; renders `{}` when empty. Members are line fragments. */
export function typeLiteral(members: TSNode[], indent = ""): TSNode {
  return members.length ? `{\n${members.join("\n")}\n${indent}}` : "{}";
}

/**
 * A `[ ... ]` tuple type. Always multi-line, like the TypeScript printer
 * (even when empty or single-element). Elements are expression fragments.
 */
export function tupleType(elements: TSNode[], indent = ""): TSNode {
  if (!elements.length) {
    return `[\n${indent}]`;
  }
  const elementIndent = `${indent}${INDENT}`;
  return `[\n${elements.map((e) => `${elementIndent}${e}`).join(",\n")}\n${indent}]`;
}

/**
 * Deduplicate simple primitive types from an array of nodes
 * Note: won’t deduplicate complex types like objects
 */
export function tsDedupe(types: TSNode[]): TSNode[] {
  const encounteredTypes = new Set<string>();
  const filteredTypes: TSNode[] = [];
  for (const t of types) {
    // only deduplicate primitive keyword types (literals are left untouched)
    if (tsIsPrimitive(t)) {
      if (encounteredTypes.has(t)) {
        continue;
      }
      encounteredTypes.add(t);
    }
    filteredTypes.push(t);
  }
  return filteredTypes;
}

/**
 * Is this a primitive keyword type?
 *
 * Note: this intentionally matches the legacy AST check, which only recognised
 * keyword type nodes (`boolean`, `never`, `null`, `number`, `string`,
 * `undefined`) — not `true`/`false` and not literal types.
 */
export function tsIsPrimitive(type: TSNode): boolean {
  if (!type) {
    return true;
  }
  return (
    type === BOOLEAN || type === NEVER || type === NULL || type === NUMBER || type === STRING || type === UNDEFINED
  );
}

function renderNumberLiteral(value: number): string {
  return value < 0 ? `-${Math.abs(value)}` : String(value);
}

/** `\uXXXX` escape for a UTF-16 code unit (TypeScript’s `encodeUtf16EscapeSequence`). */
function encodeUtf16EscapeSequence(charCode: number): string {
  return `\\u${charCode.toString(16).toUpperCase().padStart(4, "0")}`;
}

// TypeScript’s `escapedCharsMap`
const ESCAPED_CHARS_MAP: Record<string, string> = {
  "\t": "\\t",
  "\v": "\\v",
  "\f": "\\f",
  "\b": "\\b",
  "\r": "\\r",
  "\n": "\\n",
  "\\": "\\\\",
  '"': '\\"',
  "\u2028": "\\u2028", // line separator
  "\u2029": "\\u2029", // paragraph separator
  "\u0085": "\\u0085", // next line
};

/**
 * Render a TypeScript string literal the way the printer does for a synthesized
 * `ts.factory.createStringLiteral`.
 *
 * That is `escapeNonAsciiString`: apply TypeScript’s escape map (which covers
 * `\`, `"`, the C0 controls, U+2028, U+2029 and U+0085), then escape every
 * remaining code unit above U+007F as `\uXXXX`. Without the second pass,
 * `"emoji🎉"` would be emitted raw where the compiler emits
 * `"emoji\uD83C\uDF89"`.
 *
 * Note this is deliberately *not* used by {@link tsLiteral}, which mirrors the
 * legacy `createIdentifier(JSON.stringify(value))` workaround for
 * https://github.com/microsoft/TypeScript/issues/36174 and therefore keeps
 * non-ASCII characters verbatim.
 */
function tsStringLiteral(value: string): string {
  let out = '"';
  for (let i = 0; i < value.length; i++) {
    const code = value.charCodeAt(i);
    const char = value[i];
    if (code === 0) {
      // TypeScript emits `\x00` when a digit follows, so the escape cannot be
      // misread as an octal escape plus that digit
      const lookAhead = value.charCodeAt(i + 1);
      out += lookAhead >= 48 && lookAhead <= 57 ? "\\x00" : "\\0";
    } else if (ESCAPED_CHARS_MAP[char] !== undefined) {
      out += ESCAPED_CHARS_MAP[char];
    } else if (code <= 0x1f || code > 0x7f) {
      out += encodeUtf16EscapeSequence(code);
    } else {
      out += char;
    }
  }
  return `${out}"`;
}

/** Create a literal type */
export function tsLiteral(value: unknown, indent = ""): TSNode {
  if (typeof value === "string") {
    // workaround for UTF-8: https://github.com/microsoft/TypeScript/issues/36174
    return JSON.stringify(value);
  }
  if (typeof value === "number") {
    return renderNumberLiteral(value);
  }
  if (typeof value === "boolean") {
    return value === true ? TRUE : FALSE;
  }
  if (value === null) {
    return NULL;
  }
  if (Array.isArray(value)) {
    if (value.length === 0) {
      return `${NEVER}[]`;
    }
    const elementIndent = `${indent}${INDENT}`;
    return tupleType(
      value.map((v: unknown) => tsLiteral(v, elementIndent)),
      indent,
    );
  }
  if (typeof value === "object") {
    const memberIndent = `${indent}${INDENT}`;
    const keys: TSNode[] = [];
    for (const [k, v] of Object.entries(value)) {
      keys.push(
        propertySignature({
          name: tsPropertyIndex(k),
          type: tsLiteral(v, memberIndent),
          indent: memberIndent,
        }),
      );
    }
    return keys.length ? typeLiteral(keys, indent) : tsRecord(STRING, NEVER);
  }
  return UNKNOWN;
}

/** Create a T | null union */
export function tsNullable(types: TSNode[]): TSNode {
  return [...types.map(tsParenthesize), NULL].join(" | ");
}

/** Create a TS Omit<X, Y> type */
export function tsOmit(type: TSNode, keys: string[]): TSNode {
  return `Omit<${type}, ${tsUnion(keys.map((k) => tsLiteral(k)))}>`;
}

/** Create a TS Record<X, Y> type */
export function tsRecord(key: TSNode, value: TSNode): TSNode {
  return `Record<${key}, ${value}>`;
}

/** Create a valid property index */
export function tsPropertyIndex(index: string | number): string {
  if (
    (typeof index === "number" && !(index < 0)) ||
    (typeof index === "string" && String(Number(index)) === index && index[0] !== "-")
  ) {
    return String(index);
  }
  return typeof index === "string" && JS_PROPERTY_INDEX_RE.test(index) ? index : tsStringLiteral(String(index));
}

/** Create a union type */
export function tsUnion(types: TSNode[]): TSNode {
  if (types.length === 0) {
    return NEVER;
  }
  if (types.length === 1) {
    return types[0];
  }
  return tsDedupe(types).map(tsParenthesize).join(" | ");
}

/** Create an intersection type */
export function tsIntersection(types: TSNode[]): TSNode {
  if (types.length === 0) {
    return NEVER;
  }
  if (types.length === 1) {
    return types[0];
  }
  return tsDedupe(types).map(tsParenthesize).join(" & ");
}

/**
 * Wrap an expression in parentheses when it is a type form that binds looser
 * than its enclosing construct.
 *
 * Reproduces the TypeScript printer, which parenthesizes unions, intersections,
 * function types and conditional types when they are a member of another
 * union/intersection, an array element type, or the operand of an operator such
 * as `readonly`. Without this, `(a: string) => number | null` would parse as
 * `(a: string) => (number | null)`.
 */
export function tsParenthesize(expression: TSNode): TSNode {
  return needsParentheses(expression) ? `(${expression})` : expression;
}

/** Create an array type, preserving the precedence of its element type. */
export function tsArray(elementType: TSNode): TSNode {
  return `${needsParentheses(elementType, true) ? `(${elementType})` : elementType}[]`;
}

/** Skip a `"…"` or `'…'` literal, returning the index of its closing quote. */
function skipQuoted(expression: TSNode, start: number, quote: string): number {
  for (let i = start + 1; i < expression.length; i++) {
    const ch = expression[i];
    if (ch === "\\") {
      i++;
      continue;
    }
    if (ch === quote) {
      return i;
    }
  }
  return expression.length - 1;
}

/** Skip a `//` comment, returning the index of its line terminator. */
function skipLineComment(expression: TSNode, start: number): number {
  for (let i = start + 2; i < expression.length; i++) {
    const ch = expression[i];
    if (ch === "\n" || ch === "\r" || ch === "\u2028" || ch === "\u2029") {
      return i;
    }
  }
  return expression.length - 1;
}

/** Skip a `` `…` `` template literal (including `${…}` substitutions). */
function skipTemplate(expression: TSNode, start: number): number {
  for (let i = start + 1; i < expression.length; i++) {
    const ch = expression[i];
    if (ch === "\\") {
      i++;
      continue;
    }
    if (ch === "$" && expression[i + 1] === "{") {
      let braceDepth = 1;
      i += 2;
      while (i < expression.length && braceDepth > 0) {
        if (expression[i] === '"' || expression[i] === "'") {
          i = skipQuoted(expression, i, expression[i]);
        } else if (expression[i] === "`") {
          i = skipTemplate(expression, i);
        } else if (expression[i] === "/" && expression[i + 1] === "*") {
          const end = expression.indexOf("*/", i + 2);
          i = end === -1 ? expression.length - 1 : end + 1;
        } else if (expression[i] === "/" && expression[i + 1] === "/") {
          i = skipLineComment(expression, i);
        } else if (expression[i] === "{") {
          braceDepth++;
        } else if (expression[i] === "}") {
          braceDepth--;
        }
        i++;
      }
      i--;
      continue;
    }
    if (ch === "`") {
      return i;
    }
  }
  return expression.length - 1;
}

/** Remove surrounding whitespace/comments for type-shape checks, retaining inner source text. */
export function stripTypeTrivia(expression: TSNode): TSNode {
  let start = -1;
  let end = 0;
  for (let i = 0; i < expression.length; i++) {
    const ch = expression[i];
    if (/\s/.test(ch)) {
      continue;
    }
    if (ch === "/" && expression[i + 1] === "*") {
      const close = expression.indexOf("*/", i + 2);
      i = close === -1 ? expression.length - 1 : close + 1;
      continue;
    }
    if (ch === "/" && expression[i + 1] === "/") {
      i = skipLineComment(expression, i);
      continue;
    }
    if (start === -1) {
      start = i;
    }
    if (ch === '"' || ch === "'") {
      i = skipQuoted(expression, i, ch);
    } else if (ch === "`") {
      i = skipTemplate(expression, i);
    }
    end = i + 1;
  }
  return start === -1 ? "" : expression.slice(start, end);
}

/**
 * Does this expression contain a union, intersection, function type or
 * conditional type at nesting depth 0?
 *
 * Strings, template literals, comments and bracketed groups are skipped so that,
 * e.g., `Omit<X, "a" | "b">` is not mistaken for a union, and prose inside a
 * generated JSDoc block (which may contain apostrophes or braces) cannot
 * unbalance the scan. `=>` is consumed as a single token so that its `>` cannot
 * unbalance the angle-bracket depth.
 */
function needsParentheses(expression: TSNode, postfix = false): boolean {
  let depth = 0;
  for (let i = 0; i < expression.length; i++) {
    const ch = expression[i];
    if (ch === '"' || ch === "'") {
      i = skipQuoted(expression, i, ch);
      continue;
    }
    if (ch === "`") {
      i = skipTemplate(expression, i);
      continue;
    }
    if (ch === "/" && expression[i + 1] === "*") {
      const end = expression.indexOf("*/", i + 2);
      i = end === -1 ? expression.length - 1 : end + 1;
      continue;
    }
    if (ch === "/" && expression[i + 1] === "/") {
      i = skipLineComment(expression, i);
      continue;
    }
    if (ch === "=" && expression[i + 1] === ">") {
      // a function type is not bracketed, so it always needs parentheses here
      if (depth === 0) {
        return true;
      }
      i++; // consume the `>`, which does not close an angle bracket
      continue;
    }
    if (ch === "{" || ch === "[" || ch === "(" || ch === "<") {
      depth++;
      continue;
    }
    if (ch === "}" || ch === "]" || ch === ")" || ch === ">") {
      depth--;
      continue;
    }
    if (depth !== 0) {
      continue;
    }
    if (ch === "|" || ch === "&") {
      return true;
    }
    // Array syntax binds more tightly than type operators, type queries and
    // inference: `readonly T[][]` and `(readonly T[])[]` describe different types.
    if (postfix && /[A-Za-z_$]/.test(ch)) {
      const keyword = /^(readonly|keyof|typeof|unique|infer)\b/.exec(expression.slice(i));
      if (keyword && (i === 0 || !/[\w$.]/.test(expression[i - 1]))) {
        return true;
      }
    }
    // conditional type: `T extends U ? X : Y`
    if (ch === "e" && expression.startsWith("extends", i)) {
      const before = i === 0 ? "" : expression[i - 1];
      const after = expression[i + 7] ?? "";
      if (!/[\w$]/.test(before) && !/[\w$]/.test(after)) {
        return true;
      }
    }
  }
  return false;
}

// ---------------------------------------------------------------------------
// Line fragments
// ---------------------------------------------------------------------------

export interface PropertySignatureOptions {
  /** Already-rendered property name (see {@link tsPropertyIndex}) */
  name: string;
  /** Expression fragment rendered at `indent` */
  type: TSNode;
  optional?: boolean;
  readonly?: boolean;
  /** Comment block returned by {@link addJSDocComment} */
  comment?: string;
  indent: string;
}

/** A `name: type;` property signature, with optional `readonly` / `?` / JSDoc. */
export function propertySignature({
  name,
  type,
  optional,
  readonly,
  comment = "",
  indent,
}: PropertySignatureOptions): TSNode {
  return `${comment}${indent}${readonly ? "readonly " : ""}${name}${optional ? "?" : ""}: ${type};`;
}

export interface IndexSignatureOptions {
  keyName: string;
  /** Key type rendered at `indent` (default: `string`) */
  keyType?: TSNode;
  /** Value type rendered at `indent` */
  valueType: TSNode;
  readonly?: boolean;
  indent: string;
}

/** An `[key: string]: value;` index signature. */
export function indexSignature({
  keyName,
  keyType = STRING,
  valueType,
  readonly,
  indent,
}: IndexSignatureOptions): TSNode {
  return `${indent}${readonly ? "readonly " : ""}[${keyName}: ${keyType}]: ${valueType};`;
}

export interface DeclarationOptions {
  export?: boolean;
  /** Comment block returned by {@link addJSDocComment} */
  comment?: string;
  indent: string;
}

/** An `export type Name = Type;` alias. */
export function typeAlias(
  name: string,
  type: TSNode,
  { export: isExport, comment = "", indent }: DeclarationOptions,
): TSNode {
  return `${comment}${indent}${isExport ? "export " : ""}type ${name} = ${type};`;
}

/** An `export interface Name { ... }` declaration. Members are line fragments. */
export function interfaceDecl(
  name: string,
  members: TSNode[],
  { export: isExport, comment = "", indent }: DeclarationOptions,
): TSNode {
  const head = `${comment}${indent}${isExport ? "export " : ""}interface ${name}`;
  return members.length ? `${head} {\n${members.join("\n")}\n${indent}}` : `${head} {\n${indent}}`;
}

/** An `export enum Name { ... }` declaration. Members are un-indented fragments. */
export function enumDecl(
  name: string,
  members: TSNode[],
  { export: isExport, comment = "", indent }: DeclarationOptions,
): TSNode {
  const head = `${comment}${indent}${isExport ? "export " : ""}enum ${name}`;
  if (!members.length) {
    return `${head} {\n${indent}}`;
  }
  const memberIndent = `${indent}${INDENT}`;
  const body = members
    .map((m) =>
      m
        .split("\n")
        .map((line) => `${memberIndent}${line}`)
        .join("\n"),
    )
    .join(",\n");
  return `${head} {\n${body}\n${indent}}`;
}

/** Create an exported TS array literal expression */
export function tsArrayLiteralExpression(
  name: string,
  elementType: TSNode,
  values: (string | number)[],
  options?: { export?: boolean; readonly?: boolean; injectFooter?: FooterDeclaration[]; indent?: string },
): TSNode {
  let variableName = sanitizeMemberName(name);
  variableName = `${variableName[0].toLowerCase()}${variableName.substring(1)}`;

  if (options?.injectFooter && !options.injectFooter.includes(HELPER_FLATTENED_DEEP_REQUIRED)) {
    options.injectFooter.push(HELPER_FLATTENED_DEEP_REQUIRED);
  }

  const arrayType = options?.readonly ? tsReadonlyArray(elementType, options.injectFooter) : tsArray(elementType);

  const literal = values
    .map((value) => (typeof value === "number" ? renderNumberLiteral(value) : tsStringLiteral(value)))
    .join(", ");

  const indent = options?.indent ?? "";
  return `${indent}${options?.export ? "export " : ""}const ${variableName}: ${arrayType} = [${literal}];`;
}

function sanitizeMemberName(name: string) {
  let sanitizedName = name.replace(JS_ENUM_INVALID_CHARS_RE, (c) => {
    const last = c[c.length - 1];
    return JS_PROPERTY_INDEX_INVALID_CHARS_RE.test(last) ? "" : last.toUpperCase();
  });
  if (Number(name[0]) >= 0) {
    sanitizedName = `Value${name}`;
  }
  return sanitizedName;
}

/** Sanitize TS enum member expression */
export function tsEnumMember(value: string | number, metadata: { name?: string; description?: string | null } = {}) {
  let name = metadata.name ?? String(value);
  if (!JS_PROPERTY_INDEX_RE.test(name)) {
    if (Number(name[0]) >= 0) {
      name = `Value${name}`.replace(".", "_"); // don't forged decimals;
    } else if (name[0] === "-") {
      name = `ValueMinus${name.slice(1)}`;
    }

    const invalidCharMatch = name.match(JS_PROPERTY_INDEX_INVALID_CHARS_RE);
    if (invalidCharMatch) {
      if (invalidCharMatch[0] === name) {
        name = `"${name}"`;
      } else {
        name = name.replace(JS_PROPERTY_INDEX_INVALID_CHARS_RE, (s) => {
          return s in SPECIAL_CHARACTER_MAP ? SPECIAL_CHARACTER_MAP[s] : "_";
        });
      }
    }
  }

  const literal = typeof value === "number" ? renderNumberLiteral(value) : tsStringLiteral(value);
  const member = `${name} = ${literal}`;

  const trimmedDescription = metadata.description?.trim();
  if (trimmedDescription === undefined || trimmedDescription === null || trimmedDescription === "") {
    return member;
  }

  // `//` comments end at the first line break, so a multi-line description would
  // otherwise leak a bare token into the enum body and produce invalid TypeScript
  const description = trimmedDescription.replace(COMMENT_LB_RE, " ");

  // equivalent of ts.addSyntheticLeadingComment(member, SingleLineCommentTrivia, ` ${desc}`, true)
  return `// ${description}\n${member}`;
}

export type EnumResult = { name: string; declaration: TSNode };

export const enumCache = new Map<string, EnumResult>();

/** Create a TS enum (with sanitized name and members) */
export function tsEnum(
  name: string,
  members: (string | number)[],
  metadata?: { name?: string; description?: string | null }[],
  options?: { export?: boolean; shouldCache?: boolean; indent?: string },
): EnumResult {
  let enumName = sanitizeMemberName(name);
  enumName = `${enumName[0].toUpperCase()}${enumName.substring(1)}`;
  let key = "";
  if (options?.shouldCache) {
    key = `${members
      .slice(0)
      .sort()
      .map((v, i) => {
        return `${metadata?.[i]?.name ?? String(v)}:${metadata?.[i]?.description || ""}`;
      })
      .join(",")}`;
    if (enumCache.has(key)) {
      return enumCache.get(key) as EnumResult;
    }
  }
  const result: EnumResult = {
    name: enumName,
    declaration: enumDecl(
      enumName,
      members.map((value, i) => tsEnumMember(value, metadata?.[i])),
      { export: options?.export ?? false, indent: options?.indent ?? "" },
    ),
  };
  options?.shouldCache && enumCache.set(key, result);
  return result;
}

const HELPER_FLATTENED_DEEP_REQUIRED = `type FlattenedDeepRequired<T> = {
    [K in keyof T]-?: FlattenedDeepRequired<T[K] extends unknown[] | undefined | null ? Extract<T[K], unknown[]>[number] : T[K]>;
};`;
const HELPER_WITH_REQUIRED = `type WithRequired<T, K extends keyof T> = T & {
    [P in K]-?: T[P];
};`;
const HELPER_READONLY_ARRAY = `type ReadonlyArray<T> = [
    Exclude<T, undefined>
] extends [
    unknown[]
] ? Readonly<Exclude<T, undefined>> : Readonly<Exclude<T, undefined>[]>;`;

/**
 * An injected footer entry: either an already-rendered declaration, or a
 * deferred one that only becomes renderable once generation is complete.
 */
export type FooterDeclaration = TSNode | OperationsDeclaration;

/**
 * Mutable holder for the top-level `operations` interface, which is filled in
 * incrementally as operations are discovered. It is rendered at assembly time so
 * the declaration keeps its original position among the injected footer types.
 */
export class OperationsDeclaration {
  members: TSNode[] = [];

  add(member: TSNode): void {
    this.members.push(member);
  }

  render(): TSNode {
    return interfaceDecl("operations", this.members, { export: true, indent: "" });
  }
}

/** Render a footer entry, resolving deferred declarations. */
export function renderFooterDeclaration(declaration: FooterDeclaration): TSNode {
  return typeof declaration === "string" ? declaration : declaration.render();
}

/** Create a WithRequired<X, Y> type */
export function tsWithRequired(
  type: TSNode,
  keys: string[],
  injectFooter: FooterDeclaration[], // needed to inject type helper if used
): TSNode {
  if (keys.length === 0) {
    return type;
  }

  // inject helper, if needed
  if (!injectFooter.includes(HELPER_WITH_REQUIRED)) {
    injectFooter.push(HELPER_WITH_REQUIRED);
  }

  return `WithRequired<${type}, ${tsUnion(keys.map((k) => tsLiteral(k)))}>`;
}

/**
 * Enhanced ReadonlyArray.
 * eg: type Foo = ReadonlyArray<T>; type Bar = ReadonlyArray<T[]>
 * Foo and Bar are both of type `readonly T[]`
 */
export function tsReadonlyArray(type: TSNode, injectFooter?: FooterDeclaration[]): TSNode {
  if (injectFooter && !injectFooter.includes(HELPER_READONLY_ARRAY)) {
    injectFooter.push(HELPER_READONLY_ARRAY);
  }
  return `ReadonlyArray<${type}>`;
}

// ---------------------------------------------------------------------------
// $ref → indexed access
// ---------------------------------------------------------------------------

function isOasRef<T>(obj: Referenced<T>): obj is OasRef {
  return Boolean((obj as OasRef).$ref);
}
type OapiRefResolved = Referenced<ParameterObject>;

function isParameterObject(obj: OapiRefResolved | undefined): obj is ParameterObject {
  return Boolean(obj && !isOasRef(obj) && obj.in);
}

/** `[segment]` indexed access, with numeric segments left unquoted. */
function addIndexedAccess(node: TSNode, ...segments: readonly (string | number)[]): TSNode {
  return segments.reduce<TSNode>(
    (acc, segment) => `${acc}[${typeof segment === "number" ? String(segment) : tsStringLiteral(segment)}]`,
    node,
  );
}

/**
 * Wrap a type with `Extract<T, { propertyName: unknown }>` to narrow a union
 * type before accessing a property that only exists on some variants.
 */
function wrapWithExtract(type: TSNode, propertyName: string, indent: string): TSNode {
  const member = propertySignature({
    name: propertyName,
    type: UNKNOWN,
    indent: `${indent}${INDENT}`,
  });
  return `Extract<${type}, ${typeLiteral([member], indent)}>`;
}

export interface OapiRefOptions {
  /** Whether to wrap with FlattenedDeepRequired<> (default: false) */
  deep?: boolean;
  /** Array of property names to wrap with Extract<> when accessing */
  extractProperties?: string[];
  /** Indentation of the line this reference is rendered on (default: "") */
  indent?: string;
}

/**
 * Convert OpenAPI ref into TS indexed access node (ex: `components["schemas"]["Foo"]`)
 * `path` is a JSON Pointer to a location within an OpenAPI document.
 * Transform it into a TypeScript type reference into the generated types.
 *
 * In most cases the structures of the openapi-typescript generated types and the
 * JSON Pointer paths into the OpenAPI document are the same. However, in some cases
 * special transformations are necessary to account for the ways they differ.
 *   * Object schemas
 *       $refs into the `properties` of object schemas are valid, but openapi-typescript
 *       flattens these objects, so we omit  so the index into the schema skips ["properties"]
 *   * Parameters
 *       $refs into the `parameters` of paths are valid, but openapi-ts represents
 *       them according to their type; path, query, header, etc… so in these cases we
 *       must check the parameter definition to determine the how to index into
 *       the openapi-typescript type.
 *   * Union variant properties (oneOf/anyOf)
 *       When accessing properties that may only exist on some variants of a union type,
 *       we use Extract<> to narrow the type before each property access.
 **/
export function oapiRef(path: string, resolved?: OapiRefResolved, options: OapiRefOptions = {}): TSNode {
  const { pointer } = parseRef(path);
  if (pointer.length === 0) {
    throw new Error(`Error parsing $ref: ${path}. Is this a valid $ref?`);
  }

  const indent = options.indent ?? "";
  const parametersObject = isParameterObject(resolved);
  const extractSet = new Set(options.extractProperties ?? []);

  // Initial segments are handled in a fixed , then remaining segments are treated
  // according to heuristics based on the initial segments
  const initialSegment = pointer[0];
  const leadingSegments = pointer.slice(1, 3);
  const restSegments = pointer.slice(3);

  const leadingType = addIndexedAccess(
    options.deep ? `FlattenedDeepRequired<${String(initialSegment)}>` : String(initialSegment),
    ...leadingSegments,
  );

  return restSegments.reduce<TSNode>((acc, segment, index, original) => {
    // Skip `properties` items when in the middle of the pointer
    // See: https://github.com/openapi-ts/openapi-typescript/issues/1742
    if (segment === "properties") {
      return acc;
    }

    if (parametersObject && index === original.length - 1) {
      return addIndexedAccess(acc, resolved.in, resolved.name);
    }

    // If this segment is in the extractProperties list,
    // wrap the current type with Extract<T, { segment: unknown }> before accessing.
    // This narrows union types to variants that have this property.
    if (extractSet.has(segment)) {
      const narrowedType = wrapWithExtract(acc, segment, indent);
      return addIndexedAccess(narrowedType, segment);
    }

    return addIndexedAccess(acc, segment);
  }, leadingType);
}

/**
 * Normalize generated source into a complete file body.
 *
 * Generation now emits strings directly, so this only joins a list of top-level
 * declarations and ensures a trailing newline. It remains exported
 * for compatibility with code written against the AST-based API.
 */
export function astToString(ast: TSNode | TSNode[]): string;
export function astToString(ast: TSNode | TSNode[], ...removedOptions: unknown[]): string {
  if (removedOptions.length > 0) {
    throw new TypeError("astToString no longer accepts printer options. Format the returned source separately.");
  }
  if (typeof ast !== "string" && !(Array.isArray(ast) && ast.every((node) => typeof node === "string"))) {
    throw new TypeError("astToString expects generated source strings; TypeScript AST nodes are no longer supported.");
  }
  const text = Array.isArray(ast) ? ast.join("\n") : ast;
  return text.endsWith("\n") ? text : `${text}\n`;
}
