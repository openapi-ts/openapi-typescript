import type { OpenAPIV3 } from "openapi-types";
import { buildDocumentBase } from "../fixtures/document-base";
import { BaseBuilder } from "./base-builder";
import { generateScalarUI } from "../ui/scalar";
import { SchemaBuilder } from "./schema-builder";

export class DocumentBuilder extends BaseBuilder<OpenAPIV3.Document> {
  private readonly document: OpenAPIV3.Document = buildDocumentBase();
  private readonly schemas: Record<string, SchemaBuilder> = {};

  public setTitle(title: string): this {
    this.document.info.title = title;
    return this;
  }

  public setDescription(description: string): this {
    this.document.info.description = description;
    return this;
  }

  public createSchema(name: string): SchemaBuilder {
    const builder = new SchemaBuilder(name);
    this.schemas[name] = builder;
    return builder;
  }

  public hasSchema(name: string): OpenAPIV3.ReferenceObject | false {
    const schema = this.schemas[name];
    if (!schema) {
      return false;
    }
    return schema.ref;
  }

  public setOperation(method: OpenAPIV3.HttpMethods, pattern: string, operation: OpenAPIV3.OperationObject) {
    if (!this.document.paths[pattern]) {
      this.document.paths[pattern] = {};
    }

    // biome-ignore lint/style/noNonNullAssertion: Defined two lines above
    this.document.paths[pattern]![method] = operation;
  }

  public scalar(url: string) {
    return generateScalarUI(url);
  }

  public build(): OpenAPIV3.Document {
    const schemas = Object.entries(this.schemas).reduce(
      (a, [name, builder]) => ({ ...a, [name]: builder.build() }),
      {},
    );

    return {
      ...this.document,
      components: {
        ...this.document.components,
        schemas: {
          ...schemas,
          ...this.document.components?.schemas,
        },
      },
    };
  }
}
