import { describe, expect, test } from "vitest";
import openapiTS, { tsComment, tsPropertyIndex } from "../src/index.js";
import type { OpenAPI3, PropertySignatureLike } from "../src/types.js";
import { expectTypeScriptToCompile } from "./test-helpers.js";

describe("transformProperty", () => {
  test.each([
    { immutable: false, readWriteMarkers: false },
    { immutable: true, readWriteMarkers: false },
    { immutable: false, readWriteMarkers: true },
    { immutable: true, readWriteMarkers: true },
  ])("controls readonly in properties and $defs with %j", async (options) => {
    const properties = {
      forcedReadonly: { type: "string" as const },
      forcedMutable: { type: "string" as const, readOnly: true },
      unchanged: { type: "string" as const, readOnly: true },
    };
    const schema: OpenAPI3 = {
      openapi: "3.1.0",
      info: { title: "Property modifiers", version: "1.0.0" },
      components: {
        schemas: {
          Example: { type: "object", properties, required: Object.keys(properties), $defs: properties },
        },
      },
    };
    const seen = new Map<string, PropertySignatureLike>();
    const generated = await openapiTS(schema, {
      ...options,
      transformProperty(property, _schema, context) {
        seen.set(context.path ?? "", { ...property });
        if (property.name === "forcedReadonly") {
          return { ...property, readonly: true };
        }
        if (property.name === "forcedMutable") {
          return { ...property, readonly: false };
        }
        return undefined;
      },
    });

    expect(seen.size).toBe(6);
    const markedReadonly = options.immutable || !options.readWriteMarkers;
    const markedType = options.readWriteMarkers ? "$Read<string>" : "string";
    for (const prefix of ["#/components/schemas/Example", "#/components/schemas/Example/$defs"]) {
      expect(seen.get(`${prefix}/forcedReadonly`)?.readonly).toBe(options.immutable);
      expect(seen.get(`${prefix}/forcedMutable`)?.readonly).toBe(markedReadonly);
      expect(seen.get(`${prefix}/unchanged`)?.readonly).toBe(markedReadonly);
      const indent = seen.get(`${prefix}/unchanged`)?.indent;
      expect(generated).toContain(`\n${indent}readonly forcedReadonly: string;`);
      expect(generated).toContain(`\n${indent}forcedMutable: ${markedType};`);
      expect(generated).toContain(`\n${indent}${markedReadonly ? "readonly " : ""}unchanged: ${markedType};`);
    }
  });

  test("preserves name, optionality, type and comments when overriding readonly", async () => {
    const field = { type: "string" as const, description: "Schema documentation" };
    const schema: OpenAPI3 = {
      openapi: "3.1.0",
      info: { title: "Property customization", version: "1.0.0" },
      components: {
        schemas: {
          Example: {
            type: "object",
            properties: { original: field },
            required: ["original"],
            $defs: { original: field },
          },
        },
      },
    };
    const generated = await openapiTS(schema, {
      transformProperty(property) {
        return {
          ...property,
          name: tsPropertyIndex("renamed-value"),
          optional: true,
          type: "Date | null",
          readonly: true,
          comment: tsComment(["@custom Hook documentation"], property.indent),
        };
      },
    });

    for (const indent of ["            ", "                "]) {
      expect(generated).toContain(
        `${tsComment(["@custom Hook documentation"], indent)}${indent}/** @description Schema documentation */\n${indent}readonly "renamed-value"?: Date | null;`,
      );
    }
    expectTypeScriptToCompile(
      generated,
      `
type Example = components["schemas"]["Example"];
const empty: Example = { $defs: {} };
const populated: Example = { "renamed-value": new Date(), $defs: { "renamed-value": null } };
// @ts-expect-error the renamed property is readonly
populated["renamed-value"] = null;
// @ts-expect-error the renamed definition is readonly
populated.$defs["renamed-value"] = null;
// @ts-expect-error the old name has been replaced
populated.original;
// @ts-expect-error the old definition name has been replaced
populated.$defs.original;
// @ts-expect-error the customized property type rejects strings
const invalid: Example = { "renamed-value": "text", $defs: {} };
`,
    );
  });
});
