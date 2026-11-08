import type { Readable, Writable } from "openapi-typescript-helpers";
import { describe, expectTypeOf, test } from "vitest";

describe("Readable/Writable preserve tuples", () => {
  test("Readable keeps tuple and readonly array shapes", () => {
    type Pair = { value: [string, string]; ro: readonly number[]; list: string[] };
    expectTypeOf<Readable<Pair>["value"]>().toEqualTypeOf<[string, string]>();
    expectTypeOf<Readable<Pair>["ro"]>().toEqualTypeOf<readonly number[]>();
    expectTypeOf<Readable<Pair>["list"]>().toEqualTypeOf<string[]>();
  });

  test("Writable keeps tuple and readonly array shapes", () => {
    type Pair = { value: [string, string]; ro: readonly number[]; list: string[] };
    expectTypeOf<Writable<Pair>["value"]>().toEqualTypeOf<[string, string]>();
    expectTypeOf<Writable<Pair>["ro"]>().toEqualTypeOf<readonly number[]>();
    expectTypeOf<Writable<Pair>["list"]>().toEqualTypeOf<string[]>();
  });
});
