import type { OpenAPIV3 } from "openapi-types";
import type { Context } from "../context.js";
import type { OperationResponseMetadata } from "../metadata/operation-response.js";
import { loadType } from "../loaders/type.js";

export async function generateOperationResponse(
  context: Context,
  metadata: OperationResponseMetadata,
): Promise<OpenAPIV3.ResponseObject> {
  const { type, schema: s, enum: e, ...response } = metadata as any;

  return {
    description: "",
    ...response,
    content: {
      [metadata.mediaType]: {
        schema: await loadType(context, metadata),
      },
    },
  };
}
