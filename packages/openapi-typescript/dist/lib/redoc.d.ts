/// <reference types="node" />
/// <reference types="node" />
import { BaseResolver, type Config as RedoclyConfig, type Document } from "@redocly/openapi-core";
import { Readable } from "node:stream";
import { OpenAPI3 } from "../types.js";
export interface ValidateAndBundleOptions {
    redoc: RedoclyConfig;
    silent: boolean;
    cwd?: URL;
}
interface ParseSchemaOptions {
    absoluteRef: string;
    resolver: BaseResolver;
}
export declare function parseSchema(schema: unknown, { absoluteRef, resolver }: ParseSchemaOptions): Promise<Document>;
export declare function validateAndBundle(source: string | URL | OpenAPI3 | Readable | Buffer, options: ValidateAndBundleOptions): Promise<any>;
export {};
