/**
 * Type-level tests for Readable<T> / Writable<T> built-in object passthrough.
 *
 * These are pure compile-time assertions checked by `tsc --noEmit`. If any
 * assertion is wrong, the file fails to type-check.
 */

import type { $Read, $Write, Readable, Writable } from "../src/index.js";

// Bidirectional structural assignability. Looser than the parametric `(<T>() => …)`
// trick but enough for "the resulting shape preserves X" — mapped-type-produced
// objects are structurally identical to their literal twins but fail strict
// parametric equality.
type Equals<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false;
type Expect<T extends true> = T;

// --- Date passthrough ---

type _ReadableDate = Expect<Equals<Readable<Date>, Date>>;
type _WritableDate = Expect<Equals<Writable<Date>, Date>>;

// $Read<Date> unwraps to Date, not to a structurally-mapped Date prototype
type _ReadableReadDate = Expect<Equals<Readable<$Read<Date>>, Date>>;
type _WritableWriteDate = Expect<Equals<Writable<$Write<Date>>, Date>>;

// Date inside an object field stays Date
type _ReadableObjectWithDate = Expect<Equals<Readable<{ created: Date }>, { created: Date }>>;
type _WritableObjectWithDate = Expect<Equals<Writable<{ created: Date }>, { created: Date }>>;

// --- RegExp passthrough ---

type _ReadableRegExp = Expect<Equals<Readable<RegExp>, RegExp>>;
type _WritableRegExp = Expect<Equals<Writable<RegExp>, RegExp>>;

type _ReadableObjectWithRegExp = Expect<Equals<Readable<{ pattern: RegExp }>, { pattern: RegExp }>>;

// --- Function passthrough ---

type Fn = (x: number) => string;

type _ReadableFn = Expect<Equals<Readable<Fn>, Fn>>;
type _WritableFn = Expect<Equals<Writable<Fn>, Fn>>;

type _ReadableObjectWithFn = Expect<Equals<Readable<{ handler: Fn }>, { handler: Fn }>>;

// --- Negative control: plain object still gets recursive treatment ---

// Plain nested object's $Write marker is still stripped from Readable
type _ReadableStripsWrite = Expect<
  Equals<
    Readable<{ id: number; password: $Write<string> }>,
    { id: number }
  >
>;

// Plain nested object's $Read marker is still stripped from Writable
type _WritableStripsRead = Expect<
  Equals<
    Writable<{ id: $Read<number>; name: string }>,
    { name: string } & { id?: never }
  >
>;
