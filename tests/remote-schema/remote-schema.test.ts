import path from "path";
import openapiTS from "../../src/index";

describe("remote $refs", () => {
  it("resolves remote $refs", async () => {
    const types = await openapiTS(path.join(__dirname, "spec", "spec.yml"));

    // We can use a snapshot here to ensure indentation and consistency in the output string. Otherwise, please do NOT use snapshots
    expect(types).toMatchSnapshot();
  });
});
