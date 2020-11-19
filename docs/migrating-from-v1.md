## Upgrading from v1 to v2

Some options were removed in openapi-typescript v2 that will break apps using v1, but it does so in exchange for more
control, more stability, and more resilient types.

TL;DR:

```diff
-import { OpenAPI2 } from './generated';
+import { definitions } from './generated';

-type MyType = OpenAPI2.MyType;
+type MyType = definitions['MyType'];
```

#### In-depth explanation

In order to explain the change, let’s go through an example with the following Swagger definition (partial):

```yaml
swagger: 2.0
definitions:
  user:
    type: object
    properties:
      role:
        type: object
        properties:
          access:
            enum:
              - admin
              - user
  user_role:
    type: object
      role:
        type: string
  team:
    type: object
    properties:
      users:
        type: array
        items:
          $ref: user
```

This is how **v1** would have generated those types:

```ts
declare namespace OpenAPI2 {
  export interface User {
    role?: UserRole;
  }
  export interface UserRole {
    access?: "admin" | "user";
  }
  export interface UserRole {
    role?: string;
  }
  export interface Team {
    users?: User[];
  }
}
```

Uh oh. It tried to be intelligent, and keep interfaces shallow by transforming `user.role` into `UserRole.` However, we
also have another `user_role` entry that has a conflicting `UserRole` interface. This is not what we want.

v1 of this project made certain assumptions about your schema that don’t always hold true. This is how **v2** generates
types from that same schema:

```ts
export interface definitions {
  user: {
    role?: {
      access?: "admin" | "user";
    };
  };
  user_role: {
    role?: string;
  };
  team: {
    users?: definitions["user"][];
  };
}
```

This matches your schema more accurately, and doesn’t try to be clever by keeping things shallow. It’s also more
predictable, with the generated types matching your schema naming. In your code here’s what would change:

```diff
-UserRole
+definitions['user']['role'];
```

While this is a change, it’s more predictable. Now you don’t have to guess what `user_role` was renamed to; you simply
chain your type from the Swagger definition you‘re used to.

#### Better \$ref generation

openapi-typescript v1 would attempt to resolve and flatten `$ref`s. This was bad because it would break on circular
references (which both Swagger and TypeScript allow), and resolution also slowed it down.

In v2, your `$ref`s are preserved as-declared, and TypeScript does all the work. Now the responsibility is on your
schema to handle collisions rather than openapi-typescript, which is a better approach in general.

#### No Wrappers

The `--wrapper` CLI flag was removed because it was awkward having to manage part of your TypeScript definition in a CLI
flag. In v2, simply compose the wrapper yourself however you’d like in TypeScript:

```ts
import { components as Schema1 } from './generated/schema-1.ts';
import { components as Schema2 } from './generated/schema-2.ts';

declare namespace OpenAPI3 {
  export Schema1;
  export Schema2;
}
```

#### No CamelCasing

The `--camelcase` flag was removed because it would mangle object names incorrectly or break trying to sanitize them
(for example, you couldn’t run camelcase on a schema with `my.obj` and `my-obj`—they both would transfom to the same
thing causing unexpected results).

OpenAPI allows for far more flexibility in naming schema objects than JavaScript, so that should be carried over from
your schema. In v2, the naming of generated types maps 1:1 with your schema name.
