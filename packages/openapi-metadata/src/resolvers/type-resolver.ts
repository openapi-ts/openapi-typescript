import type { OpenAPIV3 } from "openapi-types";
import type { DocumentBuilder } from "../builders";

export abstract class TypeResolver {
  public abstract name(): string;
  public abstract schema(document: DocumentBuilder): Promise<OpenAPIV3.SchemaObject>;

  public static supports(type: any): boolean {
    return false;
  }
}
