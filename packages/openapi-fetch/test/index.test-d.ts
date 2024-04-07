import { test, expectTypeOf } from "vitest";

import createClient from "../src/index.js";

interface paths {
  "/": {
    get: operations["GetObjects"];
  };
}

interface operations {
  GetObjects: {
    parameters: {};
    responses: {
      200: components["responses"]["MultipleObjectsResponse"];
      401: components["responses"]["Unauthorized"];
      422: components["responses"]["GenericError"];
    };
  };
}

interface components {
  schemas: {
    Object: {
      id: string;
      name: string;
    };
    GenericErrorModel: {
      errors: {
        body: string[];
      };
    };
  };
  responses: {
    MultipleObjectsResponse: {
      content: {
        "application/json": {
          objects: components["schemas"]["Object"][];
        };
      };
    };
    /** @description Unauthorized */
    Unauthorized: {
      content: {};
    };
    /** @description Unexpected error */
    GenericError: {
      content: {
        "application/json": components["schemas"]["GenericErrorModel"];
      };
    };
  };
}

const { GET } = createClient<paths>();

test("the error type works properly", async () => {
  const value = await GET("/");

  if (value.data) {
    expectTypeOf(value.data).toEqualTypeOf({ objects: [{ id: "", name: "" }] });
  } else {
    expectTypeOf(value.data).toBeUndefined();
    expectTypeOf(value.error).toEqualTypeOf({ errors: [""] });
  }
});
