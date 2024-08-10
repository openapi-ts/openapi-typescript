import type { OperationBuilder } from "../builders/operation-builder";

export function loadApiTags(operation: OperationBuilder, apiTags: string[]) {
  return operation.addTags(...apiTags);
}
