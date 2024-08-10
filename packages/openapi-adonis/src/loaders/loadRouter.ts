import type { Router } from "@adonisjs/http-server";
import type { DocumentBuilder } from "openapi-decorators/builders";
import { loadRoute } from "./loadRoute";

/**
 * Enrich document from Adonis Router.
 */
export async function loadRouter(document: DocumentBuilder, router: Router) {
  const routerJson = router.toJSON();

  for (const [_, routes] of Object.entries(routerJson)) {
    for (const route of routes) {
      await loadRoute(document, route);
    }
  }
}
