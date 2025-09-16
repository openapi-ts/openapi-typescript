import type { OpenAPIV3 } from "openapi-types";

export { generateDocument } from "./generators/document.js";
export type { TypeLoaderFn } from "./types.js";
export { getSchemaPath } from "./utils/schema.js";

export type OpenAPIDocument = OpenAPIV3.Document;
