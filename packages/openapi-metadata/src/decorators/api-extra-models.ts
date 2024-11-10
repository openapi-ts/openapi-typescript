import { ExtraModelsMetadataStorage } from "../metadata/extra-models.js";
import type { Thunk, TypeValue } from "../types.js";

export function ApiExtraModels(...models: (TypeValue | Thunk<TypeValue>)[]) {
  return (target: Object) => {
    ExtraModelsMetadataStorage.mergeMetadata(target, models);
  };
}
