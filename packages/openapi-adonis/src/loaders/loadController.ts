import type { DocumentBuilder, OperationBuilder } from "openapi-decorators/builders";
import {
  getApiBody,
  getApiOperation,
  getApiParams,
  getApiQueries,
  getApiResponses,
  getApiTags,
} from "openapi-decorators";
import {
  loadApiBody,
  loadApiOperation,
  loadApiParam,
  loadApiQuery,
  loadApiResponse,
  loadApiTags,
} from "openapi-decorators/loaders";

/**
 * Enrich operation from Adonis Controller function
 */
export function loadController(
  document: DocumentBuilder,
  operation: OperationBuilder,
  target: any,
  propertyKey: string,
) {
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
    loadApiBody(document, operation, apiBody);
  }

  const apiResponses = getApiResponses(target, propertyKey);
  for (const apiResponse of apiResponses) {
    loadApiResponse(document, operation, apiResponse);
  }

  const apiParams = getApiParams(target, propertyKey);
  for (const apiParam of apiParams) {
    loadApiParam(document, operation, apiParam);
  }

  const apiQueries = getApiQueries(target, propertyKey);
  for (const apiQuery of apiQueries) {
    loadApiQuery(document, operation, apiQuery);
  }
}
