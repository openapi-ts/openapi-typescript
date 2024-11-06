import type { EnumTypeValue } from "../types";

export function getEnumType(values: (string | number)[]): "string" | "number" {
  return values.some((v) => typeof v === "string") ? "string" : "number";
}

export function getEnumValues(enumType: EnumTypeValue) {
  if (Array.isArray(enumType)) {
    return enumType;
  }

  // Enums with numeric values
  //   enum Size {
  //     SMALL = 1,
  //     BIG = 2
  //   }
  // are transpiled to include a reverse mapping
  //   const Size = {
  //     "1": "SMALL",
  //     "2": "BIG",
  //     "SMALL": 1,
  //     "BIG": 2,
  //   }
  const numericValues = Object.values(enumType)
    .filter((value) => typeof value === "number")
    .map((value: any) => value.toString());

  return Object.keys(enumType)
    .filter((key) => !numericValues.includes(key))
    .map((key) => enumType[key as any]) as (string | number)[];
}
