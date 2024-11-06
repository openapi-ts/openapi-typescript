import type { OpenAPIV3 } from "openapi-types";
export { generateDocument } from "./generators/document";

export type { TypeLoaderFn } from "./types";
export type OpenAPIDocument = OpenAPIV3.Document;
