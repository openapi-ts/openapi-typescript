import { ItemsObject, ParameterObject } from "types";
import { tsUnionOf } from "../utils";

function transformEnum(enumArray: string[]): string {
  return tsUnionOf(enumArray.map((e) => (typeof e === "string" ? `'${e.replace(/'/g, "\\'")}'` : e)));
}

function transformItemsObj(obj: ItemsObject): string {
  switch (obj.type) {
    case "string": {
      return `${obj.enum ? transformEnum(obj.enum) : "string"}[]`;
    }
    case "number":
    case "boolean": {
      return `${obj.type}[]`;
    }
    case "integer": {
      return "number[]";
    }
    case "array": {
      return obj.items ? transformItemsObj(obj.items) : "unknown[]";
    }
  }
}

export function transformType(parameter: ParameterObject): string {
  switch (parameter.type) {
    case "string": {
      return parameter.enum ? transformEnum(parameter.enum) : "string";
    }
    case "number":
    case "boolean": {
      return parameter.type;
    }
    case "integer": {
      return "number";
    }
    case "array": {
      return parameter.items ? transformItemsObj(parameter.items) : "unknown[]";
    }
    case "file":
      return "string";
  }
  return "unknown";
}
