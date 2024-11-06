import type { Thunk, TypeValue } from "../types";
import { createMetadataStorage } from "./factory";

export const ExtraModelsMetadataKey = Symbol("ExtraModels");

export const ExtraModelsMetadataStorage = createMetadataStorage<
  (TypeValue | Thunk<TypeValue>)[]
>(ExtraModelsMetadataKey, []);
