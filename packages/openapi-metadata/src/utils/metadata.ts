import type { Context } from "../context.js";
import type { TypeValue } from "../types.js";
import { NoExplicitTypeError } from "../errors/no-explicit-type.js";
import { ReflectMetadataMissingError } from "../errors/reflect-metadata-missing.js";

export function ensureReflectMetadataExists() {
  if (
    typeof Reflect !== "object" ||
    typeof Reflect.getMetadata !== "function"
  ) {
    throw new ReflectMetadataMissingError();
  }
}

export type MetadataKey =
  | "design:type"
  | "design:returntype"
  | "design:paramtypes";

export type FindTypeOptions = {
  context: Context;
  metadataKey: MetadataKey;
  prototype: Object;
  propertyKey: string;
};

export function findType({
  metadataKey,
  prototype,
  propertyKey,
}: FindTypeOptions) {
  ensureReflectMetadataExists();
  const reflectedType: Function | undefined = Reflect.getMetadata(
    metadataKey,
    prototype,
    propertyKey,
  );

  if (!reflectedType) {
    throw new NoExplicitTypeError(prototype.constructor.name, propertyKey);
  }

  return reflectedType;
}

const IS_THUNK_REG = /.+=>[\w\d\s\t\n\r]*/;

export function isThunk(value: any): boolean {
  if (typeof value !== "function") {
    return false;
  }

  return Boolean(IS_THUNK_REG.exec(value));
}

export function typeToString(value: TypeValue) {
  if (typeof value === "function") {
    return value.name;
  }

  return value.toString();
}
