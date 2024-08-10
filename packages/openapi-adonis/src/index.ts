import type { OpenAPIV3 } from "openapi-types";

import type { Router } from "@adonisjs/http-server";
import { DocumentBuilder } from "openapi-decorators/builders";
import { generateScalarUI } from "openapi-decorators/ui";
import { loadRouter } from "./loaders/loadRouter";

// biome-ignore lint/complexity/noStaticOnlyClass: TODO: move out of class
export default class AdonisOpenAPI {
  public static document() {
    return new DocumentBuilder();
  }

  public static async load(builder: DocumentBuilder, router: Router): Promise<OpenAPIV3.Document> {
    await loadRouter(builder, router);
    return builder.build();
  }

  public static setup(pattern: string, router: Router, builder: DocumentBuilder) {
    router.get(pattern, () => {
      return generateScalarUI("/docs.json");
    });

    router.get(`${pattern}.json`, async () => {
      await AdonisOpenAPI.load(builder, router);
      return builder.build();
    });
  }
}
