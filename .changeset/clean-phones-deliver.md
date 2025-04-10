---
"openapi-typescript": minor
---

Extract types generation for Array-type schemas to `transformArraySchemaObject` method.
Generate correct number of union members for `minItems` * `maxItems` unions.
Generate readonly tuple members for `minItems` & `maxItems` unions.
Generate readonly spread member for `prefixItems` tuple.
Preserve `prefixItems` type members in `minItems` & `maxItems` tuples.
Generate spread member for `prefixItems` tuple with no `minItems` / `maxItems` constraints.
