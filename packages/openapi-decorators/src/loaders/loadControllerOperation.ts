import type { DocumentBuilder } from "../builders/document-builder";
import type { OperationBuilder } from "../builders/operation-builder";
import { getApiBody } from "../decorators/api-body";
import { getApiOperation } from "../decorators/api-operation";
import { getApiParams } from "../decorators/api-param";
import { getApiQueries } from "../decorators/api-query";
import { getApiResponses } from "../decorators/api-response";
import { getApiTags } from "../decorators/api-tags";
import { loadApiBody } from "./loadApiBody";
import { loadApiOperation } from "./loadApiOperation";
import { loadApiParam } from "./loadApiParam";
import { loadApiQuery } from "./loadApiQuery";
import { loadApiResponse } from "./loadApiResponse";
import { loadApiTags } from "./loadApiTags";

export async function loadControllerOperation(
  document: DocumentBuilder,
  operation: OperationBuilder,
  target: any,
  propertyKey: string,
) {
  const globalApiTags = getApiTags(target.constructor);
  if (globalApiTags) {
    loadApiTags(operation, globalApiTags);
  }

  const apiOperation = getApiOperation(target, propertyKey);
  if (apiOperation) {
    loadApiOperation(operation, apiOperation);
  }

  const apiTags = getApiTags(target, propertyKey);
  if (apiTags) {
    loadApiTags(operation, apiTags);
  }

  const apiBody = getApiBody(target, propertyKey);
  if (apiBody) {
    await loadApiBody(document, operation, apiBody);
  }

  const apiResponses = getApiResponses(target, propertyKey);
  for (const apiResponse of apiResponses) {
    await loadApiResponse(document, operation, apiResponse);
  }

  const apiParams = getApiParams(target, propertyKey);
  for (const apiParam of apiParams) {
    await loadApiParam(document, operation, apiParam);
  }

  const apiQueries = getApiQueries(target, propertyKey);
  for (const apiQuery of apiQueries) {
    await loadApiQuery(document, operation, apiQuery);
  }

  const name = target.constructor.name.replace("Controller", "");
  loadApiTags(operation, [name]);
}
