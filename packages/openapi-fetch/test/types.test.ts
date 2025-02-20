import { assertType, describe, test } from "vitest";
import type {
  ErrorResponse,
  GetResponseContent,
  OkStatus,
  OpenApiStatusToHttpStatus,
  SuccessResponse,
} from "openapi-typescript-helpers";

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

  describe("OpenApiStatusToHttpStatus", () => {
    test("returns numeric status code", () => {
      assertType<OpenApiStatusToHttpStatus<200, number>>(200);
      assertType<OpenApiStatusToHttpStatus<200, string>>(200);
      assertType<OpenApiStatusToHttpStatus<204, string>>(204);

      assertType<OpenApiStatusToHttpStatus<204, string>>(
        // @ts-expect-error 200 is not a valid
        200,
      );
      assertType<OpenApiStatusToHttpStatus<204, number>>(
        // @ts-expect-error 200 is not a valid
        200,
      );

      assertType<OpenApiStatusToHttpStatus<404, 200 | 204 | 206 | 404 | 500 | "default">>(404);
    });

    test("returns default response", () => {
      type Status = OpenApiStatusToHttpStatus<"default", 200 | 204 | 206 | 404 | 500 | "default">;
      assertType<Status>(
        // @ts-expect-error 200 has been manually defined
        200,
      );
      assertType<Status>(
        // @ts-expect-error 204 has been manually defined
        204,
      );
      assertType<Status>(201);
      assertType<Status>(504);
    });

    test("returns 200 likes response", () => {
      type Status = OpenApiStatusToHttpStatus<"2XX", 200 | 204 | 206 | 404 | 500 | "default">;
      assertType<Status>(200);
      assertType<Status>(201);
      assertType<Status>(202);
      assertType<Status>(203);
      assertType<Status>(204);
      assertType<Status>(
        // @ts-expect-error 205 is not a valid 2XX status code
        205,
      );
      assertType<Status>(206);
      assertType<Status>(207);
      assertType<Status>(
        // @ts-expect-error '2XX' is not a numeric status code
        "2XX",
      );
      assertType<Status>(
        // @ts-expect-error 205 is not a valid 2XX status code
        208,
      );

      assertType<Status>(
        // @ts-expect-error '4XX' is not a numeric status code
        "4XX",
      );
      assertType<Status>(
        // @ts-expect-error '5XX' is not a numeric status code
        "5XX",
      );
    });

    test("returns error responses for 4XX", () => {
      type Status = OpenApiStatusToHttpStatus<"4XX", 200 | 204 | 206 | 404 | 500 | "default">;
      assertType<Status>(400);
      assertType<Status>(401);
      assertType<Status>(402);
      assertType<Status>(403);
      assertType<Status>(404);
      assertType<Status>(405);
      assertType<Status>(406);
      assertType<Status>(407);
      assertType<Status>(408);
      assertType<Status>(409);
      assertType<Status>(410);
      assertType<Status>(411);
      assertType<Status>(412);
      assertType<Status>(413);
      assertType<Status>(414);
      assertType<Status>(415);
      assertType<Status>(416);
      assertType<Status>(417);
      assertType<Status>(418);
      assertType<Status>(500);
      assertType<Status>(501);
      assertType<Status>(502);
      assertType<Status>(503);
      assertType<Status>(504);
      assertType<Status>(505);
      assertType<Status>(506);
      assertType<Status>(507);
      assertType<Status>(508);
      assertType<Status>(
        // @ts-expect-error 509 is not a valid error status code
        509,
      );
      assertType<Status>(510);
      assertType<Status>(511);

      assertType<Status>(
        // @ts-expect-error 200 is not a valid error status code
        200,
      );
      assertType<Status>(
        // @ts-expect-error '2XX' is not a numeric status code
        "2XX",
      );
      assertType<Status>(
        // @ts-expect-error '4XX' is not a numeric status code
        "4XX",
      );
      assertType<Status>(
        // @ts-expect-error '5XX' is not a numeric status code
        "5XX",
      );
    });

    test("returns error responses for 5XX", () => {
      type Status = OpenApiStatusToHttpStatus<"5XX", 200 | 204 | 206 | 404 | 500 | "default">;
      assertType<Status>(400);
      assertType<Status>(401);
      assertType<Status>(402);
      assertType<Status>(403);
      assertType<Status>(404);
      assertType<Status>(405);
      assertType<Status>(406);
      assertType<Status>(407);
      assertType<Status>(408);
      assertType<Status>(409);
      assertType<Status>(410);
      assertType<Status>(411);
      assertType<Status>(412);
      assertType<Status>(413);
      assertType<Status>(414);
      assertType<Status>(415);
      assertType<Status>(416);
      assertType<Status>(417);
      assertType<Status>(418);
      assertType<Status>(500);
      assertType<Status>(501);
      assertType<Status>(502);
      assertType<Status>(503);
      assertType<Status>(504);
      assertType<Status>(505);
      assertType<Status>(506);
      assertType<Status>(507);
      assertType<Status>(508);
      assertType<Status>(
        // @ts-expect-error 509 is not a valid error status code
        509,
      );
      assertType<Status>(510);
      assertType<Status>(511);

      assertType<Status>(
        // @ts-expect-error 200 is not a valid error status code
        200,
      );
      assertType<Status>(
        // @ts-expect-error '2XX' is not a numeric status code
        "2XX",
      );
      assertType<Status>(
        // @ts-expect-error '4XX' is not a numeric status code
        "4XX",
      );
      assertType<Status>(
        // @ts-expect-error '5XX' is not a numeric status code
        "5XX",
      );
    });
  });
});
