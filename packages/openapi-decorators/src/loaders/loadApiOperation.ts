import type { OperationBuilder } from "../builders/operation-builder";
import type { ApiOperationOptions } from "../decorators/api-operation";

export function loadApiOperation(operation: OperationBuilder, apiOperation: ApiOperationOptions) {
  operation.merge(apiOperation);
}
