import {
  escapePointer,
  parseRef,
} from "@redocly/openapi-core/lib/ref-utils.js";
import c from "ansi-colors";
import supportsColor from "supports-color";
import ts from "typescript";
import { DiscriminatorObject, OpenAPI3 } from "../types.js";
import { tsLiteral, tsModifiers, tsPropertyIndex } from "./ts.js";

if (!supportsColor.stdout || supportsColor.stdout.hasBasic === false) {
  c.enabled = false;
}

const DEBUG_GROUPS: Record<string, c.StyleFunction | undefined> = {
  redoc: c.cyanBright,
  lint: c.yellowBright,
  bundle: c.magentaBright,
  ts: c.blueBright,
};

export { c };

/** Given a discriminator object, get the property name */
export function createDiscriminatorProperty(
  discriminator: DiscriminatorObject,
  { path, readonly = false }: { path: string; readonly?: boolean },
): ts.TypeElement {
  // get the inferred propertyName value from the last section of the path (as the spec suggests to do)
  let value = parseRef(path).pointer.pop()!;
  // if mapping, and there’s a match, use this rather than the inferred name
  if (discriminator.mapping) {
    // Mapping value can either be a fully-qualified ref (#/components/schemas/XYZ) or a schema name (XYZ)
    const matchedValue = Object.entries(discriminator.mapping).find(
      ([, v]) =>
        (!v.startsWith("#") && v === value) ||
        (v.startsWith("#") && parseRef(v).pointer.pop() === value),
    );
    if (matchedValue) {
      value = matchedValue[0]; // why was this designed backwards!?
    }
  }
  return ts.factory.createPropertySignature(
    /* modifiers     */ tsModifiers({
      readonly,
    }),
    /* name          */ tsPropertyIndex(discriminator.propertyName),
    /* questionToken */ undefined,
    /* type          */ tsLiteral(value),
  );
}

/** Create a $ref pointer (even from other $refs) */
export function createRef(parts: (number | string)[]): string {
  let pointer = "#";
  for (const part of parts) {
    if (!part) {
      continue;
    }
    const maybeRef = parseRef(String(part)).pointer;
    if (maybeRef.length) {
      for (const refPart of maybeRef) {
        pointer += `/${escapePointer(refPart)}`;
      }
    } else {
      pointer += `/${escapePointer(part)}`;
    }
  }
  return pointer;
}

/** Print debug message (cribbed from the `debug` package, but without all the bells & whistles */
export function debug(msg: string, group?: string, time?: number) {
  if (
    process.env.DEBUG &&
    (!group ||
      process.env.DEBUG === "*" ||
      process.env.DEBUG === "openapi-ts:*" ||
      process.env.DEBUG.toLocaleLowerCase() ===
        `openapi-ts:${group.toLocaleLowerCase()}`)
  ) {
    const groupColor = (group && DEBUG_GROUPS[group]) || c.whiteBright;
    const groupName = groupColor(`openapi-ts:${group ?? "info"}`);
    let timeFormatted = "";
    if (typeof time === "number") {
      timeFormatted = c.green(` ${formatTime(time)} `);
    }
    // eslint-disable-next-line no-console
    console.debug(`  ${c.bold(groupName)}${timeFormatted}${msg}`);
  }
}

/** Print error message */
export function error(msg: string) {
  console.error(c.red(` ✘  ${msg}`)); // eslint-disable-line no-console
}

/** Format a performance log in a friendly format */
export function formatTime(t: number) {
  if (typeof t === "number") {
    if (t < 1000) {
      return `${Math.round(10 * t) / 10}ms`;
    } else if (t < 60000) {
      return `${Math.round(t / 100) / 10}s`;
    }
    return `${Math.round(t / 6000) / 10}m`;
  }
  return t;
}

/** Call Object.entries() and optionally sort */
export function getEntries<T>(
  obj: ArrayLike<T> | Record<string, T>,
  options?: {
    alphabetize?: boolean;
    excludeDeprecated?: boolean;
  },
) {
  let entries = Object.entries(obj);
  if (options?.alphabetize) {
    entries.sort(([a], [b]) => a.localeCompare(b, "en-us", { numeric: true }));
  }
  if (options?.excludeDeprecated) {
    entries = entries.filter(
      ([, v]) =>
        !(v && typeof v === "object" && "deprecated" in v && v.deprecated),
    );
  }
  return entries;
}

/* eslint-disable @typescript-eslint/no-explicit-any */
/** resolve a $ref in a schema */
export function resolveRef<T>(
  schema: any,
  $ref: string,
  { silent = false, visited = [] }: { silent: boolean; visited?: string[] },
): T | undefined {
  const { pointer } = parseRef($ref);
  if (!pointer.length) {
    return undefined;
  }
  let node = schema;
  for (const key of pointer) {
    if (node && typeof node === "object" && node[key]) {
      node = node[key];
    } else {
      warn(`Could not resolve $ref "${$ref}"`, silent);
      return undefined;
    }
  }

  // if this is also a $ref, keep tracing
  if (node && typeof node === "object" && node.$ref) {
    if (visited.includes(node.$ref)) {
      warn(`Could not resolve circular $ref "${$ref}"`, silent);
      return undefined;
    }
    return resolveRef(schema, node.$ref, {
      silent,
      visited: [...visited, node.$ref],
    });
  }

  return node;
}

/** Return a key–value map of discriminator objects found in a schema */
export function scanDiscriminators(schema: OpenAPI3) {
  const discriminators: Record<string, DiscriminatorObject> = {};

  // perform 2 passes: first, collect all discriminator definitions
  walk(schema, (obj, path) => {
    if ((obj?.discriminator as DiscriminatorObject)?.propertyName) {
      discriminators[createRef(path)] =
        obj.discriminator as DiscriminatorObject;
    }
  });

  // second, collect the schema objects that inherit from discriminators
  // (sometimes this mapping is implicit, so it can’t be done until we know
  // about every discriminator in the document)
  walk(schema, (obj, path) => {
    for (const key of ["oneOf", "anyOf", "allOf"] as const) {
      if (obj && Array.isArray(obj[key])) {
        for (const item of (obj as any)[key]) {
          if ("$ref" in item) {
            if (discriminators[item.$ref]) {
              discriminators[createRef(path)] = {
                ...discriminators[item.$ref],
              };
            }
          } else if (item.discriminator?.propertyName) {
            discriminators[createRef(path)] = { ...item.discriminator };
          }
        }
      }
    }
  });
  return discriminators;
}

/** Walk through any JSON-serializable (i.e. non-circular) object */
export function walk(
  obj: unknown,
  cb: (value: Record<string, unknown>, path: (string | number)[]) => void,
  path: (string | number)[] = [],
): void {
  if (!obj || typeof obj !== "object") {
    return;
  }
  if (Array.isArray(obj)) {
    for (let i = 0; i < obj.length; i++) {
      walk(obj[i], cb, path.concat(i));
    }
    return;
  }
  cb(obj as Record<string, unknown>, path);
  for (const k of Object.keys(obj)) {
    walk((obj as Record<string, unknown>)[k], cb, path.concat(k));
  }
}

/** Print warning message */
export function warn(msg: string, silent = false) {
  if (!silent) {
    console.warn(c.yellow(` ⚠  ${msg}`)); // eslint-disable-line no-console
  }
}
