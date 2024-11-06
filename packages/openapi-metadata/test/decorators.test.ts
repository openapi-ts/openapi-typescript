import "reflect-metadata";
import {
  ApiBody,
  ApiCookie,
  ApiExcludeController,
  ApiExcludeOperation,
  ApiExtraModels,
  ApiHeader,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiSecurity,
  ApiTags,
} from "../src/decorators";
import {
  ExcludeMetadataStorage,
  ExtraModelsMetadataStorage,
  OperationBodyMetadataStorage,
  OperationMetadataStorage,
  OperationParameterMetadataStorage,
  OperationResponseMetadataStorage,
  OperationSecurityMetadataStorage,
} from "../src/metadata";
import {
  ApiBasicAuth,
  ApiBearerAuth,
  ApiCookieAuth,
  ApiOauth2,
} from "../src/decorators/api-security";

test("@ApiOperation", () => {
  class MyController {
    @ApiOperation({ summary: "Hello", path: "/test", methods: ["get"] })
    operation() {}
  }

  const metadata = OperationMetadataStorage.getMetadata(
    MyController.prototype,
    "operation",
  );

  expect(metadata).toEqual({
    summary: "Hello",
    path: "/test",
    methods: ["get"],
  });
});

test("@ApiBody", () => {
  class MyController {
    @ApiBody({ type: "string" })
    operation() {}
  }

  const metadata = OperationBodyMetadataStorage.getMetadata(
    MyController.prototype,
    "operation",
  );

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

  const metadata = OperationParameterMetadataStorage.getMetadata(
    MyController.prototype,
    "operation",
    true,
  );

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

  const metadata = OperationParameterMetadataStorage.getMetadata(
    MyController.prototype,
    "operation",
    true,
  );

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

  const metadata = OperationParameterMetadataStorage.getMetadata(
    MyController.prototype,
    "operation",
    true,
  );

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

  const metadata = OperationParameterMetadataStorage.getMetadata(
    MyController.prototype,
    "operation",
    true,
  );

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

  const metadata = OperationResponseMetadataStorage.getMetadata(
    MyController.prototype,
    "operation",
    true,
  );

  expect(metadata).toEqual({
    default: { status: "default", mediaType: "text/html", type: "string" },
    "404": { status: 404, mediaType: "application/json", type: "number" },
  });
});

test("@ApiTags", () => {
  @ApiTags("Root")
  class MyController {
    @ApiTags("Hello", "World")
    operation() {}
  }

  const metadata = OperationMetadataStorage.getMetadata(
    MyController.prototype,
    "operation",
    true,
  );

  expect(metadata.tags).toEqual(["Root", "Hello", "World"]);
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

  const metadata = OperationSecurityMetadataStorage.getMetadata(
    MyController.prototype,
    "operation",
    true,
  );

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

  const metadata = ExcludeMetadataStorage.getMetadata(
    MyController.prototype,
    "operation",
  );
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
