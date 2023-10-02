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
  lint: c.yellowBright,
  redoc: c.cyanBright,
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

/** Print debug message */
export function debug(msg: string, group?: string, time?: number) {
  if (
    process.env.DEBUG &&
    (!group ||
      process.env.DEBUG === "*" ||
      process.env.DEBUG.toLocaleLowerCase() === group.toLocaleLowerCase())
  ) {
    const groupColor = (group && DEBUG_GROUPS[group]) || c.whiteBright;
    const groupName = groupColor(`oapts:${group ?? "info"}`);
    let timeFormatted = "";
    if (typeof time === "number") {
      if (time < 1000) {
        timeFormatted = `${Math.round(100 * time) / 100}ms`;
      } else if (time < 60000) {
        timeFormatted = `${Math.round(time / 100) / 10}s`;
      } else {
        timeFormatted = `${Math.round(time / 6000) / 10}m`;
      }
      timeFormatted = c.green(` ${timeFormatted} `);
    }
    // eslint-disable-next-line no-console
    console.debug(`  ${c.bold(groupName)}${timeFormatted}${msg}`);
  }
}

/** Print error message */
export function error(msg: string) {
  console.error(c.red(` ✘  ${msg}`)); // eslint-disable-line no-console
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
  ref: string,
  { silent = false, visited = [] }: { silent: boolean; visited?: string[] },
): T | undefined {
  const { pointer } = parseRef(ref);
  if (!pointer.length) {
    return undefined;
  }
  let node = schema;
  for (const key of pointer) {
    if (node && typeof node === "object" && node[key]) {
      node = node[key];
    } else {
      if (!silent) {
        warn(`Could not resolve $ref "${ref}"`);
      }
      return undefined;
    }
  }

  // if this is also a $ref, keep tracing
  if (node && typeof node === "object" && node.$ref) {
    if (visited.includes(node.$ref)) {
      if (!silent) {
        warn(`Could not resolve circular $ref "${ref}"`);
      }
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
  walk(schema, (obj, path) => {
    if (obj.propertyName) {
      discriminators[createRef(path)] = obj as unknown as DiscriminatorObject;
      if (Array.isArray(obj.oneOf)) {
        for (const o of obj.oneOf) {
          if ("$ref" in o) {
            discriminators[o.$ref] = obj as unknown as DiscriminatorObject;
          }
        }
      }
    }
  });
  return discriminators;
}

/** Walk through any JSON-serializable object */
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
export function warn(msg: string) {
  console.warn(c.yellow(` ⚠  ${msg}`)); // eslint-disable-line no-console
}
