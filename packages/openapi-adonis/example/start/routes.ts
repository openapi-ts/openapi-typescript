/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file is used for defining the HTTP routes.
|
*/

import router from "@adonisjs/core/services/router";
import AdonisOpenAPI from "openapi-adonis";

const UsersController = () => import("#controllers/users_controller");

router.get("/", async () => {
  return {
    hello: "world",
  };
});

// router.get("/users/:id", [UsersController, "index"]);
// router.post("/users", [UsersController, "create"]);
router.resource("users", UsersController).apiOnly();

const builder = AdonisOpenAPI.document().setTitle("OpenAPI Adonis Example");
AdonisOpenAPI.setup("/docs", router, builder);
