import type { $Read, $Write, Readable, Writable } from "../src/index.js";

type Equal<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false;
type ExactEqual<A, B> = (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;
type Expect<T extends true> = T;

// Generic clients can use `any`; resolving it must terminate without widening `unknown`.
export type ReadableAny = Expect<ExactEqual<Readable<any>, any>>;
export type WritableAny = Expect<ExactEqual<Writable<any>, any>>;
export type ReadableUnknown = Expect<ExactEqual<Readable<unknown>, unknown>>;
export type WritableUnknown = Expect<ExactEqual<Writable<unknown>, unknown>>;

export function readableGeneric<T extends readonly $Read<string>[]>(value: Readable<T>) {
  const first: string = value[0];
  // @ts-expect-error constrained generics resolve markers without widening to any
  const _invalid: number = value[0];
  return first;
}
export function writableGeneric<T extends readonly $Write<string>[]>(value: Writable<T>) {
  const first: string = value[0];
  // @ts-expect-error constrained generics resolve markers without widening to any
  const _invalid: number = value[0];
  return first;
}
export function readableGenericObject<T extends { name: $Read<string> }>(value: Readable<T>) {
  const name: string = value.name;
  // @ts-expect-error object constraints resolve markers without widening to any
  const _invalid: number = value.name;
  return name;
}
export function writableGenericObject<T extends { name: $Write<string> }>(value: Writable<T>) {
  const name: string = value.name;
  // @ts-expect-error object constraints resolve markers without widening to any
  const _invalid: number = value.name;
  return name;
}

type JsonValue = null | string | number | boolean | JsonValue[] | { [key: string]: JsonValue };
type NestedArray = (string | NestedArray)[];
export const readableJson: Readable<JsonValue> = ["one", { two: [2] }];
export const writableJson: Writable<JsonValue> = ["one", { two: [2] }];
export const readableNestedArray: Readable<NestedArray> = ["one", ["two"]];
export const writableNestedArray: Writable<NestedArray> = ["one", ["two"]];

type RecursiveTuple = [string | RecursiveTuple];
type RecursiveOptionalTuple = [string, RecursiveOptionalTuple?];
type RecursiveRestTuple = [string, ...RecursiveRestTuple[]];
type RecursiveReadonlyTuple = readonly [string | RecursiveReadonlyTuple];
type RecursiveReadonlyOptionalTuple = readonly [string, RecursiveReadonlyOptionalTuple?];
type RecursiveReadonlyRestTuple = readonly [string, ...RecursiveReadonlyRestTuple[]];
export const readableRecursiveTuple: Readable<RecursiveTuple> = [[["leaf"]]];
export const writableRecursiveTuple: Writable<RecursiveTuple> = [[["leaf"]]];
export const readableRecursiveOptional: Readable<RecursiveOptionalTuple> = ["a", ["b"]];
export const writableRecursiveOptional: Writable<RecursiveOptionalTuple> = ["a", ["b"]];
export const readableRecursiveRest: Readable<RecursiveRestTuple> = ["a", ["b"]];
export const writableRecursiveRest: Writable<RecursiveRestTuple> = ["a", ["b"]];
export const readableRecursiveReadonlyTuple: Readable<RecursiveReadonlyTuple> = [[["leaf"]]];
export const writableRecursiveReadonlyTuple: Writable<RecursiveReadonlyTuple> = [[["leaf"]]];
export const readableRecursiveReadonlyOptional: Readable<RecursiveReadonlyOptionalTuple> = ["a", ["b"]];
export const writableRecursiveReadonlyOptional: Writable<RecursiveReadonlyOptionalTuple> = ["a", ["b"]];
export const readableRecursiveReadonlyRest: Readable<RecursiveReadonlyRestTuple> = ["a", ["b"]];
export const writableRecursiveReadonlyRest: Writable<RecursiveReadonlyRestTuple> = ["a", ["b"]];
// @ts-expect-error recursive mutable tuples still reject invalid leaves
export const invalidReadableRecursiveTuple: Readable<RecursiveTuple> = [[123]];
// @ts-expect-error recursive readonly tuples still reject invalid leaves
export const invalidWritableRecursiveTuple: Writable<RecursiveReadonlyTuple> = [[true]];

type FunctionType = (value: number) => string;
type GenericFunction = <T>(value: T) => T;
interface OverloadedFunction {
  (value: number): number;
  (value: string): string;
}
interface MarkedFunction {
  (value: $Write<{ id: $Read<number> }>): $Read<{ secret: $Write<string> }>;
  readonly visible: $Read<string>;
  secret?: $Write<string>;
}

type VisibilityRecord = { readonly id: $Read<number>; value: string; secret?: $Write<string> };
type ReadableRecord = { readonly id: number; value: string };
type WritableRecord = { value: string; secret?: string } & { readonly id?: never };
interface ArrayInterface extends Array<VisibilityRecord> {}
interface ReadonlyArrayInterface extends ReadonlyArray<VisibilityRecord> {}
type AugmentedArray = VisibilityRecord[] & { readonly brand?: string };
type AugmentedReadonlyArray = readonly VisibilityRecord[] & { readonly brand?: string };
type MarkedReadonlyArray = readonly VisibilityRecord[] & { id: $Read<number>; secret: $Write<string> };
type ReadableNonEmptyArray = readonly $Read<string>[] & { readonly 0: $Read<"first"> };
type WritableNonEmptyArray = readonly $Write<string>[] & { readonly 0: $Write<"first"> };
export type ReadableNumericProperty = Expect<ExactEqual<Readable<ReadableNonEmptyArray>[0], "first">>;
export type WritableNumericProperty = Expect<ExactEqual<Writable<WritableNonEmptyArray>[0], "first">>;
export const readableNonEmptyArray: Readable<ReadableNonEmptyArray> = ["first"];
export const writableNonEmptyArray: Writable<WritableNonEmptyArray> = ["first"];
// @ts-expect-error required numeric properties must not disappear with the broad array index
export const readableEmptyArray: Readable<ReadableNonEmptyArray> = [];
// @ts-expect-error required numeric properties must not disappear with the broad array index
export const writableEmptyArray: Writable<WritableNonEmptyArray> = [];
// @ts-expect-error narrowed numeric properties must retain their value constraints
export const readableWrongFirst: Readable<ReadableNonEmptyArray> = ["other"];
// @ts-expect-error narrowed numeric properties must retain their value constraints
export const writableWrongFirst: Writable<WritableNonEmptyArray> = ["other"];

export type ReadableDate = Expect<Equal<Readable<Date>, Date>>;
export type WritableDate = Expect<Equal<Writable<Date>, Date>>;
export type ReadableRegExp = Expect<Equal<Readable<RegExp>, RegExp>>;
export type WritableRegExp = Expect<Equal<Writable<RegExp>, RegExp>>;

// Exact comparisons reject both `any` and a widened `(...args: any[]) => any` signature.
export type ReadableFunction = Expect<ExactEqual<Readable<FunctionType>, FunctionType>>;
export type WritableFunction = Expect<ExactEqual<Writable<FunctionType>, FunctionType>>;
export type ReadableGenericFunction = Expect<ExactEqual<Readable<GenericFunction>, GenericFunction>>;
export type WritableGenericFunction = Expect<ExactEqual<Writable<GenericFunction>, GenericFunction>>;
export type ReadableOverloadedFunction = Expect<ExactEqual<Readable<OverloadedFunction>, OverloadedFunction>>;
export type WritableOverloadedFunction = Expect<ExactEqual<Writable<OverloadedFunction>, OverloadedFunction>>;

// Callables are opaque: markers in arguments, return types, and attached properties stay intact.
export type ReadableMarkedFunction = Expect<ExactEqual<Readable<MarkedFunction>, MarkedFunction>>;
export type WritableMarkedFunction = Expect<ExactEqual<Writable<MarkedFunction>, MarkedFunction>>;
export type ReadableWrappedFunction = Expect<ExactEqual<Readable<$Read<MarkedFunction>>, MarkedFunction>>;
export type WritableWrappedFunction = Expect<ExactEqual<Writable<$Write<MarkedFunction>>, MarkedFunction>>;

export type ReadableMutableArray = Expect<Equal<Readable<VisibilityRecord[]>, ReadableRecord[]>>;
export type WritableMutableArray = Expect<Equal<Writable<VisibilityRecord[]>, WritableRecord[]>>;
export type ReadableReadonlyArray = Expect<Equal<Readable<readonly VisibilityRecord[]>, readonly ReadableRecord[]>>;
export type WritableReadonlyArray = Expect<Equal<Writable<readonly VisibilityRecord[]>, readonly WritableRecord[]>>;

// Array subtypes must resolve method and iterator elements as well as numeric indices.
export type ReadableArrayInterface = Expect<Equal<Readable<ArrayInterface>, ReadableRecord[]>>;
export type WritableArrayInterface = Expect<Equal<Writable<ArrayInterface>, WritableRecord[]>>;
export type ReadableReadonlyArrayInterface = Expect<Equal<Readable<ReadonlyArrayInterface>, readonly ReadableRecord[]>>;
export type WritableReadonlyArrayInterface = Expect<Equal<Writable<ReadonlyArrayInterface>, readonly WritableRecord[]>>;
export type ReadableAugmentedArray = Expect<Equal<Readable<AugmentedArray>, ReadableRecord[]>>;
export type WritableAugmentedArray = Expect<Equal<Writable<AugmentedArray>, WritableRecord[]>>;
export type ReadableAugmentedReadonlyArray = Expect<Equal<Readable<AugmentedReadonlyArray>, readonly ReadableRecord[]>>;
export type WritableAugmentedReadonlyArray = Expect<Equal<Writable<AugmentedReadonlyArray>, readonly WritableRecord[]>>;
export type ReadableArrayMetadata = Expect<Equal<Readable<MarkedReadonlyArray>["id"], number>>;
export type WritableArrayMetadata = Expect<Equal<Writable<MarkedReadonlyArray>["secret"], string>>;
export type ReadableExcludedArrayMetadata = Expect<
  Equal<"secret" extends keyof Readable<MarkedReadonlyArray> ? true : false, false>
>;
export type WritableExcludedArrayMetadata = Expect<Equal<Writable<MarkedReadonlyArray>["id"], undefined>>;

declare const writableArrayInterface: Writable<ArrayInterface>;
declare const writableAugmentedArray: Writable<AugmentedArray>;
writableArrayInterface.push({ secret: "secret", value: "value" });
writableAugmentedArray.push({ secret: "secret", value: "value" });
// @ts-expect-error array subtype methods must reject read-only properties
writableArrayInterface.push({ id: 1, secret: "secret", value: "value" });
// @ts-expect-error augmented array methods must reject read-only properties
writableAugmentedArray.push({ id: 1, secret: "secret", value: "value" });

// Retain the existing mutable-tuple projection instead of introducing eager tuple reconstruction.
export type ReadableMutableTuple = Expect<Equal<Readable<[$Read<string>, $Read<number>]>, (string | number)[]>>;
export type WritableMutableTuple = Expect<Equal<Writable<[$Write<string>, $Write<number>]>, (string | number)[]>>;
export type ReadableReadonlyTuple = Expect<
  Equal<Readable<readonly [$Read<string>, $Read<number>]>, readonly [string, number]>
>;
export type WritableReadonlyTuple = Expect<
  Equal<Writable<readonly [$Write<string>, $Write<number>]>, readonly [string, number]>
>;
export type ReadableOptionalTuple = Expect<
  Equal<Readable<[first: $Read<string>, second?: $Read<number>]>, (string | number | undefined)[]>
>;
export type WritableOptionalTuple = Expect<
  Equal<Writable<[first: $Write<string>, second?: $Write<number>]>, (string | number | undefined)[]>
>;
export type ReadableReadonlyRestTuple = Expect<
  Equal<Readable<readonly [first?: $Read<string>, ...rest: $Read<number>[]]>["0"], string | undefined>
>;
export type WritableReadonlyRestTuple = Expect<
  Equal<Writable<readonly [first?: $Write<string>, ...rest: $Write<number>[]]>["0"], string | undefined>
>;

// Array iteration excludes marked elements; fixed writable slots retain the existing optional-never rule.
export type ReadableTupleVisibility = Expect<
  Equal<Readable<readonly [VisibilityRecord, $Write<string>]>[number], ReadableRecord>
>;
export type WritableTupleVisibility = Expect<
  Equal<Writable<readonly [VisibilityRecord, $Read<string>]>["1"], undefined>
>;
// @ts-expect-error excluded elements are never, consistently with mutable arrays
export const excludedReadonlyElement: Writable<readonly [$Read<string>]> = [undefined];

// Array methods and iterators must expose resolved elements, just like numeric indexing.
export type ReadableArrayMapValue = Expect<
  Equal<Parameters<Parameters<Readable<readonly VisibilityRecord[]>["map"]>[0]>[0], ReadableRecord>
>;
export type WritableArrayMapValue = Expect<
  Equal<Parameters<Parameters<Writable<readonly VisibilityRecord[]>["map"]>[0]>[0], WritableRecord>
>;
export type ReadableArrayIteratorValue = Expect<
  Equal<
    ReturnType<Readable<readonly VisibilityRecord[]>[typeof Symbol.iterator]> extends Iterator<infer V> ? V : never,
    ReadableRecord
  >
>;
export type WritableArrayIteratorValue = Expect<
  Equal<
    ReturnType<Writable<readonly VisibilityRecord[]>[typeof Symbol.iterator]> extends Iterator<infer V> ? V : never,
    WritableRecord
  >
>;

export type ReadableNestedMarkers = Expect<
  Equal<
    Readable<{
      response: $Read<{ value: string; secret: $Write<string> }>;
      request: $Write<{ value: string }>;
    }>,
    { response: { value: string } }
  >
>;

export type WritableNestedMarkers = Expect<
  Equal<
    Writable<{
      response: $Read<{ value: string }>;
      request: $Write<{ id: $Read<number>; value: string }>;
    }>,
    { request: { value: string } & { id?: never } } & { response?: never }
  >
>;

export type ReadableAugmentedDate = Expect<
  Equal<Readable<Date & { visible: $Read<string>; secret: $Write<string> }>, Date & { visible: string }>
>;

export type WritableAugmentedDate = Expect<
  Equal<Writable<Date & { id: $Read<number>; secret: $Write<string> }>, Date & { secret: string } & { id?: never }>
>;
