import { ExtraModelsMetadataStorage } from "../metadata/extra-models";
import type { Thunk, TypeValue } from "../types";

export function ApiExtraModels(...models: (TypeValue | Thunk<TypeValue>)[]) {
  return (target: Object) => {
    ExtraModelsMetadataStorage.mergeMetadata(target, models);
  };
}
