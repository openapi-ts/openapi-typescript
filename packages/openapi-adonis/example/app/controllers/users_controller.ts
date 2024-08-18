import User from "#models/user";
import { listUserValidator } from "#validators/user";
import { apiBody, apiOperation, apiParam, apiQuery, apiResponse } from "openapi-adonis/decorators";
import { VineType, ModelType } from "openapi-adonis";

export default class UsersController {
  @apiOperation({ summary: "Get users" })
  @apiResponse({ type: ModelType(User) })
  @apiParam({ name: "id" })
  @apiQuery({ name: "query" })
  @apiBody({ type: VineType(listUserValidator, "listUserValidator") })
  async index(): Promise<User> {
    return new User();
  }

  @apiOperation({ summary: "Create new user" })
  // @apiBody({ type: User })
  async create(): Promise<User> {
    return new User();
  }
}
