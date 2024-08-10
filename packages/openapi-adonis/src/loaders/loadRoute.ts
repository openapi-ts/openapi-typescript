import type { OpenAPIV3 } from "openapi-types";
import { OperationBuilder, type DocumentBuilder } from "openapi-decorators/builders";
import type { AdonisRoute } from "../types";
import { loadController } from "./loadController";
import { getApiTags } from "openapi-decorators";
import { loadApiTags } from "openapi-decorators/loaders";
import { normalizeRoutePattern } from "../utils/normalizeRoutePattern";

export async function loadRoute(document: DocumentBuilder, route: AdonisRoute) {
  if (typeof route.handler !== "object" || !Array.isArray(route.handler.reference)) {
    return;
  }

  const importer = route.handler.reference[0] as Function;
  const propertyKey = route.handler.reference[1] as string;

  const target = (await importer().then((t: any) => t.default)) as any;

  const operation = new OperationBuilder();

  const apiTags = getApiTags(target);
  if (apiTags) {
    loadApiTags(operation, apiTags);
  }

  loadController(document, operation, target.prototype, propertyKey);

  for (const method of route.methods) {
    if (method === "HEAD") {
      continue;
    }

    document.setOperation(
      method.toLowerCase() as OpenAPIV3.HttpMethods,
      normalizeRoutePattern(route.pattern),
      operation.build(),
    );
  }
}
