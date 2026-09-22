import type { Readable, Writable, components } from "./immutable.js";
import type { components as MutableComponents } from "./mutable.js";
import type { $defs as Definitions, components as RootComponents } from "./definitions.js";

type Schemas = components["schemas"];
const matrix: Schemas["Matrix"] = [[1, 2], [3]];
// @ts-expect-error the outer array is readonly
matrix.push([4]);
// @ts-expect-error the inner arrays are readonly
matrix[0].push(4);
const mixed: Schemas["Mixed"] = ["one", [1, 2]];
// @ts-expect-error the outer array must not collapse into the item union
const missingOuter: Schemas["Mixed"] = "one";
// @ts-expect-error a number is not an item of the outer array
const wrongDepth: Schemas["Mixed"] = [1];

const token: RootComponents["schemas"]["Token"] = "token";
// @ts-expect-error comments around a mapped root must not erase its value type
const invalidToken: RootComponents["schemas"]["Token"] = 1;
declare const definitions: Definitions;
// @ts-expect-error mapped root definitions preserve readonly keys
definitions.Token = "other";

declare const response: Readable<Schemas["Rows"]>;
const dates: string[] = response.map((row) => row.date.toISOString());
for (const row of response) {
  row.id.toUpperCase();
  // @ts-expect-error write-only fields are absent in responses
  row.secret;
}
declare const request: Writable<Schemas["Row"]>;
request.secret.toUpperCase();
// @ts-expect-error read-only fields are absent in requests
request.id.toUpperCase();
declare const row: Schemas["Row"];
row.mutable = { $read: "changed" };

const mutableMatrix: MutableComponents["schemas"]["Matrix"] = [[1]];
mutableMatrix.push([2]);
mutableMatrix[0].push(3);
