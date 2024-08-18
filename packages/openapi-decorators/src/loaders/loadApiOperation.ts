import type { OperationBuilder } from "../builders/operation-builder";
import type { ApiOperationOptions } from "../decorators/api-operation";

export function loadApiOperation(operation: OperationBuilder, apiOperation: ApiOperationOptions) {
  const { pattern, method, ...rest } = apiOperation;

  if (pattern) {
    operation.pattern = pattern;
  }

  if (method) {
    operation.method = method;
  }

  operation.merge(rest);
}
