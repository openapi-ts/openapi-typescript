import { ApiBody } from "../../../src/decorators/api-body.js";
import { ApiOperation } from "../../../src/decorators/api-operation.js";
import { ApiQuery } from "../../../src/decorators/api-query.js";
import { ApiResponse } from "../../../src/decorators/api-response.js";
import { ApiTags } from "../../../src/decorators/api-tags.js";
import User from "../schemas/user.js";

@ApiTags("Users")
@ApiResponse({
  status: 404,
  description: "Not found",
  type: "object",
})
export default class UsersController {
  @ApiTags("List")
  @ApiOperation({
    summary: "List users",
    methods: ["get"],
    path: "/users",
  })
  @ApiResponse({
    type: [User],
  })
  @ApiQuery({ name: "page" })
  index() {}

  @ApiTags("Show")
  @ApiOperation({
    summary: "Show user",
    methods: ["get"],
    path: "/users/{id}",
  })
  @ApiResponse({
    type: User,
  })
  show() {}

  @ApiTags("Create")
  @ApiOperation({
    summary: "Create user",
    methods: ["post"],
    path: "/users",
  })
  @ApiBody({
    type: User,
  })
  @ApiResponse({
    type: User,
  })
  create() {}
}
