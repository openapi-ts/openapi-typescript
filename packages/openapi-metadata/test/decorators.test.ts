import "reflect-metadata";
import {
  ApiBasicAuth,
  ApiBearerAuth,
  ApiBody,
  ApiCookie,
  ApiCookieAuth,
  ApiExcludeController,
  ApiExcludeOperation,
  ApiExtraModels,
  ApiHeader,
  ApiOauth2,
  ApiOperation,
  ApiParam,
  ApiProperty,
  ApiQuery,
  ApiResponse,
  ApiSecurity,
  ApiTags,
} from "../src/decorators/index.js";
import {
  ExcludeMetadataStorage,
  ExtraModelsMetadataStorage,
  OperationBodyMetadataStorage,
  OperationMetadataStorage,
  type OperationParameterMetadata,
  OperationParameterMetadataStorage,
  OperationResponseMetadataStorage,
  OperationSecurityMetadataStorage,
  PropertyMetadataStorage,
} from "../src/metadata/index.js";

test("@ApiOperation", () => {
  const parameters: OperationParameterMetadata[] = [
    {
      in: "path",
      name: "id",
    },
  ] as const;

  class MyController {
    @ApiOperation({
      summary: "Hello",
      path: "/test",
      methods: ["get"],
      parameters,
    })
    operation() {}
  }

  const operationMetadata = OperationMetadataStorage.getMetadata(MyController.prototype, "operation");
  const parameterMetadata = OperationParameterMetadataStorage.getMetadata(MyController.prototype, "operation");
  expect(operationMetadata).toEqual({
    summary: "Hello",
    path: "/test",
    methods: ["get"],
    parameters,
  });
  expect(parameterMetadata).toEqual(parameters);
});

test("@ApiBody", () => {
  class MyController {
    @ApiBody({ type: "string" })
    operation() {}
  }

  const metadata = OperationBodyMetadataStorage.getMetadata(MyController.prototype, "operation");

  expect(metadata).toEqual({
    type: "string",
    mediaType: "application/json",
  });
});

test("@ApiParam", () => {
  @ApiParam({ name: "test" })
  class MyController {
    @ApiParam({ name: "hello" })
    operation() {}
  }

  const metadata = OperationParameterMetadataStorage.getMetadata(MyController.prototype, "operation", true);

  expect(metadata).toEqual([
    { in: "path", name: "test" },
    { in: "path", name: "hello" },
  ]);
});

test("@ApiHeader", () => {
  @ApiHeader({ name: "test" })
  class MyController {
    @ApiHeader({ name: "hello" })
    operation() {}
  }

  const metadata = OperationParameterMetadataStorage.getMetadata(MyController.prototype, "operation", true);

  expect(metadata).toEqual([
    { in: "header", name: "test" },
    { in: "header", name: "hello" },
  ]);
});

test("@ApiCookie", () => {
  @ApiCookie({ name: "test" })
  class MyController {
    @ApiCookie({ name: "hello" })
    operation() {}
  }

  const metadata = OperationParameterMetadataStorage.getMetadata(MyController.prototype, "operation", true);

  expect(metadata).toEqual([
    { in: "cookie", name: "test" },
    { in: "cookie", name: "hello" },
  ]);
});

test("@ApiQuery", () => {
  @ApiQuery({ name: "test" })
  class MyController {
    @ApiQuery({ name: "hello" })
    operation() {}
  }

  const metadata = OperationParameterMetadataStorage.getMetadata(MyController.prototype, "operation", true);

  expect(metadata).toEqual([
    { in: "query", name: "test" },
    { in: "query", name: "hello" },
  ]);
});

test("@ApiResponse", () => {
  @ApiResponse({ type: "string", mediaType: "text/html" })
  class MyController {
    @ApiResponse({ status: 404, type: "number" })
    operation() {}
  }

  const metadata = OperationResponseMetadataStorage.getMetadata(MyController.prototype, "operation", true);

  expect(metadata).toEqual({
    default: { status: "default", mediaType: "text/html", type: "string" },
    "404": { status: 404, mediaType: "application/json", type: "number" },
  });
});

test("@ApiTags", () => {
  @ApiTags("Root")
  class MyController {
    @ApiTags("Hello", "World")
    @ApiTags("Foo", "Bar")
    operation() {}
  }

  const metadata = OperationMetadataStorage.getMetadata(MyController.prototype, "operation", true);

  expect(metadata.tags).toEqual(["Root", "Foo", "Bar", "Hello", "World"]);
});

test("@ApiSecurity", () => {
  @ApiBasicAuth()
  @ApiCookieAuth()
  class MyController {
    @ApiSecurity("custom")
    @ApiBearerAuth()
    @ApiOauth2("pets:write")
    operation() {}
  }

  const metadata = OperationSecurityMetadataStorage.getMetadata(MyController.prototype, "operation", true);

  expect(metadata).toEqual({
    custom: [],
    cookie: [],
    basic: [],
    bearer: [],
    oauth2: ["pets:write"],
  });
});

test("@ApiExcludeController", () => {
  @ApiExcludeController()
  class MyController {}

  const metadata = ExcludeMetadataStorage.getMetadata(MyController);
  expect(metadata).toBe(true);
});

test("@ApiExcludeOperation", () => {
  class MyController {
    @ApiExcludeOperation()
    operation() {}
  }

  const metadata = ExcludeMetadataStorage.getMetadata(MyController.prototype, "operation");
  expect(metadata).toBe(true);
});

test("@ApiExtraModels", () => {
  @ApiExtraModels("string")
  class MyController {
    operation() {}
  }

  const metadata = ExtraModelsMetadataStorage.getMetadata(MyController);

  expect(metadata).toEqual(["string"]);
});

test("@ApiProperty", () => {
  class User {
    @ApiProperty()
    declare declared: string;

    @ApiProperty()
    // biome-ignore lint/style/noInferrableTypes: required for metadata
    defined: number = 4;

    @ApiProperty({ type: "string" })
    explicitType = "test";

    @ApiProperty({ example: "hey" })
    get getter(): string {
      return "hello";
    }

    @ApiProperty()
    func(): boolean {
      return false;
    }
  }

  const metadata = PropertyMetadataStorage.getMetadata(User.prototype);

  expect(metadata.declared).toMatchObject({
    name: "declared",
    required: true,
  });
  // @ts-expect-error
  expect(metadata.declared?.type()).toEqual(String);

  expect(metadata.defined).toMatchObject({
    name: "defined",
    required: true,
  });
  // @ts-expect-error
  expect(metadata.defined?.type()).toEqual(Number);

  expect(metadata.explicitType).toMatchObject({
    name: "explicitType",
    required: true,
    type: "string",
  });

  expect(metadata.getter).toMatchObject({
    name: "getter",
    required: true,
    example: "hey",
  });
  // @ts-expect-error
  expect(metadata.getter?.type()).toEqual(String);

  expect(metadata.func).toMatchObject({
    name: "func",
    required: true,
  });
  // @ts-expect-error
  expect(metadata.func?.type()).toEqual(Boolean);
});
