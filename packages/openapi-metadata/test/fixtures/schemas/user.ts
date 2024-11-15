import { ApiProperty } from "../../../src/decorators/api-property.js";
import Post from "./post.js";

export default class User {
  @ApiProperty()
  declare id: number;

  @ApiProperty({ type: () => [Post] })
  declare posts: Post[];
}
