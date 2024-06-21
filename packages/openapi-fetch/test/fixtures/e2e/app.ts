import createClient from "../../../src";
import type { paths } from "./e2e.d.ts";

const client = createClient<paths>({
  baseUrl: "/api/v1",
});

/**
 * Test 1: GET /api/v1/get
 */
async function testGet() {
  const { data } = await client.GET("/get");
  if (!data) {
    throw new Error("/get: No data");
  }
}

/**
 * Test 2: POST /api/v1/post
 */
async function testPost() {
  const { data } = await client.POST("/post", { body: { message: "POST" } });
  if (!data) {
    throw new Error("/post: No data");
  }
}

/**
 * Test 3: PUT /api/v1/multi-form
 */
async function testMultiForm() {
  const { data } = await client.POST("/multi-form", {
    body: {
      message: "Form",
      file: new File(["Hello, World!"], "hello.txt") as unknown as string,
    },
  });
  if (!data) {
    throw new Error("/multi-form: No data");
  }
}

// run all tests immediately on load
(async () => {
  await Promise.all([testGet(), testPost(), testMultiForm()]);

  // add element Playwright is waiting for
  const div = document.createElement("div");
  div.setAttribute("data-status", "success");
  div.innerHTML = "Success";
  document.body.appendChild(div);
})();
