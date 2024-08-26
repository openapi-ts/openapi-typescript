import type { DocumentBuilder } from "../builders/document-builder";
import type { OperationBuilder } from "../builders/operation-builder";
import type { ApiResponseOptions } from "../decorators/api-response";
import { resolveType } from "./loadType";

export async function loadApiResponse(
  document: DocumentBuilder,
  operation: OperationBuilder,
  apiResponse: ApiResponseOptions,
) {
  const { type, status, ...rest } = apiResponse;
  const schema = type ? await resolveType(document, type) : undefined;

  operation.setResponse(status?.toString() ?? "200", {
    description: "OK", // TODO: Depends on status,
    content: {
      "application/json": {
        schema,
      },
    },
    ...rest,
  });
}
