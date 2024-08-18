import type { OpenAPIV3 } from "openapi-types";
import { OperationBuilder, type DocumentBuilder } from "openapi-decorators/builders";
import type { AdonisRoute } from "../types";
import { loadApiOperation, loadController } from "openapi-decorators/loaders";
import { normalizeRoutePattern } from "../utils/normalizeRoutePattern";

export async function loadRoute(document: DocumentBuilder, route: AdonisRoute) {
  if (typeof route.handler !== "object" || !Array.isArray(route.handler.reference)) {
    return;
  }

  const importer = route.handler.reference[0] as () => Promise<{ default: any }>;
  const propertyKey = route.handler.reference[1] as string;

  const target = (await importer().then((t: any) => t.default)) as any;

  for (const method of route.methods) {
    if (method === "HEAD") {
      continue;
    }

    const operation = new OperationBuilder();

    loadApiOperation(operation, {
      method: method.toLowerCase() as `${OpenAPIV3.HttpMethods}`,
      pattern: normalizeRoutePattern(route.pattern),
    });

    loadController(document, operation, target.prototype, propertyKey);

    document.addOperation(operation);
  }
}
