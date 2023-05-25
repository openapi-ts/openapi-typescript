import { bench } from "vitest";
import { parseRef } from "../src/utils.js";

bench("parseRef", () => {
  parseRef("#/test/schema-object");
});
