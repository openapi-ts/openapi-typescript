import type { OpenAPIV3 } from "openapi-types";
import { BaseBuilder } from "./base-builder";
import { deepmerge } from "../utils/deepmerge";

export class OperationBuilder extends BaseBuilder<OpenAPIV3.OperationObject> {
  private operation: OpenAPIV3.OperationObject = {
    responses: {},
  };

  public setRequestBody(body: OpenAPIV3.ReferenceObject | OpenAPIV3.RequestBodyObject) {
    this.operation.requestBody = body;
    return this;
  }

  public addTags(...tags: string[]) {
    this.operation.tags = [...(this.operation.tags ?? []), ...tags];
    return this;
  }

  public setResponse(code: string, response: OpenAPIV3.ResponseObject) {
    this.operation.responses[code] = response;
    return this;
  }

  public addParameter(parameter: OpenAPIV3.ParameterObject) {
    this.operation.parameters = [...(this.operation.parameters ?? []), parameter];
  }

  public merge(operation: Partial<OpenAPIV3.OperationObject>) {
    this.operation = deepmerge(this.operation, operation);
    return this;
  }

  public build(): OpenAPIV3.OperationObject {
    return this.operation;
  }
}
