import { assertType, describe, test } from "vitest";
import type { ErrorResponse, GetResponseContent, OkStatus, SuccessResponse } from "openapi-typescript-helpers";

describe("types", () => {
  describe("GetResponseContent", () => {
    describe("MixedResponses", () => {
      interface MixedResponses {
        200: {
          content: {
            "application/json": { data: `200 application/json` };
            "text/plain": `200 text/plain`;
          };
        };
        204: { content: never };
        206: { content: { "text/plain": `206 text/plain` } };
        404: { content: { "text/plain": `404 text/plain` } };
        500: { content: { "application/json": { error: `500 application/json` } } };
      }

      test("returns all possible responses", () => {
        type Response = GetResponseContent<MixedResponses>;
        assertType<Response>({ data: "200 application/json" });
        assertType<Response>({
          // @ts-expect-error It picks literal over string
          data: "200 but different string",
        });
        assertType<Response>("200 text/plain");
        assertType<Response>("206 text/plain");
        assertType<Response>("404 text/plain");
        assertType<Response>({ error: "500 application/json" });
        assertType<Response>(
          // @ts-expect-error 204 never does not become undefined
          undefined,
        );
      });

      test("returns correct type for 200 with literal", () => {
        type Response = GetResponseContent<MixedResponses, `${string}/${string}`, 200>;
        assertType<Response>({ data: "200 application/json" });
        assertType<Response>("200 text/plain");
        assertType<Response>(
          // @ts-expect-error
          "206 text/plain",
        );
        assertType<Response>(
          // @ts-expect-error
          "404 text/plain",
        );
        assertType<Response>({
          // @ts-expect-error
          error: "500 application/json",
        });
      });

      test("returns correct type for 200 with json-like literal", () => {
        type Response = GetResponseContent<MixedResponses, `${string}/json`, 200>;
        assertType<Response>({ data: "200 application/json" });
        assertType<Response>(
          // @ts-expect-error
          "200 text/plain",
        );
        assertType<Response>(
          // @ts-expect-error
          "206 text/plain",
        );
        assertType<Response>(
          // @ts-expect-error
          "404 text/plain",
        );
        assertType<Response>({
          // @ts-expect-error
          error: "500 application/json",
        });
      });

      test("returns correct type for 200 with application/json", () => {
        type Response = GetResponseContent<MixedResponses, "application/json", 200>;
        assertType<Response>({ data: "200 application/json" });
        assertType<Response>(
          // @ts-expect-error
          "200 text/plain",
        );
        assertType<Response>(
          // @ts-expect-error
          "206 text/plain",
        );
        assertType<Response>(
          // @ts-expect-error
          "404 text/plain",
        );
        assertType<Response>({
          // @ts-expect-error
          error: "500 application/json",
        });
      });

      test("returns 200 & 500 responses", () => {
        type Response = GetResponseContent<MixedResponses, `${string}/${string}`, 200 | 500>;
        assertType<Response>({ data: "200 application/json" });
        assertType<Response>("200 text/plain");
        assertType<Response>(
          // @ts-expect-error
          "206 text/plain",
        );
        assertType<Response>(
          // @ts-expect-error
          "404 text/plain",
        );
        assertType<Response>({ error: "500 application/json" });
      });

      test("returns all OK responses", () => {
        type Response = GetResponseContent<
          MixedResponses,
          `${string}/${string}`,
          // @ts-expect-error: Type 'OkStatus' does not satisfy the constraint 'keyof MixedResponses'. Can safely ignore this error.
          OkStatus
        >;
        assertType<Response>({ data: "200 application/json" });
        assertType<Response>("200 text/plain");
        assertType<Response>("206 text/plain");
        assertType<Response>(
          // @ts-expect-error
          "404 text/plain",
        );
        assertType<Response>({
          // @ts-expect-error
          error: "500 application/json",
        });
      });

      test("non existent media type", () => {
        type Response = GetResponseContent<MixedResponses, "I/DO NOT EXIST">;
        assertType<Response>({
          // @ts-expect-error
          data: "200 application/json",
        });
        assertType<Response>({
          // @ts-expect-error
          data: "200 but different string",
        });
        assertType<Response>(
          // @ts-expect-error
          "200 text/plain",
        );
        assertType<Response>(
          // @ts-expect-error
          "206 text/plain",
        );
        assertType<Response>(
          // @ts-expect-error
          "404 text/plain",
        );

        assertType<Response>({
          // @ts-expect-error
          error: "500 application/json",
        });
        assertType<Response>(
          // @ts-expect-error 204 never does not become undefined
          undefined,
        );
      });
    });

    test("picks undefined over never", () => {
      interface Responses {
        200: { content: { "application/json": { data: `Yup` } } };
        204: { content?: never };
      }

      type Response = GetResponseContent<Responses>;
      assertType<Response>({ data: "Yup" });
      assertType<Response>(undefined);
    });
  });

  describe("SuccessResponse", () => {
    interface Responses {
      200: {
        content: {
          "application/json": { data: `200 application/json` };
          "text/plain": `200 text/plain`;
        };
      };
      204: { content: never };
      206: { content: { "text/plain": `206 text/plain` } };
      404: { content: { "text/plain": `404 text/plain` } };
      500: { content: { "application/json": { error: `500 application/json` } } };
    }

    test("returns all 2XX responses", () => {
      type Response = SuccessResponse<Responses>;
      assertType<Response>({ data: "200 application/json" });
      assertType<Response>("200 text/plain");
      assertType<Response>("206 text/plain");
      assertType<Response>(
        // @ts-expect-error
        "404 text/plain",
      );
      assertType<Response>({
        // @ts-expect-error
        error: "500 application/json",
      });
    });

    test("returns all 2XX responses, only application/json", () => {
      type Response = SuccessResponse<Responses, "application/json">;
      assertType<Response>({ data: "200 application/json" });
      assertType<Response>(
        // @ts-expect-error
        "200 text/plain",
      );
      assertType<Response>(
        // @ts-expect-error
        "206 text/plain",
      );
      assertType<Response>(
        // @ts-expect-error
        "404 text/plain",
      );
      // @ts-expect-error
      assertType<Response>({ error: "500 application/json" });
    });
  });

  describe("ErrorResponse", () => {
    interface Responses {
      200: {
        content: {
          "application/json": { data: `200 application/json` };
          "text/plain": `200 text/plain`;
        };
      };
      204: { content: never };
      206: { content: { "text/plain": `206 text/plain` } };
      404: { content: { "text/plain": `404 text/plain` } };
      500: { content: { "application/json": { error: `500 application/json` } } };
      default: { content: { "application/json": { error: `default application/json` } } };
    }

    test("returns all 5XX and 4xx responses", () => {
      type Response = ErrorResponse<Responses>;
      assertType<Response>({
        // @ts-expect-error
        data: "200 application/json",
      });
      assertType<Response>(
        // @ts-expect-error
        "200 text/plain",
      );
      assertType<Response>(
        // @ts-expect-error
        "206 text/plain",
      );
      assertType<Response>("404 text/plain");
      assertType<Response>({ error: "500 application/json" });
      assertType<Response>({ error: "default application/json" });
    });

    test("returns all 5XX and 4xx responses, only application/json", () => {
      type Response = ErrorResponse<Responses, "application/json">;
      assertType<Response>({
        // @ts-expect-error
        data: "200 application/json",
      });
      assertType<Response>(
        // @ts-expect-error
        "200 text/plain",
      );
      assertType<Response>(
        // @ts-expect-error
        "206 text/plain",
      );
      assertType<Response>(
        // @ts-expect-error
        "404 text/plain",
      );
      assertType<Response>({ error: "500 application/json" });
      assertType<Response>({ error: "default application/json" });
    });
  });
});
