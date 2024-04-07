import { test, expectTypeOf } from "vitest";

import createClient from "../src/index.js";
import type { paths } from "./fixtures/api.js";

const { GET } = createClient<paths>();

interface Blogpost {
  title: string;
  body: string;
  publish_date?: number | undefined;
}

test("the error type works properly", async () => {
  const value = await GET("/blogposts");

  if (value.data) {
    expectTypeOf(value.data).toEqualTypeOf<Array<Blogpost>>();
  } else {
    expectTypeOf(value.data).toBeUndefined();
    expectTypeOf(value.error).extract<{ code: number }>().toEqualTypeOf<{ code: number; message: string }>();
    expectTypeOf(value.error).exclude<{ code: number }>().toEqualTypeOf<Record<string, never>>();
  }
});
