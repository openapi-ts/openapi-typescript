import { OpenAPI2, OpenAPI3 } from '../types';

/**
 * Capitalize the first letter of a word
 */
export function capitalize(text: string): string {
  return text.replace(/^[a-z]/i, (letter) => letter.toLocaleUpperCase());
}

/**
 * Convert text to camelCase
 */
export function camelCase(text: string): string {
  const INVALID_CHARS = /(-|_|\.|\s)+\w/g;
  return text.replace(INVALID_CHARS, (letter): string =>
    letter.toUpperCase().replace(/[^0-9a-z]/gi, '')
  );
}

/**
 * Convert OpenAPI description to JSDoc comment
 */
export function descriptionToComment(text: string): string {
  const REMOVE_JS_COMMENT = /\*\//g;
  const REMOVE_FINAL_NEWLINE = /\n$/;
  const START_NEWLINES_WITH_ASTERISKS = /\n/g;
  return `/**\n * ${text
    .replace(REMOVE_JS_COMMENT, '')
    .replace(REMOVE_FINAL_NEWLINE, '')
    .replace(START_NEWLINES_WITH_ASTERISKS, '\n * ')}\n */`;
}

/**
 * Return definition of a Swagger Path Item Object
 * https://swagger.io/specification/#pathItemObject
 */
export function findRef<T = any>(path: string, schema: any): T {
  if (typeof schema !== 'object') {
    throw new Error(`cannot find ref for type ${typeof schema}`);
  }
  const keyString = path.replace('#/', '').split('/');
  return keyString.reduce<T>((data, key) => (data as any)[key], schema as any);
}

/**
 * Convert text to PascalCase
 */
export function pascalCase(text: string): string {
  return capitalize(camelCase(text));
}

/**
 * Convert text to snake_case
 */
export function snakeCase(text: string): string {
  const INVALID_CHARS = /[-\.\s]/g;
  return text.replace(INVALID_CHARS, '_');
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
  return `${type}[]`;
}

/**
 * Convert T into { [key: string]: T } maps
 */
export function tsMapOf(type: string): string {
  return `[key: string]: ${type};`;
}

/**
 * Convert [X, Y, Z] into X | Y | Z
 */
export function tsUnionOf(types: string[]): string {
  return types.map((text) => `'${text}'`).join(' | '); // important: use single-quotes here for JSON (you can always change w/ Prettier at the end)
}
