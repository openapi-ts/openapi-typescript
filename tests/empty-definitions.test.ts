import openapiTS from "../src/index";

describe("allow empty definitions", () => {
  it("allow empty definitions", async () => {
    const schema = {
      swagger: "2.0",
      paths: {
        "/pet": {
          post: {
            description: "",
            operationId: "addPet",
            parameters: [
              {
                in: "body",
                name: "body",
                description: "Pet object that needs to be added to the store",
                required: true,
                schema: {
                  $ref: 'definitions["Pet"]',
                },
              },
            ],
            responses: {
              405: {
                description: "Invalid input",
              },
            },
          },
        },
      },
    };

    // We are using snapshots to enforce consistency in string output and indentation
    expect(await openapiTS(schema as any, { version: 2 })).toMatchSnapshot();
    expect(await openapiTS(schema as any, { immutableTypes: true, version: 2 })).toMatchSnapshot();
  });
});
