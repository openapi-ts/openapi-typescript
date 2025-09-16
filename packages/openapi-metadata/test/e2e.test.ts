import "reflect-metadata";
import type { OpenAPIV3 } from "openapi-types";
import { generateDocument } from "../src/index.js";
import UsersController from "./fixtures/controllers/users_controller.js";

test("simple schema", async () => {
  const document = await generateDocument({
    controllers: [UsersController],
    document: {
      info: {
        title: "Test API",
        version: "1.0.0",
      },
    },
  });

  expect(document).toEqual({
    openapi: "3.0.0",
    info: {
      title: "Test API",
      version: "1.0.0",
    },
    paths: {
      "/users": {
        get: {
          summary: "List users",
          parameters: [
            {
              in: "query",
              name: "page",
              schema: {
                type: "string",
              },
            },
          ],
          responses: {
            default: {
              description: "",
              content: {
                "application/json": {
                  schema: {
                    type: "array",
                    items: {
                      $ref: "#/components/schemas/User",
                    },
                  },
                },
              },
            },
            "404": {
              description: "Not found",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                  },
                },
              },
            },
          },
          security: [],
          tags: ["Users", "List"],
        },
        post: {
          summary: "Create user",
          parameters: [],
          requestBody: {
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/User",
                },
              },
            },
          },
          responses: {
            default: {
              description: "",
              content: {
                "application/json": {
                  schema: {
                    $ref: "#/components/schemas/User",
                  },
                },
              },
            },
            "404": {
              description: "Not found",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                  },
                },
              },
            },
          },
          security: [],
          tags: ["Users", "Create"],
        },
      },
      "/users/{id}": {
        get: {
          summary: "Show user",
          parameters: [],
          responses: {
            default: {
              description: "",
              content: {
                "application/json": {
                  schema: {
                    $ref: "#/components/schemas/User",
                  },
                },
              },
            },
            "404": {
              description: "Not found",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                  },
                },
              },
            },
          },
          security: [],
          tags: ["Users", "Show"],
        },
      },
    },
    components: {
      schemas: {
        User: {
          type: "object",
          properties: {
            id: {
              type: "number",
            },
            posts: {
              type: "array",
              items: {
                $ref: "#/components/schemas/Post",
              },
            },
          },
          required: ["id", "posts"],
        },
        Post: {
          type: "object",
          properties: {
            id: {
              type: "number",
            },
            author: {
              $ref: "#/components/schemas/User",
            },
          },
          required: ["id", "author"],
        },
      },
    },
  } satisfies OpenAPIV3.Document);
});
