import { ApiProperty } from "../../../src/decorators/api-property.js";
import User from "./user.js";

export default class Post {
  @ApiProperty()
  declare id: number;

  @ApiProperty({ type: () => User })
  declare author: User;
}
