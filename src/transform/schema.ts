import {
  comment,
  nodeType,
  transformRef,
  tsArrayOf,
  tsIntersectionOf,
  tsPartial,
  tsTupleOf,
  tsUnionOf,
} from "../utils";

interface TransformSchemaObjMapOptions {
  required?: string[];
}

/** Take object keys and convert to TypeScript interface */
export function transformSchemaObjMap(obj: Record<string, any>, options?: TransformSchemaObjMapOptions): string {
  let output = "";
  let required = (options && options.required) || [];

  Object.entries(obj).forEach(([key, value]) => {
    // 1. JSDoc comment (goes above property)
    if (value.description) output += comment(value.description);

    // 2. name (with “?” if optional property)
    output += `"${key}"${required.includes(key) ? "" : "?"}: `;

    // 3. transform
    output += transformSchemaObj(value.schema || value);

    // 4. close
    output += `;\n`;
  });

  return output.replace(/\n+$/, "\n"); // replace repeat line endings with only one
}

/** transform anyOf */
export function transformAnyOf(anyOf: any): string {
  return tsIntersectionOf(anyOf.map((s: any) => tsPartial(transformSchemaObj(s))));
}

/** transform oneOf */
export function transformOneOf(oneOf: any): string {
  return tsUnionOf(oneOf.map(transformSchemaObj));
}

/** Convert schema object to TypeScript */
export function transformSchemaObj(node: any): string {
  let output = "";

  // open nullable
  if (node.nullable) {
    output += "(";
  }

  // transform core type
  switch (nodeType(node)) {
    case "ref": {
      output += transformRef(node.$ref);
      break;
    }
    case "string":
    case "number":
    case "boolean": {
      output += nodeType(node) || "any";
      break;
    }
    case "enum": {
      const items: Array<string | number | boolean> = [];
      (node.enum as unknown[]).forEach((item) => {
        if (typeof item === "string") items.push(`'${item.replace(/'/g, "\\'")}'`);
        else if (typeof item === "number" || typeof item === "boolean") items.push(item);
        else if (item === null && !node.nullable) items.push("null");
      });
      output += tsUnionOf(items);
      break;
    }
    case "object": {
      const isAnyOfOrOneOfOrAllOf = "anyOf" in node || "oneOf" in node || "allOf" in node;

      // if empty object, then return generic map type
      if (
        !isAnyOfOrOneOfOrAllOf &&
        (!node.properties || !Object.keys(node.properties).length) &&
        !node.additionalProperties
      ) {
        output += `{ [key: string]: any }`;
        break;
      }

      let properties = transformSchemaObjMap(node.properties || {}, { required: node.required });

      // if additional properties, add an intersection with a generic map type
      let additionalProperties: string | undefined;
      if (node.additionalProperties) {
        if (node.additionalProperties === true) {
          additionalProperties = `{ [key: string]: any }`;
        } else if (typeof node.additionalProperties === "object") {
          const oneOf: any[] | undefined = (node.additionalProperties as any).oneOf || undefined; // TypeScript does a really bad job at inference here, so we enforce a type
          const anyOf: any[] | undefined = (node.additionalProperties as any).anyOf || undefined; // "
          if (oneOf) {
            additionalProperties = `{ [key: string]: ${transformOneOf(oneOf)}; }`;
          } else if (anyOf) {
            additionalProperties = `{ [key: string]: ${transformAnyOf(anyOf)}; }`;
          } else {
            additionalProperties = `{ [key: string]: ${transformSchemaObj(node.additionalProperties) || "any"}; }`;
          }
        }
      }

      output += tsIntersectionOf([
        // append allOf/anyOf/oneOf first
        ...(node.allOf ? (node.allOf as any[]).map(transformSchemaObj) : []),
        ...(node.anyOf ? [transformAnyOf(node.anyOf)] : []),
        ...(node.oneOf ? [transformOneOf(node.oneOf)] : []),
        ...(properties ? [`{\n${properties}\n}`] : []), // then properties (line breaks are important!)
        ...(additionalProperties ? [additionalProperties] : []), // then additional properties
      ]);

      break;
    }

    case "array": {
      if (Array.isArray(node.items)) {
        output += tsTupleOf(node.items.map(transformSchemaObj));
      } else {
        output += tsArrayOf(node.items ? transformSchemaObj(node.items as any) : "any");
      }
      break;
    }
  }

  // close nullable
  if (node.nullable) {
    output += ") | null";
  }

  return output;
}
