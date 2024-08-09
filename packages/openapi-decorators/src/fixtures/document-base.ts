import type { OpenAPIV3 } from "openapi-types";

export const buildDocumentBase = (): OpenAPIV3.Document => ({
  openapi: "3.0.0",
  info: {
    title: "",
    description: "",
    version: "1.0.0",
    contact: {},
  },
  tags: [],
  servers: [],
  paths: {},
  components: {
    schemas: {},
  },
});
