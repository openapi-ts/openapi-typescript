import type { OpenAPIV3 } from "openapi-types";
import { BaseBuilder } from "./base-builder";
import { deepmerge } from "../utils/deepmerge";

export class SchemaBuilder extends BaseBuilder<OpenAPIV3.SchemaObject> {
  private schema: OpenAPIV3.SchemaObject = {};

  constructor(private readonly name: string) {
    super();
  }

  public setType(type: "array" | OpenAPIV3.NonArraySchemaObjectType) {
    this.schema.type = type;
    return this;
  }

  public setProperty(name: string, schema: OpenAPIV3.SchemaObject | OpenAPIV3.ReferenceObject, required: boolean) {
    if (!this.schema.properties) {
      this.schema.properties = {};
    }

    this.schema.properties[name] = schema;

    if (required) {
      if (!this.schema.required) {
        this.schema.required = [];
      }

      this.schema.required.push(name);
    }

    return this;
  }

  public merge(schema: Partial<OpenAPIV3.SchemaObject>) {
    this.schema = deepmerge(this.schema, schema);
    return this;
  }

  public get ref(): OpenAPIV3.ReferenceObject {
    return {
      $ref: `#/components/schemas/${this.name}`,
    };
  }

  public build(): OpenAPIV3.SchemaObject {
    return this.schema;
  }
}
