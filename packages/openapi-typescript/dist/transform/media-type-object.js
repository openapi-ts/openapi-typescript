import { UNKNOWN } from "../lib/ts.js";
import transformSchemaObject from "./schema-object.js";
export default function transformMediaTypeObject(mediaTypeObject, options) {
    if (!mediaTypeObject.schema) {
        return UNKNOWN;
    }
    return transformSchemaObject(mediaTypeObject.schema, options);
}
//# sourceMappingURL=media-type-object.js.map