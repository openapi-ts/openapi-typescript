import type { Readable, Writable } from "openapi-typescript-helpers";
import { expectTypeOf, test } from "vitest";

type Schema = { pair: [string, string]; ro: readonly number[]; list: string[] };

test("Readable keeps tuples and readonly arrays", () => {
  expectTypeOf<Readable<Schema>["pair"]>().toEqualTypeOf<[string, string]>();
  expectTypeOf<Readable<Schema>["ro"]>().toEqualTypeOf<readonly number[]>();
  expectTypeOf<Readable<Schema>["list"]>().toEqualTypeOf<string[]>();
});

test("Writable keeps tuples and readonly arrays", () => {
  expectTypeOf<Writable<Schema>["pair"]>().toEqualTypeOf<[string, string]>();
  expectTypeOf<Writable<Schema>["ro"]>().toEqualTypeOf<readonly number[]>();
  expectTypeOf<Writable<Schema>["list"]>().toEqualTypeOf<string[]>();
});
