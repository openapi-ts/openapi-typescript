import { describe, expect, test } from "vitest";
import { createObservedClient } from "../helpers.js";
import type { paths } from "./schemas/post.js";

describe("POST", () => {
  test("sends the correct method", async () => {
    let method = "";
    const client = createObservedClient<paths>({}, async (req) => {
      method = req.method;
      return Response.json({});
    });
    await client.POST("/posts", {
      body: { title: "My Post", body: "Post body", publish_date: new Date("2024-06-06T12:00:00Z").getTime() },
    });
    expect(method).toBe("POST");
  });

  describe("request body", () => {
    test("requires necessary requestBodies", async () => {
      const client = createObservedClient<paths>({});

      // expect error on missing `body`
      // @ts-expect-error
      await client.POST(
        "/posts", // this isn’t the error
        // missing 2nd param is the error
      );

      // expect error on missing fields
      await client.POST("/posts", {
        // @ts-expect-error
        body: {
          title: "Foo",
        },
      });

      // expect present body to be good enough (all fields optional)
      // (no error)
      await client.POST("/posts", {
        body: {
          title: "Foo",
          body: "Bar",
          publish_date: new Date("2023-04-01T12:00:00Z").getTime(),
        },
      });
    });

    test("requestBody (inline)", async () => {
      const client = createObservedClient<paths>({});

      // expect error on wrong body type
      await client.POST("/posts-optional-inline", {
        // @ts-expect-error
        body: { error: true },
      });

      // (no error)
      await client.POST("/posts-optional-inline", {
        body: {
          title: "",
          publish_date: 3,
          body: "",
        },
      });
    });

    test("requestBody with required: false", async () => {
      const client = createObservedClient<paths>({});

      // assert missing `body` doesn’t raise a TS error
      await client.POST("/posts-optional");

      // assert error on type mismatch
      await client.POST("/posts-optional", {
        body: {
          // @ts-expect-error
          error: true,
        },
      });

      // assert error on type mismatch
      await client.POST("/posts-optional", {
        body: {
          // @ts-expect-error
          title: 42,
          body: "",
        },
      });

      // (no error)
      await client.POST("/posts-optional", {
        body: {
          title: "",
          publish_date: 3,
          body: "",
        },
      });
    });
  });

  test("sends correct options, returns success", async () => {
    const mockData = { status: "success" };
    let actualPathname = "";
    const client = createObservedClient<paths>({}, async (rqq) => {
      actualPathname = new URL(rqq.url).pathname;
      return Response.json(mockData, { status: 201 });
    });

    const { data, error, response } = await client.POST("/posts", {
      body: {
        title: "New Post",
        body: "<p>Best post yet</p>",
        publish_date: new Date("2023-03-31T12:00:00Z").getTime(),
      },
    });

    // assert correct URL was called
    expect(actualPathname).toBe("/posts");

    // assert correct data was returned
    expect(data).toEqual(mockData);
    expect(response.status).toBe(201);

    // assert error is empty
    expect(error).toBeUndefined();
  });

  describe("multipart/form-data", () => {
    test("simple", async () => {
      let actualRequest = new Request("https://fakeurl.example");
      const client = createObservedClient<paths>({}, async (req) => {
        actualRequest = req.clone();
        return Response.json({});
      });
      const reqBody = {
        title: "My Post",
        body: "Post body",
        publish_date: new Date("2024-06-06T12:00:00Z").getTime(),
      };
      await client.POST("/posts", {
        body: reqBody,
        bodySerializer(body) {
          const fd = new FormData();
          for (const name in body) {
            fd.append(name, body[name as keyof typeof body] as string);
          }
          return fd;
        },
      });

      // expect request to contain correct headers and body
      expect(actualRequest.body).toBeInstanceOf(ReadableStream);
      const body = await actualRequest.formData();
      expect(body.get("title")).toBe(reqBody.title);
      expect(actualRequest.headers.get("Content-Type")).toMatch(/multipart\/form-data;/);
    });

    test("file", async () => {
      const TEST_STRING = "Hello this is text file string";

      const file = new Blob([TEST_STRING], { type: "text/plain" });
      const formData = new FormData();
      formData.append("file", file);

      const client = createObservedClient<paths>({}, async (req) => {
        const formData = await req.formData();
        const text = await (formData.get("file") as File).text();
        return Response.json({ text });
      });

      const { data } = await client.POST("/multipart-form-data-file-upload", {
        // TODO: how to get this to accept FormData?
        body: formData as unknown as string,
      });

      expect(data?.text).toBe(TEST_STRING);
    });
  });
});
