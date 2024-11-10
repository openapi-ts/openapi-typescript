import type { Thunk, TypeValue } from "../types.js";
import { createMetadataStorage } from "./factory.js";

export const ExtraModelsMetadataKey = Symbol("ExtraModels");

export const ExtraModelsMetadataStorage = createMetadataStorage<
  (TypeValue | Thunk<TypeValue>)[]
>(ExtraModelsMetadataKey, []);
