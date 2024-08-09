import type { DocumentBuilder } from "../builders/document-builder";
import type { OperationBuilder } from "../builders/operation-builder";
import type { ApiBodyOptions } from "../decorators";
import { resolveType } from "./loadType";

export function loadApiBody(document: DocumentBuilder, operation: OperationBuilder, apiBody: ApiBodyOptions) {
  const { type, isArray, ...rest } = apiBody;

  const schema = type ? resolveType(document, type) : undefined;

  operation.setRequestBody({
    ...rest,
    content: {
      "application/json": {
        schema,
      },
    },
  });
}
