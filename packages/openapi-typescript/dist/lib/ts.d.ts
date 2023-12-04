import ts from "typescript";
export declare const JS_PROPERTY_INDEX_RE: RegExp;
export declare const JS_ENUM_INVALID_CHARS_RE: RegExp;
export declare const JS_PROPERTY_INDEX_INVALID_CHARS_RE: RegExp;
export declare const BOOLEAN: ts.KeywordTypeNode<ts.SyntaxKind.BooleanKeyword>;
export declare const FALSE: ts.LiteralTypeNode;
export declare const NEVER: ts.KeywordTypeNode<ts.SyntaxKind.NeverKeyword>;
export declare const NULL: ts.LiteralTypeNode;
export declare const NUMBER: ts.KeywordTypeNode<ts.SyntaxKind.NumberKeyword>;
export declare const QUESTION_TOKEN: ts.PunctuationToken<ts.SyntaxKind.QuestionToken>;
export declare const STRING: ts.KeywordTypeNode<ts.SyntaxKind.StringKeyword>;
export declare const TRUE: ts.LiteralTypeNode;
export declare const UNDEFINED: ts.KeywordTypeNode<ts.SyntaxKind.UndefinedKeyword>;
export declare const UNKNOWN: ts.KeywordTypeNode<ts.SyntaxKind.UnknownKeyword>;
export interface AnnotatedSchemaObject {
    const?: unknown;
    default?: unknown;
    deprecated?: boolean;
    description?: string;
    enum?: unknown[];
    example?: string;
    format?: string;
    nullable?: boolean;
    summary?: string;
    title?: string;
    type?: string | string[];
}
export declare function addJSDocComment(schemaObject: AnnotatedSchemaObject, node: ts.PropertySignature): void;
export declare function oapiRef(path: string): ts.TypeNode;
export interface AstToStringOptions {
    fileName?: string;
    sourceText?: string;
    formatOptions?: ts.PrinterOptions;
}
export declare function astToString(ast: ts.Node | ts.Node[] | ts.TypeElement | ts.TypeElement[], options?: AstToStringOptions): string;
export declare function stringToAST(source: string): unknown[];
export declare function tsDedupe(types: ts.TypeNode[]): ts.TypeNode[];
export declare function tsEnum(name: string, members: (string | number)[], metadata?: {
    name?: string;
    description?: string;
}[], options?: {
    readonly?: boolean;
    export?: boolean;
}): ts.EnumDeclaration;
export declare function tsEnumMember(value: string | number, metadata?: {
    name?: string;
    description?: string;
}): ts.EnumMember;
export declare function tsIntersection(types: ts.TypeNode[]): ts.TypeNode;
export declare function tsIsPrimitive(type: ts.TypeNode): boolean;
export declare function tsLiteral(value: unknown): ts.TypeNode;
export declare function tsModifiers(modifiers: {
    readonly?: boolean;
    export?: boolean;
}): ts.Modifier[];
export declare function tsNullable(types: ts.TypeNode[]): ts.TypeNode;
export declare function tsOmit(type: ts.TypeNode, keys: string[]): ts.TypeNode;
export declare function tsRecord(key: ts.TypeNode, value: ts.TypeNode): ts.TypeReferenceNode;
export declare function tsPropertyIndex(index: string | number): ts.Identifier | ts.NumericLiteral | ts.StringLiteral;
export declare function tsUnion(types: ts.TypeNode[]): ts.TypeNode;
export declare function tsWithRequired(type: ts.TypeNode, keys: string[], injectFooter: ts.Node[]): ts.TypeNode;
