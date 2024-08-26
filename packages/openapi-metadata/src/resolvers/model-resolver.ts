import type { OpenAPIV3 } from "openapi-types";
import { TypeResolver } from "./type-resolver";
import { getApiProperties } from "../decorators/api-property";
import { loadApiProperty } from "../loaders";
import type { DocumentBuilder } from "../builders";

export class ModelTypeResolver extends TypeResolver {
  constructor(private readonly type: any) {
    super();
  }

  public name(): string {
    return this.type.name;
  }

  public async schema(document: DocumentBuilder): Promise<OpenAPIV3.SchemaObject> {
    const schema: OpenAPIV3.SchemaObject = {
      type: "object",
    };

    const properties = getApiProperties(this.type.prototype);

    for (const [name, apiProperty] of Object.entries(properties)) {
      loadApiProperty(document, schema, name, apiProperty);
    }

    return schema;
  }

  public static supports(type: any): boolean {
    return true;
  }
}

export function ModelType(type: any) {
  return new ModelTypeResolver(type);
}
