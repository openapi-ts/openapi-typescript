import { applyPathsFilter } from "../../src/lib/filter.js";
import type { OpenAPI3 } from "../../src/types.js";

const BASE: OpenAPI3 = {
  openapi: "3.1.0",
  info: { title: "Test", version: "1" },
};

// ─── helpers ────────────────────────────────────────────────────────────────

function makeSchema(overrides: Partial<OpenAPI3> = {}): OpenAPI3 {
  return { ...BASE, ...overrides };
}

function pathNames(schema: OpenAPI3): string[] {
  return Object.keys(schema.paths ?? {});
}

function methodsAt(schema: OpenAPI3, pathname: string): string[] {
  const item = schema.paths?.[pathname];
  if (!item || "$ref" in item) {
    return [];
  }
  const HTTP = ["get", "put", "post", "delete", "options", "head", "patch", "trace"];
  return HTTP.filter((m) => m in item);
}

// ─── path-level filtering ────────────────────────────────────────────────────

describe("applyPathsFilter – path filtering", () => {
  const schema = makeSchema({
    paths: {
      "/users": { get: { responses: {} }, post: { responses: {} } },
      "/orders": { get: { responses: {} } },
    },
  });

  test("includes all paths when filter always returns true", () => {
    const result = applyPathsFilter(schema, () => true);
    expect(pathNames(result)).toEqual(["/users", "/orders"]);
  });

  test("excludes paths where all methods are filtered out", () => {
    const result = applyPathsFilter(schema, (pathname) => pathname === "/users");
    expect(pathNames(result)).toEqual(["/users"]);
    expect(pathNames(result)).not.toContain("/orders");
  });

  test("returns empty paths when filter always returns false", () => {
    const result = applyPathsFilter(schema, () => false);
    expect(pathNames(result)).toHaveLength(0);
  });

  test("preserves non-method properties (e.g. parameters) on filtered path items", () => {
    const s = makeSchema({
      paths: {
        "/users": {
          parameters: [{ name: "X-Header", in: "header" }],
          get: { responses: {} },
          post: { responses: {} },
        },
      },
    });
    const result = applyPathsFilter(s, (_, method) => method === "get");
    const item = result.paths?.["/users"] as Record<string, unknown>;
    expect(item.parameters).toBeDefined();
    expect(item.get).toBeDefined();
    expect(item.post).toBeUndefined();
  });
});

// ─── method-level filtering ──────────────────────────────────────────────────

describe("applyPathsFilter – method filtering", () => {
  const schema = makeSchema({
    paths: {
      "/users": {
        get: { responses: {} },
        post: { responses: {} },
        put: { responses: {} },
      },
    },
  });

  test("keeps only GET when filter passes only 'get'", () => {
    const result = applyPathsFilter(schema, (_, method) => method === "get");
    expect(methodsAt(result, "/users")).toEqual(["get"]);
  });

  test("keeps GET and POST when filter passes those two", () => {
    const result = applyPathsFilter(schema, (_, method) => method === "get" || method === "post");
    expect(methodsAt(result, "/users")).toEqual(["get", "post"]);
  });

  test("receives both pathname and method in the callback", () => {
    const calls: [string, string][] = [];
    applyPathsFilter(schema, (pathname, method) => {
      calls.push([pathname, method]);
      return true;
    });
    expect(calls.some(([p, m]) => p === "/users" && m === "get")).toBe(true);
    expect(calls.some(([p, m]) => p === "/users" && m === "post")).toBe(true);
  });
});

// ─── $ref path items ─────────────────────────────────────────────────────────

describe("applyPathsFilter – $ref path items", () => {
  test("passes through $ref path items unchanged", () => {
    const schema = makeSchema({
      paths: {
        "/users": { $ref: "#/components/pathItems/Users" },
        "/orders": { get: { responses: {} } },
      },
      components: {
        pathItems: { Users: { get: { responses: {} } } } as any,
      },
    });
    // filter that would normally exclude /orders
    const result = applyPathsFilter(schema, (pathname) => pathname === "/users");
    expect(result.paths?.["/users"]).toEqual({ $ref: "#/components/pathItems/Users" });
  });
});

// ─── component tree-shaking ───────────────────────────────────────────────────

describe("applyPathsFilter – component tree-shaking", () => {
  const schema = makeSchema({
    paths: {
      "/users": {
        get: {
          responses: {
            200: { content: { "application/json": { schema: { $ref: "#/components/schemas/User" } } } },
          },
        },
        post: {
          responses: {
            201: { content: { "application/json": { schema: { $ref: "#/components/schemas/NewUser" } } } },
          },
        },
      },
    },
    components: {
      schemas: {
        User: { type: "object", properties: { id: { type: "string" } } },
        NewUser: { type: "object", properties: { name: { type: "string" } } },
        Order: { type: "object", properties: { total: { type: "number" } } },
      },
    },
  });

  test("removes components not referenced by any included path", () => {
    // include only GET — only User is referenced
    const result = applyPathsFilter(schema, (_, method) => method === "get");
    expect(result.components?.schemas).toHaveProperty("User");
    expect(result.components?.schemas).not.toHaveProperty("NewUser");
    expect(result.components?.schemas).not.toHaveProperty("Order");
  });

  test("keeps all referenced components when all paths are included", () => {
    const result = applyPathsFilter(schema, () => true);
    expect(result.components?.schemas).toHaveProperty("User");
    expect(result.components?.schemas).toHaveProperty("NewUser");
    expect(result.components?.schemas).not.toHaveProperty("Order"); // never referenced
  });

  test("sets components to undefined when nothing is referenced", () => {
    const result = applyPathsFilter(schema, () => false);
    expect(result.components).toBeUndefined();
  });

  test("returns schema unchanged when there are no components", () => {
    const s = makeSchema({
      paths: { "/users": { get: { responses: {} } } },
    });
    const result = applyPathsFilter(s, () => true);
    expect(result.components).toBeUndefined();
  });
});

// ─── transitive $ref resolution ───────────────────────────────────────────────

describe("applyPathsFilter – transitive component references", () => {
  test("keeps components referenced only by other components", () => {
    // User -> Address (transitive)
    const schema = makeSchema({
      paths: {
        "/users": {
          get: {
            responses: {
              200: { content: { "application/json": { schema: { $ref: "#/components/schemas/User" } } } },
            },
          },
        },
      },
      components: {
        schemas: {
          User: {
            type: "object",
            properties: {
              id: { type: "string" },
              address: { $ref: "#/components/schemas/Address" },
            },
          },
          Address: { type: "object", properties: { street: { type: "string" } } },
          Unrelated: { type: "object" },
        },
      },
    });

    const result = applyPathsFilter(schema, () => true);
    expect(result.components?.schemas).toHaveProperty("User");
    expect(result.components?.schemas).toHaveProperty("Address");
    expect(result.components?.schemas).not.toHaveProperty("Unrelated");
  });

  test("handles circular $refs without infinite loops", () => {
    const schema = makeSchema({
      paths: {
        "/nodes": {
          get: {
            responses: {
              200: { content: { "application/json": { schema: { $ref: "#/components/schemas/Node" } } } },
            },
          },
        },
      },
      components: {
        schemas: {
          Node: {
            type: "object",
            properties: {
              child: { $ref: "#/components/schemas/Node" }, // self-referential
            },
          },
        },
      },
    });

    expect(() => applyPathsFilter(schema, () => true)).not.toThrow();
    const result = applyPathsFilter(schema, () => true);
    expect(result.components?.schemas).toHaveProperty("Node");
  });

  test("keeps components across multiple component types", () => {
    const schema = makeSchema({
      paths: {
        "/users": {
          get: {
            parameters: [{ $ref: "#/components/parameters/PageParam" }],
            responses: {
              200: { $ref: "#/components/responses/UserList" },
            },
          },
        },
      },
      components: {
        parameters: {
          PageParam: { name: "page", in: "query", schema: { type: "integer" } },
          UnusedParam: { name: "unused", in: "query" },
        },
        responses: {
          UserList: { description: "A list of users" },
          UnusedResponse: { description: "unused" },
        },
      },
    });

    const result = applyPathsFilter(schema, () => true);
    expect(result.components?.parameters).toHaveProperty("PageParam");
    expect(result.components?.parameters).not.toHaveProperty("UnusedParam");
    expect(result.components?.responses).toHaveProperty("UserList");
    expect(result.components?.responses).not.toHaveProperty("UnusedResponse");
  });
});

// ─── schema integrity ─────────────────────────────────────────────────────────

describe("applyPathsFilter – schema integrity", () => {
  test("preserves top-level schema fields (info, servers, etc.)", () => {
    const schema: OpenAPI3 = {
      openapi: "3.1.0",
      info: { title: "My API", version: "2.0" },
      servers: [{ url: "https://api.example.com", description: "", variables: {} }],
      paths: { "/ping": { get: { responses: {} } } },
    };
    const result = applyPathsFilter(schema, () => true);
    expect(result.openapi).toBe("3.1.0");
    expect(result.info).toEqual(schema.info);
    expect(result.servers).toEqual(schema.servers);
  });

  test("does not mutate the original schema", () => {
    const schema = makeSchema({
      paths: {
        "/users": { get: { responses: {} }, post: { responses: {} } },
      },
    });
    const originalPaths = { ...schema.paths };
    applyPathsFilter(schema, (_, method) => method === "get");
    expect(schema.paths).toEqual(originalPaths);
  });
});
