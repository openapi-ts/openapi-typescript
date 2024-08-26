import type { OpenAPIV3 } from "openapi-types";
import { buildDocumentBase } from "../fixtures/document-base";
import { BaseBuilder } from "./base-builder";
import { generateScalarUI } from "../ui/scalar";
import type { Type } from "../types";
import { TypeResolver } from "../resolvers/type-resolver";
import { ModelTypeResolver } from "../resolvers/model-resolver";
import type { OperationBuilder } from "./operation-builder";

export class DocumentBuilder extends BaseBuilder<OpenAPIV3.Document> {
  private readonly document: OpenAPIV3.Document = buildDocumentBase();
  private readonly operations: OperationBuilder[] = [];
  private readonly resolvers: Type<TypeResolver>[] = [ModelTypeResolver];

  public setTitle(title: string): this {
    this.document.info.title = title;
    return this;
  }

  public setDescription(description: string): this {
    this.document.info.description = description;
    return this;
  }

  public schemaRef(name: string): OpenAPIV3.ReferenceObject | false {
    const schema = this.document.components?.schemas?.[name];
    if (!schema) {
      return false;
    }

    return {
      $ref: `#/components/schemas/${name}`,
    };
  }

  public addOperation(operation: OperationBuilder) {
    this.operations.push(operation);
  }

  // public setOperation(method: OpenAPIV3.HttpMethods, pattern: string, operation: OpenAPIV3.OperationObject) {
  //   if (!this.document.paths[pattern]) {
  //     this.document.paths[pattern] = {};
  //   }
  //
  //   // biome-ignore lint/style/noNonNullAssertion: Defined two lines above
  //   this.document.paths[pattern]![method] = operation;
  // }

  public scalar(url: string): string {
    return generateScalarUI(url);
  }

  public addResolver(resolver: Type<TypeResolver>): this {
    this.resolvers.push(resolver);
    return this;
  }

  public async resolve(type: any): Promise<OpenAPIV3.ReferenceObject> {
    if (type instanceof TypeResolver) {
      return this.resolveFromTypeResolver(type);
    }

    for (const typeResolver of this.resolvers) {
      // TODO: Fix type
      if (!(typeResolver as any).supports(type)) {
        continue;
      }

      const resolver = new typeResolver(type);
      return this.resolveFromTypeResolver(resolver);
    }

    throw new Error("Cannot resolve type");
  }

  private async resolveFromTypeResolver(typeResolver: TypeResolver): Promise<OpenAPIV3.ReferenceObject> {
    const name = typeResolver.name();
    const existing = this.schemaRef(name);
    if (existing) {
      return existing;
    }

    // TODO: Do this properly
    this.document.components = {
      ...this.document.components,
      schemas: {
        ...this.document.components?.schemas,
        [name]: {},
      },
    };

    const schema = await typeResolver.schema(this);

    this.document.components = {
      ...this.document.components,
      schemas: {
        ...this.document.components?.schemas,
        [name]: schema,
      },
    };

    return {
      $ref: `#/components/schemas/${name}`,
    };
  }

  // TODO: Add proper errors
  public build(): OpenAPIV3.Document {
    for (const operation of this.operations) {
      if (!operation.pattern) {
        throw new Error("Operation does not have a pattern");
      }

      if (!operation.method) {
        throw new Error("Operation does not have a method");
      }

      this.document.paths = {
        ...this.document.paths,
        [operation.pattern]: {
          ...this.document.paths[operation.pattern],
          [operation.method]: operation.build(),
        },
      };
    }

    return this.document;
  }
}
