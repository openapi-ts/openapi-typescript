import type { OpenAPIV3 } from "openapi-types";
import type { Context } from "../context";
import type { OperationParameterMetadata } from "../metadata/operation-parameter";
import { loadType } from "../loaders/type";

export async function generateOperationParameters(
  context: Context,
  metadata: OperationParameterMetadata,
): Promise<OpenAPIV3.ParameterObject> {
  const { schema: s, enum: e, type, ...parameter } = metadata as any;

  return {
    ...parameter,
    schema: await loadType(context, { type: "string", ...metadata }),
  };
}
