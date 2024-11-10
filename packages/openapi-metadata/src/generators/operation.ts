import type { OpenAPIV3 } from "openapi-types";
import type { Context } from "../context.js";
import type { OperationMetadata } from "../metadata/operation.js";
import { OperationBodyMetadataStorage } from "../metadata/operation-body.js";
import { generateOperationBody } from "./operation-body.js";
import { OperationParameterMetadataStorage } from "../metadata/operation-parameter.js";
import { generateOperationParameters } from "./operation-parameters.js";
import { OperationResponseMetadataStorage } from "../metadata/operation-response.js";
import { generateOperationResponse } from "./operation-response.js";
import { OperationSecurityMetadataStorage } from "../metadata/operation-security.js";
import { ExtraModelsMetadataStorage } from "../metadata/extra-models.js";
import { loadType } from "../loaders/type.js";

export async function generateOperation(
  context: Context,
  controller: Function,
  propertyKey: string,
  { path, methods, ...metadata }: OperationMetadata,
): Promise<OpenAPIV3.OperationObject> {
  const operation: OpenAPIV3.OperationObject = { ...metadata, responses: {} };

  const target = controller.prototype;

  const extraModels = ExtraModelsMetadataStorage.getMetadata(target);

  await Promise.all(extraModels.map((m) => loadType(context, { type: m })));

  const body = OperationBodyMetadataStorage.getMetadata(target, propertyKey);
  if (body) {
    operation.requestBody = await generateOperationBody(context, body);
  }

  const parameters = OperationParameterMetadataStorage.getMetadata(target, propertyKey);
  operation.parameters = [];
  for (const parameter of parameters) {
    operation.parameters.push(await generateOperationParameters(context, parameter));
  }

  const responses = OperationResponseMetadataStorage.getMetadata(target, propertyKey);
  for (const [status, response] of Object.entries(responses)) {
    operation.responses[status] = await generateOperationResponse(context, response);
  }

  const security = OperationSecurityMetadataStorage.getMetadata(target, propertyKey, true);

  operation.security = [security];

  return operation;
}
