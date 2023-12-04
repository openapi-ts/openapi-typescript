import { STRING } from "../lib/ts.js";
import transformSchemaObject from "./schema-object.js";
export default function transformParameterObject(parameterObject, options) {
    return parameterObject.schema
        ? transformSchemaObject(parameterObject.schema, options)
        : STRING;
}
//# sourceMappingURL=parameter-object.js.map