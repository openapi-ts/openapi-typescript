import { expect, type Page, test } from "@playwright/test";

// note: these tests load Chrome, Firefox, and Safari in Playwright to test a browser-realistic runtime.
// the frontend is prepared via Vite to create a production-accurate app (and throw add’l type errors)
// the backend is mocked here, in Playwright

test("basic", async ({ page }) => {
  // mock API
  await mockAPI(page);

  // throw on any error
  page.on("pageerror", (error) => {
    throw error;
  });

  // load page
  await page.goto("/");

  // wait for element
  await page.waitForSelector('[data-status="success"]');
});

/** Mock API */
async function mockAPI(page: Page) {
  await Promise.all([
    // GET /api/v1/get
    page.route("/api/v1/get", (route) => route.fulfill({ status: 200, body: JSON.stringify({ message: "success" }) })),
    // POST /api/v1/post
    page.route("/api/v1/post", (route) => route.fulfill({ status: 200, body: JSON.stringify({ message: "success" }) })),
    // POST /api/v1/multi-form
    page.route("/api/v1/multi-form", (route) =>
      route.fulfill({ status: 200, body: JSON.stringify({ message: "success" }) }),
    ),
  ]);
}
