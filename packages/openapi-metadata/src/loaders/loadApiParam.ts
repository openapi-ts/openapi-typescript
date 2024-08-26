import type { DocumentBuilder } from "../builders/document-builder";
import type { OperationBuilder } from "../builders/operation-builder";
import type { ApiParamOptions } from "../decorators/api-param";
import { resolveType } from "./loadType";

export async function loadApiParam(document: DocumentBuilder, operation: OperationBuilder, apiParam: ApiParamOptions) {
  const { type, ...rest } = apiParam;

  const schema = await resolveType(document, type ?? "string");

  operation.addParameter({
    in: "path",
    schema,
    ...rest,
  });
}
