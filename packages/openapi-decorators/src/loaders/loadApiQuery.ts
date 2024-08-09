import type { DocumentBuilder } from "../builders/document-builder";
import type { OperationBuilder } from "../builders/operation-builder";
import type { ApiQueryOptions } from "../decorators/api-query";
import { resolveType } from "./loadType";

export function loadApiQuery(document: DocumentBuilder, operation: OperationBuilder, apiQuery: ApiQueryOptions) {
  const { type, ...rest } = apiQuery;

  const schema = resolveType(document, type ?? "string");

  operation.addParameter({
    in: "query",
    schema,
    ...rest,
  });
}
