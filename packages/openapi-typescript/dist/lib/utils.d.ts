import c from "ansi-colors";
import ts from "typescript";
import { DiscriminatorObject, OpenAPI3 } from "../types.js";
export { c };
export declare function createDiscriminatorProperty(discriminator: DiscriminatorObject, { path, readonly }: {
    path: string;
    readonly?: boolean;
}): ts.TypeElement;
export declare function createRef(parts: (number | string)[]): string;
export declare function debug(msg: string, group?: string, time?: number): void;
export declare function error(msg: string): void;
export declare function formatTime(t: number): string;
export declare function getEntries<T>(obj: ArrayLike<T> | Record<string, T>, options?: {
    alphabetize?: boolean;
    excludeDeprecated?: boolean;
}): [string, T][];
export declare function resolveRef<T>(schema: any, $ref: string, { silent, visited }: {
    silent: boolean;
    visited?: string[];
}): T | undefined;
export declare function scanDiscriminators(schema: OpenAPI3): Record<string, DiscriminatorObject>;
export declare function walk(obj: unknown, cb: (value: Record<string, unknown>, path: (string | number)[]) => void, path?: (string | number)[]): void;
export declare function warn(msg: string, silent?: boolean): void;
