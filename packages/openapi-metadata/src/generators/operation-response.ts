import type { OpenAPIV3 } from "openapi-types";
import type { Context } from "../context.js";
import { loadType } from "../loaders/type.js";
import type { OperationResponseMetadata } from "../metadata/operation-response.js";

export async function generateOperationResponse(
  context: Context,
  metadata: OperationResponseMetadata,
): Promise<OpenAPIV3.ResponseObject> {
  const { type, schema: s, enum: e, mediaType, status, ...response } = metadata;

  return {
    description: "",
    ...response,
    content: {
      [mediaType]: {
        schema: await loadType(context, metadata),
      },
    },
  };
}
