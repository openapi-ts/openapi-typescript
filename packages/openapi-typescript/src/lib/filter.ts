import type { ComponentsObject, OpenAPI3, PathsObject } from "../types.js";

export type PathsFilterFn = (pathname: string, method: string) => boolean;

const HTTP_METHODS = ["get", "put", "post", "delete", "options", "head", "patch", "trace"] as const;

/**
 * Pre-process an OpenAPI schema by filtering paths/methods and removing unreferenced components.
 * Performs transitive $ref analysis so only components reachable from included paths are kept.
 */
export function applyPathsFilter(schema: OpenAPI3, pathsFilter: PathsFilterFn): OpenAPI3 {
  // Step 1: filter paths and their HTTP methods
  const filteredPaths: PathsObject = {};

  for (const [pathname, pathItem] of Object.entries(schema.paths ?? {})) {
    if (!pathItem || typeof pathItem !== "object") { 
      continue; 
    }

    if ("$ref" in pathItem) {
      // $ref path items are always included — individual methods can't be inspected
      // without resolving the reference. See OpenAPITSOptions.pathsFilter docs.
      filteredPaths[pathname] = pathItem;
      continue;
    }

    const filteredItem = { ...pathItem };
    let hasMethod = false;

    for (const method of HTTP_METHODS) {
      if (method in filteredItem) {
        if (pathsFilter(pathname, method)) {
          hasMethod = true;
        } else {
          delete (filteredItem as Record<string, unknown>)[method];
        }
      }
    }

    if (hasMethod) {
      filteredPaths[pathname] = filteredItem;
    }
  }

  const schemaWithFilteredPaths: OpenAPI3 = { ...schema, paths: filteredPaths };

  if (!schema.components) { return schemaWithFilteredPaths; }

  // Step 2: collect all $refs reachable from the filtered paths (transitively)
  const usedRefs = new Set<string>();
  collectRefs(filteredPaths, usedRefs);

  const processed = new Set<string>();
  const queue = [...usedRefs];

  while (queue.length > 0) {
    const ref = queue.pop()!;
    if (processed.has(ref)) { continue; }
    processed.add(ref);

    if (!ref.startsWith("#/")) { continue; }

    // Walk the original schema to resolve the ref
    const parts = ref.slice(2).split("/");
    let node: unknown = schema;
    for (const part of parts) {
      if (!node || typeof node !== "object") {
        node = undefined;
        break;
      }
      node = (node as Record<string, unknown>)[part];
    }

    if (node) {
      const nested = new Set<string>();
      collectRefs(node, nested);
      for (const nestedRef of nested) {
        if (!processed.has(nestedRef)) {
          usedRefs.add(nestedRef);
          queue.push(nestedRef);
        }
      }
    }
  }

  // Step 3: keep only components that are referenced
  const usedComponentPaths = new Set(
    [...usedRefs]
      .filter((ref) => ref.startsWith("#/"))
      .map((ref) => ref.slice(2)), // e.g. "components/schemas/User"
  );

  const filteredComponents: Partial<ComponentsObject> = {};

  for (const [componentType, componentItems] of Object.entries(schema.components)) {
    if (!componentItems || typeof componentItems !== "object") { continue; }

    const kept: Record<string, unknown> = {};
    for (const [name, item] of Object.entries(componentItems as Record<string, unknown>)) {
      if (usedComponentPaths.has(`components/${componentType}/${name}`)) {
        kept[name] = item;
      }
    }

    if (Object.keys(kept).length > 0) {
      (filteredComponents as Record<string, unknown>)[componentType] = kept;
    }
  }

  return {
    ...schemaWithFilteredPaths,
    components: Object.keys(filteredComponents).length > 0 ? (filteredComponents as ComponentsObject) : undefined,
  };
}

function collectRefs(obj: unknown, refs: Set<string>): void {
  if (!obj || typeof obj !== "object") { return; }
  if (Array.isArray(obj)) {
    for (const item of obj) { collectRefs(item, refs); }
    return;
  }
  for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
    if (key === "$ref" && typeof value === "string") {
      refs.add(value);
    } else {
      collectRefs(value, refs);
    }
  }
}
