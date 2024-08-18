import type { OpenAPIV3 } from "openapi-types";
import { BaseBuilder } from "./base-builder";
import { deepmerge } from "../utils/deepmerge";

export class OperationBuilder extends BaseBuilder<OpenAPIV3.OperationObject> {
  method: `${OpenAPIV3.HttpMethods}` | undefined;
  pattern: string | undefined;

  #operation: OpenAPIV3.OperationObject = {
    responses: {},
  };

  setRequestBody(body: OpenAPIV3.ReferenceObject | OpenAPIV3.RequestBodyObject) {
    this.#operation.requestBody = body;
    return this;
  }

  addTags(...tags: string[]) {
    this.#operation.tags = [...(this.#operation.tags ?? []), ...tags];
    return this;
  }

  setResponse(code: string, response: OpenAPIV3.ResponseObject) {
    this.#operation.responses[code] = response;
    return this;
  }

  addParameter(parameter: OpenAPIV3.ParameterObject) {
    this.#operation.parameters = [...(this.#operation.parameters ?? []), parameter];
  }

  merge(operation: Partial<OpenAPIV3.OperationObject>) {
    this.#operation = deepmerge(this.#operation, operation);
    return this;
  }

  build(): OpenAPIV3.OperationObject {
    return this.#operation;
  }
}
