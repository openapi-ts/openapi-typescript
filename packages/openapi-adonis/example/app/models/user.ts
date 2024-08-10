import { BaseModel } from '@adonisjs/lucid/orm'
import { apiProperty } from 'openapi-adonis/decorators'

export default class User extends BaseModel {
  @apiProperty({ example: '5' })
  declare id: string

  @apiProperty()
  declare name: number

  @apiProperty()
  declare hey: string

  @apiProperty({ type: User })
  declare user: User
}
