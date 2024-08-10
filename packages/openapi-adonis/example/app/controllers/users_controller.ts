import User from '#models/user'
import { apiBody, apiOperation, apiResponse, apiParam, apiQuery } from 'openapi-adonis/decorators'

export default class UsersController {
  @apiOperation({ summary: 'Get users', tags: ['User'] })
  @apiResponse({ type: User })
  @apiParam({ name: 'id' })
  @apiQuery({ name: 'query' })
  async index(): Promise<User> {
    return new User()
  }

  @apiOperation({ summary: 'Create new user', tags: ['User'] })
  @apiBody({ type: User })
  async create(): Promise<User> {
    return new User()
  }
}
