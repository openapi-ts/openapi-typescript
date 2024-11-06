import type { OpenAPIV3 } from "openapi-types";
import type { Context } from "../context";
import type { OperationBodyMetadata } from "../metadata/operation-body";
import { loadType } from "../loaders/type";

export async function generateOperationBody(
  context: Context,
  metadata: OperationBodyMetadata,
): Promise<OpenAPIV3.RequestBodyObject> {
  const schema = await loadType(context, metadata);

  return {
    content: {
      [metadata.mediaType]: {
        schema: schema,
      },
    },
  };
}
