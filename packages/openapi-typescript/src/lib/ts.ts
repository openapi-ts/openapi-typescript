import { parseRef } from "@redocly/openapi-core/lib/ref-utils.js";
import ts, { type LiteralTypeNode, type TypeLiteralNode } from "typescript";

export const JS_PROPERTY_INDEX_RE = /^[A-Za-z_$][A-Za-z_$0-9]*$/;
export const JS_ENUM_INVALID_CHARS_RE = /[^A-Za-z_$0-9]+(.)?/g;
export const JS_PROPERTY_INDEX_INVALID_CHARS_RE = /[^A-Za-z_$0-9]+/g;
export const SPECIAL_CHARACTER_MAP: Record<string, string> = {
  "+": "Plus",
  // Add more mappings as needed
};

export const BOOLEAN = ts.factory.createKeywordTypeNode(ts.SyntaxKind.BooleanKeyword);
export const FALSE = ts.factory.createLiteralTypeNode(ts.factory.createFalse());
export const NEVER = ts.factory.createKeywordTypeNode(ts.SyntaxKind.NeverKeyword);
export const NULL = ts.factory.createLiteralTypeNode(ts.factory.createNull());
export const NUMBER = ts.factory.createKeywordTypeNode(ts.SyntaxKind.NumberKeyword);
export const QUESTION_TOKEN = ts.factory.createToken(ts.SyntaxKind.QuestionToken);
export const STRING = ts.factory.createKeywordTypeNode(ts.SyntaxKind.StringKeyword);
export const TRUE = ts.factory.createLiteralTypeNode(ts.factory.createTrue());
export const UNDEFINED = ts.factory.createKeywordTypeNode(ts.SyntaxKind.UndefinedKeyword);
export const UNKNOWN = ts.factory.createKeywordTypeNode(ts.SyntaxKind.UnknownKeyword);

const LB_RE = /\r?\n/g;
const COMMENT_RE = /\*\//g;

export interface AnnotatedSchemaObject {
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
}

/**
 * Preparing comments from fields
 * @see {comment} for output examples
 * @returns void if not comments or jsdoc format comment string
 */
export function addJSDocComment(schemaObject: AnnotatedSchemaObject, node: ts.PropertySignature): void {
  if (!schemaObject || typeof schemaObject !== "object" || Array.isArray(schemaObject)) {
    return;
  }
  const output: string[] = [];

  // Not JSDoc tags: [title, format]
  if (schemaObject.title) {
    output.push(schemaObject.title.replace(LB_RE, "\n *     "));
  }
  if (schemaObject.summary) {
    output.push(schemaObject.summary.replace(LB_RE, "\n *     "));
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
    output.push(`@${field} ${String(serialized).replace(LB_RE, "\n *     ")}`);
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

  if (output.length) {
    let text =
      output.length === 1
        ? `* ${output.join("\n")} `
        : `*
 * ${output.join("\n * ")}\n `;
    text = text.replace(COMMENT_RE, "*\\/"); // prevent inner comments from leaking

    ts.addSyntheticLeadingComment(
      /* node               */ node,
      /* kind               */ ts.SyntaxKind.MultiLineCommentTrivia, // note: MultiLine just refers to a "/* */" comment
      /* text               */ text,
      /* hasTrailingNewLine */ true,
    );
  }
}

/** Convert OpenAPI ref into TS indexed access node (ex: `components["schemas"]["Foo"]`) */
export function oapiRef(path: string): ts.TypeNode {
  const { pointer } = parseRef(path);
  if (pointer.length === 0) {
    throw new Error(`Error parsing $ref: ${path}. Is this a valid $ref?`);
  }
  let t: ts.TypeReferenceNode | ts.IndexedAccessTypeNode = ts.factory.createTypeReferenceNode(
    ts.factory.createIdentifier(String(pointer[0])),
  );
  if (pointer.length > 1) {
    for (let i = 1; i < pointer.length; i++) {
      // Skip `properties` items when in the middle of the pointer
      // See: https://github.com/openapi-ts/openapi-typescript/issues/1742
      if (i > 2 && i < pointer.length - 1 && pointer[i] === "properties") {
        continue;
      }
      t = ts.factory.createIndexedAccessTypeNode(
        t,
        ts.factory.createLiteralTypeNode(
          typeof pointer[i] === "number"
            ? ts.factory.createNumericLiteral(pointer[i])
            : ts.factory.createStringLiteral(pointer[i] as string),
        ),
      );
    }
  }
  return t;
}

export interface AstToStringOptions {
  fileName?: string;
  sourceText?: string;
  formatOptions?: ts.PrinterOptions;
}

/** Convert TypeScript AST to string */
export function astToString(
  ast: ts.Node | ts.Node[] | ts.TypeElement | ts.TypeElement[],
  options?: AstToStringOptions,
): string {
  const sourceFile = ts.createSourceFile(
    options?.fileName ?? "openapi-ts.ts",
    options?.sourceText ?? "",
    ts.ScriptTarget.ESNext,
    false,
    ts.ScriptKind.TS,
  );

  // @ts-expect-error it’s OK to overwrite statements once
  sourceFile.statements = ts.factory.createNodeArray(Array.isArray(ast) ? ast : [ast]);

  const printer = ts.createPrinter({
    newLine: ts.NewLineKind.LineFeed,
    removeComments: false,
    ...options?.formatOptions,
  });
  return printer.printFile(sourceFile);
}

/** Convert an arbitrary string to TS (assuming it’s valid) */
export function stringToAST(source: string): unknown[] {
  return ts.createSourceFile(
    /* fileName        */ "stringInput",
    /* sourceText      */ source,
    /* languageVersion */ ts.ScriptTarget.ESNext,
    /* setParentNodes  */ undefined,
    /* scriptKind      */ undefined,
  ).statements as any;
}

/**
 * Deduplicate simple primitive types from an array of nodes
 * Note: won’t deduplicate complex types like objects
 */
export function tsDedupe(types: ts.TypeNode[]): ts.TypeNode[] {
  const encounteredTypes = new Set<number>();
  const filteredTypes: ts.TypeNode[] = [];
  for (const t of types) {
    // only mark for deduplication if this is not a const ("text" means it is a const)
    if (!("text" in ((t as LiteralTypeNode).literal ?? t))) {
      const { kind } = (t as LiteralTypeNode).literal ?? t;
      if (encounteredTypes.has(kind)) {
        continue;
      }
      if (tsIsPrimitive(t)) {
        encounteredTypes.add(kind);
      }
    }
    filteredTypes.push(t);
  }
  return filteredTypes;
}

export const enumCache = new Map<string, ts.EnumDeclaration>();

/** Create a TS enum (with sanitized name and members) */
export function tsEnum(
  name: string,
  members: (string | number)[],
  metadata?: { name?: string; description?: string }[],
  options?: { export?: boolean; shouldCache?: boolean },
) {
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
      return enumCache.get(key) as ts.EnumDeclaration;
    }
  }
  const enumDeclaration = ts.factory.createEnumDeclaration(
    /* modifiers */ options ? tsModifiers({ export: options.export ?? false }) : undefined,
    /* name      */ enumName,
    /* members   */ members.map((value, i) => tsEnumMember(value, metadata?.[i])),
  );
  options?.shouldCache && enumCache.set(key, enumDeclaration);
  return enumDeclaration;
}

/** Create an exported TS array literal expression  */
export function tsArrayLiteralExpression(
  name: string,
  elementType: ts.TypeNode,
  values: (string | number)[],
  options?: { export?: boolean; readonly?: boolean; injectFooter?: ts.Node[] },
) {
  let variableName = sanitizeMemberName(name);
  variableName = `${variableName[0].toLowerCase()}${variableName.substring(1)}`;

  const arrayType = options?.readonly
    ? tsReadonlyArray(elementType, options.injectFooter)
    : ts.factory.createArrayTypeNode(elementType);

  return ts.factory.createVariableStatement(
    options ? tsModifiers({ export: options.export ?? false }) : undefined,
    ts.factory.createVariableDeclarationList(
      [
        ts.factory.createVariableDeclaration(
          variableName,
          undefined,
          arrayType,
          ts.factory.createArrayLiteralExpression(
            values.map((value) => {
              if (typeof value === "number") {
                if (value < 0) {
                  return ts.factory.createPrefixUnaryExpression(
                    ts.SyntaxKind.MinusToken,
                    ts.factory.createNumericLiteral(Math.abs(value)),
                  );
                } else {
                  return ts.factory.createNumericLiteral(value);
                }
              } else {
                return ts.factory.createStringLiteral(value);
              }
            }),
          ),
        ),
      ],
      ts.NodeFlags.Const,
    ),
  );
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
export function tsEnumMember(value: string | number, metadata: { name?: string; description?: string } = {}) {
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

  let member: ts.EnumMember;
  if (typeof value === "number") {
    const literal =
      value < 0
        ? ts.factory.createPrefixUnaryExpression(
            ts.SyntaxKind.MinusToken,
            ts.factory.createNumericLiteral(Math.abs(value)),
          )
        : ts.factory.createNumericLiteral(value);

    member = ts.factory.createEnumMember(name, literal);
  } else {
    member = ts.factory.createEnumMember(name, ts.factory.createStringLiteral(value));
  }

  if (metadata.description === undefined) {
    return member;
  }

  return ts.addSyntheticLeadingComment(
    member,
    ts.SyntaxKind.SingleLineCommentTrivia,
    " ".concat(metadata.description.trim()),
    true,
  );
}

/** Create an intersection type */
export function tsIntersection(types: ts.TypeNode[]): ts.TypeNode {
  if (types.length === 0) {
    return NEVER;
  }
  if (types.length === 1) {
    return types[0];
  }
  return ts.factory.createIntersectionTypeNode(tsDedupe(types));
}

/** Is this a primitive type (string, number, boolean, null, undefined)? */
export function tsIsPrimitive(type: ts.TypeNode): boolean {
  if (!type) {
    return true;
  }
  return (
    ts.SyntaxKind[type.kind] === "BooleanKeyword" ||
    ts.SyntaxKind[type.kind] === "NeverKeyword" ||
    ts.SyntaxKind[type.kind] === "NullKeyword" ||
    ts.SyntaxKind[type.kind] === "NumberKeyword" ||
    ts.SyntaxKind[type.kind] === "StringKeyword" ||
    ts.SyntaxKind[type.kind] === "UndefinedKeyword" ||
    ("literal" in type && tsIsPrimitive(type.literal as TypeLiteralNode))
  );
}

/** Create a literal type */
export function tsLiteral(value: unknown): ts.TypeNode {
  if (typeof value === "string") {
    // workaround for UTF-8: https://github.com/microsoft/TypeScript/issues/36174
    return ts.factory.createIdentifier(JSON.stringify(value)) as unknown as ts.TypeNode;
  }
  if (typeof value === "number") {
    const literal =
      value < 0
        ? ts.factory.createPrefixUnaryExpression(
            ts.SyntaxKind.MinusToken,
            ts.factory.createNumericLiteral(Math.abs(value)),
          )
        : ts.factory.createNumericLiteral(value);
    return ts.factory.createLiteralTypeNode(literal);
  }
  if (typeof value === "boolean") {
    return value === true ? TRUE : FALSE;
  }
  if (value === null) {
    return NULL;
  }
  if (Array.isArray(value)) {
    if (value.length === 0) {
      return ts.factory.createArrayTypeNode(NEVER);
    }
    return ts.factory.createTupleTypeNode(value.map((v: unknown) => tsLiteral(v)));
  }
  if (typeof value === "object") {
    const keys: ts.TypeElement[] = [];
    for (const [k, v] of Object.entries(value)) {
      keys.push(
        ts.factory.createPropertySignature(
          /* modifiers     */ undefined,
          /* name          */ tsPropertyIndex(k),
          /* questionToken */ undefined,
          /* type          */ tsLiteral(v),
        ),
      );
    }
    return keys.length ? ts.factory.createTypeLiteralNode(keys) : tsRecord(STRING, NEVER);
  }
  return UNKNOWN;
}

/** Modifiers (readonly) */
export function tsModifiers(modifiers: {
  readonly?: boolean;
  export?: boolean;
}): ts.Modifier[] {
  const typeMods: ts.Modifier[] = [];
  if (modifiers.export) {
    typeMods.push(ts.factory.createModifier(ts.SyntaxKind.ExportKeyword));
  }
  if (modifiers.readonly) {
    typeMods.push(ts.factory.createModifier(ts.SyntaxKind.ReadonlyKeyword));
  }
  return typeMods;
}

/** Create a T | null union */
export function tsNullable(types: ts.TypeNode[]): ts.TypeNode {
  return ts.factory.createUnionTypeNode([...types, NULL]);
}

/** Create a TS Omit<X, Y> type */
export function tsOmit(type: ts.TypeNode, keys: string[]): ts.TypeNode {
  return ts.factory.createTypeReferenceNode(ts.factory.createIdentifier("Omit"), [
    type,
    ts.factory.createUnionTypeNode(keys.map((k) => tsLiteral(k))),
  ]);
}

/** Create a TS Record<X, Y> type */
export function tsRecord(key: ts.TypeNode, value: ts.TypeNode) {
  return ts.factory.createTypeReferenceNode(ts.factory.createIdentifier("Record"), [key, value]);
}

/** Create a valid property index */
export function tsPropertyIndex(index: string | number) {
  if (
    (typeof index === "number" && !(index < 0)) ||
    (typeof index === "string" && String(Number(index)) === index && index[0] !== "-")
  ) {
    return ts.factory.createNumericLiteral(index);
  }
  return typeof index === "string" && JS_PROPERTY_INDEX_RE.test(index)
    ? ts.factory.createIdentifier(index)
    : ts.factory.createStringLiteral(String(index));
}

/** Create a union type */
export function tsUnion(types: ts.TypeNode[]): ts.TypeNode {
  if (types.length === 0) {
    return NEVER;
  }
  if (types.length === 1) {
    return types[0];
  }
  return ts.factory.createUnionTypeNode(tsDedupe(types));
}

/** Create a WithRequired<X, Y> type */
export function tsWithRequired(
  type: ts.TypeNode,
  keys: string[],
  injectFooter: ts.Node[], // needed to inject type helper if used
): ts.TypeNode {
  if (keys.length === 0) {
    return type;
  }

  // inject helper, if needed
  if (!injectFooter.some((node) => ts.isTypeAliasDeclaration(node) && node?.name?.escapedText === "WithRequired")) {
    const helper = stringToAST("type WithRequired<T, K extends keyof T> = T & { [P in K]-?: T[P] };")[0] as any;
    injectFooter.push(helper);
  }

  return ts.factory.createTypeReferenceNode(ts.factory.createIdentifier("WithRequired"), [
    type,
    tsUnion(keys.map((k) => tsLiteral(k))),
  ]);
}

/**
 * Enhanced ReadonlyArray.
 * eg: type Foo = ReadonlyArray<T>; type Bar = ReadonlyArray<T[]>
 * Foo and Bar are both of type `readonly T[]`
 */
export function tsReadonlyArray(type: ts.TypeNode, injectFooter?: ts.Node[]): ts.TypeNode {
  if (
    injectFooter &&
    !injectFooter.some((node) => ts.isTypeAliasDeclaration(node) && node?.name?.escapedText === "ReadonlyArray")
  ) {
    const helper = stringToAST(
      "type ReadonlyArray<T> = [Exclude<T, undefined>] extends [any[]] ? Readonly<Exclude<T, undefined>> : Readonly<Exclude<T, undefined>[]>;",
    )[0] as any;
    injectFooter.push(helper);
  }
  return ts.factory.createTypeReferenceNode(ts.factory.createIdentifier("ReadonlyArray"), [type]);
}
