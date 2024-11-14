import { ExtraModelsMetadataStorage } from "../metadata/extra-models.js";
import type { Thunk, TypeValue } from "../types.js";

/**
 * Adds extra models to the generated schema that are not used anywhere else.
 * Useful when you want to share models that are not used by your operations.
 */
export function ApiExtraModels(...models: (TypeValue | Thunk<TypeValue>)[]) {
  return (target: Object) => {
    ExtraModelsMetadataStorage.mergeMetadata(target, models);
  };
}
