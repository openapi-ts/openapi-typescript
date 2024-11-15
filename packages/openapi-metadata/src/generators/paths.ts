import type { OpenAPIV3 } from "openapi-types";
import type { Context } from "../context.js";
import { generateOperation } from "./operation.js";
import { ExcludeMetadataStorage, ExtraModelsMetadataStorage, OperationMetadataStorage } from "../metadata/index.js";
import { loadType } from "../loaders/type.js";

export async function generatePaths(context: Context, controllers: Function[]): Promise<OpenAPIV3.PathsObject> {
  const paths: OpenAPIV3.PathsObject = {};

  for (const controller of controllers) {
    const target = controller.prototype;
    const keys = Object.getOwnPropertyNames(target);

    // Loads extra models defined on this controller
    const extraModels = ExtraModelsMetadataStorage.getMetadata(target);
    await Promise.all(extraModels.map((m) => loadType(context, { type: m })));

    for (const key of keys) {
      const metadata = OperationMetadataStorage.getMetadata(target, key, true);
      if (!metadata) {
        continue;
      }

      if (!metadata.path || !metadata.methods) {
        continue;
      }

      const excludeController = ExcludeMetadataStorage.getMetadata(target);
      if (excludeController === true) {
        continue;
      }

      for (const method of metadata.methods) {
        const excludeOperation = ExcludeMetadataStorage.getMetadata(target, key);

        if (excludeOperation === true) {
          continue;
        }

        paths[metadata.path] = {
          ...paths[metadata.path],
          [method]: await generateOperation(context, controller, key, metadata),
        };
      }
    }
  }

  return paths;
}
