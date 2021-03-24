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
  immutableTypes: boolean;
  required?: string[];
}

/** Take object keys and convert to TypeScript interface */
export function transformSchemaObjMap(obj: Record<string, any>, options: TransformSchemaObjMapOptions): string {
  const readonly = options.immutableTypes ? "readonly " : "";
  let required = (options && options.required) || [];

  let output = "";

  Object.entries(obj).forEach(([key, value]) => {
    // 1. JSDoc comment (goes above property)
    if (value.description) output += comment(value.description);

    // 2. name (with “?” if optional property)
    output += `${readonly}"${key}"${required.includes(key) ? "" : "?"}: `;

    // 3. transform
    output += transformSchemaObj(value.schema || value, { immutableTypes: options.immutableTypes });

    // 4. close
    output += `;\n`;
  });

  return output.replace(/\n+$/, "\n"); // replace repeat line endings with only one
}

interface Options {
  immutableTypes: boolean;
}

/** transform anyOf */
export function transformAnyOf(anyOf: any, options: Options): string {
  return tsIntersectionOf(anyOf.map((s: any) => tsPartial(transformSchemaObj(s, options))));
}

/** transform oneOf */
export function transformOneOf(oneOf: any, options: Options): string {
  return tsUnionOf(oneOf.map((value: any) => transformSchemaObj(value, options)));
}

/** Convert schema object to TypeScript */
export function transformSchemaObj(node: any, options: Options): string {
  const readonly = options.immutableTypes ? "readonly " : "";

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
        output += `{ ${readonly}[key: string]: any }`;
        break;
      }

      let properties = transformSchemaObjMap(node.properties || {}, {
        immutableTypes: options.immutableTypes,
        required: node.required,
      });

      // if additional properties, add an intersection with a generic map type
      let additionalProperties: string | undefined;
      if (node.additionalProperties) {
        if (node.additionalProperties === true || Object.keys(node.additionalProperties).length === 0) {
          additionalProperties = `{ [key: string]: any }`;
        } else if (typeof node.additionalProperties === "object") {
          const oneOf: any[] | undefined = (node.additionalProperties as any).oneOf || undefined; // TypeScript does a really bad job at inference here, so we enforce a type
          const anyOf: any[] | undefined = (node.additionalProperties as any).anyOf || undefined; // "
          if (oneOf) {
            additionalProperties = `{ ${readonly}[key: string]: ${transformOneOf(oneOf, options)}; }`;
          } else if (anyOf) {
            additionalProperties = `{ ${readonly}[key: string]: ${transformAnyOf(anyOf, options)}; }`;
          } else {
            additionalProperties = `{ ${readonly}[key: string]: ${
              transformSchemaObj(node.additionalProperties, options) || "any"
            }; }`;
          }
        }
      }

      output += tsIntersectionOf([
        // append allOf/anyOf/oneOf first
        ...(node.allOf ? (node.allOf as any[]).map((node) => transformSchemaObj(node, options)) : []),
        ...(node.anyOf ? [transformAnyOf(node.anyOf, options)] : []),
        ...(node.oneOf ? [transformOneOf(node.oneOf, options)] : []),
        ...(properties ? [`{\n${properties}\n}`] : []), // then properties (line breaks are important!)
        ...(additionalProperties ? [additionalProperties] : []), // then additional properties
      ]);

      break;
    }

    case "array": {
      if (Array.isArray(node.items)) {
        output += `${readonly}${tsTupleOf(node.items.map((node: any) => transformSchemaObj(node, options)))}`;
      } else {
        output += `${readonly}${tsArrayOf(node.items ? transformSchemaObj(node.items as any, options) : "any")}`;
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
