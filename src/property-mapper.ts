import {
  OpenAPI2SchemaObject,
  OpenAPI3SchemaObject,
  SwaggerToTSOptions,
} from "./types";
import { isObjNode, fromEntries } from "./utils";

export default function propertyMapper<T = any>(
  schema: T,
  transform: SwaggerToTSOptions["propertyMapper"]
): T {
  if (!transform) {
    return schema;
  }

  return JSON.parse(JSON.stringify(schema), (_, node: OpenAPI2SchemaObject) => {
    // if no properties, skip
    if (!isObjNode(node) || !node.properties) {
      return node;
    }

    // map over properties, transforming if needed
    node.properties = fromEntries(
      Object.entries(node.properties).map(([key, val]) => {
        // if $ref, skip
        if (val.$ref) {
          return [key, val];
        }

        const schemaObject = val as OpenAPI2SchemaObject | OpenAPI3SchemaObject;

        const property = transform(schemaObject, {
          interfaceType: schemaObject.type as string,
          optional:
            !Array.isArray(node.required) || node.required.includes(key),
          description: schemaObject.description,
        });

        // update requirements
        if (property.optional) {
          if (Array.isArray(node.required)) {
            node.required = node.required.filter((r) => r !== key);
          }
        } else {
          node.required = [...(node.required || []), key];
        }

        // transform node from mapper
        return [
          key,
          {
            ...val,
            type: property.interfaceType,
            description: property.description,
          },
        ];
      })
    ) as OpenAPI2SchemaObject["properties"];

    return node; // return by default
  });
}
