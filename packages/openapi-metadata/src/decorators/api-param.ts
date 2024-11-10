import { type OperationParameterMetadata, OperationParameterMetadataStorage } from "../metadata/operation-parameter.js";

export type ApiParamOptions = Omit<OperationParameterMetadata, "in">;

export function ApiParam(options: ApiParamOptions) {
  return function (target: Object, propertyKey?: string | symbol) {
    OperationParameterMetadataStorage.mergeMetadata(target, [{ in: "path", ...options }], propertyKey);
  };
}
