import createClient from "openapi-fetch";
import type { ErrorResponseJSON } from "openapi-typescript-helpers";
import * as SWR from "swr";
import type { ScopedMutator } from "swr/_internal";
import { describe, expectTypeOf, it, vi } from "vitest";
import { createImmutableHook } from "../immutable.js";
import { createInfiniteHook } from "../infinite.js";
import { createMutateHook } from "../mutate.js";
import { createQueryHook } from "../query.js";
import type { TypesForRequest } from "../types.js";
import type { components, paths } from "./fixtures/petstore.js";

// Mock `useSWRConfig`
const swrMutate = vi.fn<ScopedMutator>();
vi.mock("swr");
const { useSWRConfig } = vi.mocked(SWR);
// @ts-expect-error - only `mutate` is relevant to this test
useSWRConfig.mockReturnValue({ mutate: swrMutate });

// Types
type Pet = components["schemas"]["Pet"];
type PetInvalid = ErrorResponseJSON<paths["/pet/{petId}"]["get"]>;
type PetStatusInvalid = ErrorResponseJSON<paths["/pet/findByStatus"]["get"]>;
expectTypeOf<Pet>().toMatchTypeOf<{ name: string }>();
expectTypeOf<PetInvalid>().toMatchTypeOf<{ message: string }>();
expectTypeOf<PetStatusInvalid>().toMatchTypeOf<{ message: string }>();

// Set up hooks
const client = createClient<paths>();
const useQuery = createQueryHook(client, "<unique-key>");
const useImmutable = createImmutableHook(client, "<unique-key>");
const useInfinite = createInfiniteHook(client, "<unique-key>");
const useMutate = createMutateHook(
  client,
  "<unique-key>",
  // @ts-expect-error - compare function not needed for these type tests
  null,
);
const mutate = useMutate();

describe("types", () => {
  describe("key types", () => {
    describe("useQuery", () => {
      it("accepts config", () => {
        useQuery("/pet/findByStatus", null, { errorRetryCount: 1 });
      });

      describe("when init is required", () => {
        it("does not accept path alone", () => {
          // @ts-expect-error path is required
          useQuery("/pet/{petId}");
        });

        it("accepts path and init", () => {
          useQuery("/pet/{petId}", {
            params: {
              path: {
                petId: 5,
              },
            },
          });
        });

        it("accepts `null` init", () => {
          useQuery("/pet/{petId}", null);
        });
      });

      describe("when init is not required", () => {
        it("accepts path alone", () => {
          useQuery("/pet/findByStatus");
        });

        it("accepts path and init", () => {
          useQuery("/pet/findByStatus", {
            params: {
              query: {
                status: "available",
              },
            },
          });
        });

        it("accepts `null` init", () => {
          useQuery("/pet/findByStatus", null);
        });
      });
    });

    describe("useImmutable", () => {
      it("accepts config", () => {
        useImmutable("/pet/findByStatus", null, { errorRetryCount: 1 });
      });

      describe("when init is required", () => {
        it("does not accept path alone", () => {
          // @ts-expect-error path is required
          useImmutable("/pet/{petId}");
        });

        it("accepts path and init when init is required", () => {
          useImmutable("/pet/{petId}", {
            params: {
              path: {
                petId: 5,
              },
            },
          });
        });

        it("accepts `null` init", () => {
          useImmutable("/pet/{petId}", null);
        });
      });

      describe("when init is not required", () => {
        it("accepts path alone", () => {
          useImmutable("/pet/findByStatus");
        });

        it("accepts `null` init", () => {
          useImmutable("/pet/findByStatus", null);
        });
      });
    });

    describe("useInfinite", () => {
      it("accepts config", () => {
        useInfinite("/pet/findByStatus", () => null, {
          dedupingInterval: 10,
        });
      });

      describe("when init is required", () => {
        it("does not accept an empty init", () => {
          useInfinite(
            "/pet/findByTags",
            // @ts-expect-error empty init
            () => ({}),
          );
        });

        it("accepts a null init", () => {
          useInfinite("/pet/findByTags", () => null);
        });
      });

      describe("when init is not required", () => {
        it("accepts an empty init", () => {
          useInfinite("/pet/findByStatus", () => ({}));
        });

        it("accepts a null init", () => {
          useInfinite("/pet/findByStatus", () => null);
        });
      });
    });

    describe("useMutate -> mutate", () => {
      it("accepts path alone", async () => {
        await mutate(["/pet/{petId}"]);
      });

      it("accepts path and init", async () => {
        await mutate([
          "/pet/{petId}",
          {
            params: {
              path: {
                petId: 5,
              },
            },
          },
        ]);
      });

      it("accepts partial init", async () => {
        await mutate(["/pet/{petId}", { params: {} }]);
      });

      it("does not accept `null` init", async () => {
        await mutate([
          "/pet/{petId}",
          // @ts-expect-error null not accepted
          null,
        ]);
      });
    });

    describe("when init is not required", () => {
      it("accepts path alone", async () => {
        await mutate(["/pet/{petId}"]);
      });

      it("accepts path and init", async () => {
        await mutate([
          "/pet/{petId}",
          {
            params: {
              path: {
                petId: 5,
              },
            },
          },
        ]);
      });

      it("accepts partial init", async () => {
        await mutate(["/pet/{petId}", { params: {} }]);
      });

      it("does not accept `null` init", async () => {
        await mutate([
          "/pet/{petId}",
          // @ts-expect-error null not accepted
          null,
        ]);
      });
    });
  });

  describe("data types", () => {
    describe("useQuery", () => {
      it("returns correct data for path and init", () => {
        const { data } = useQuery("/pet/{petId}", {
          params: {
            path: {
              petId: 5,
            },
          },
        });
        expectTypeOf(data).toEqualTypeOf<Pet | undefined>();
      });

      it("returns correct data for path alone", () => {
        const { data } = useQuery("/pet/findByStatus");
        expectTypeOf(data).toEqualTypeOf<Pet[] | undefined>();
      });
    });

    describe("useImmutable", () => {
      it("returns correct data", () => {
        const { data } = useImmutable("/pet/{petId}", {
          params: {
            path: {
              petId: 5,
            },
          },
        });
        expectTypeOf(data).toEqualTypeOf<Pet | undefined>();
      });

      it("returns correct data for path alone", () => {
        const { data } = useImmutable("/pet/findByStatus");
        expectTypeOf(data).toEqualTypeOf<Pet[] | undefined>();
      });
    });

    describe("useInfinite", () => {
      it("returns correct data", () => {
        const { data } = useInfinite("/pet/findByStatus", (_index, _prev) => ({
          params: { query: { status: "available" } },
        }));

        expectTypeOf(data).toEqualTypeOf<Pet[][] | undefined>();
      });
    });

    describe("useMutate -> mutate", () => {
      it("returns correct data", async () => {
        const data = await mutate(
          ["/pet/{petId}", { params: { path: { petId: 5 } } }],
          {
            name: "Fido",
            photoUrls: ["https://example.com"],
          },
        );

        expectTypeOf(data).toEqualTypeOf<Array<Pet | undefined>>();
      });

      describe("when required init is not provided", () => {
        it("returns correct data", async () => {
          const data = await mutate(["/pet/{petId}"], {
            name: "Fido",
            photoUrls: ["https://example.com"],
          });

          expectTypeOf(data).toEqualTypeOf<Array<Pet | undefined>>();
        });
      });

      it("accepts promises in data argument", async () => {
        const data = Promise.resolve([
          { name: "doggie", photoUrls: ["https://example.com"] },
        ]);

        const result = await mutate(["/pet/findByStatus"], data);

        expectTypeOf(result).toEqualTypeOf<(Pet[] | undefined)[]>();
      });
    });
  });

  describe("error types", () => {
    describe("useQuery", () => {
      it("returns correct error", () => {
        const { error } = useQuery("/pet/{petId}", {
          params: {
            path: {
              petId: 5,
            },
          },
        });

        expectTypeOf(error).toEqualTypeOf<PetInvalid | undefined>();
      });
    });

    describe("useImmutable", () => {
      it("returns correct error", () => {
        const { error } = useImmutable("/pet/{petId}", {
          params: {
            path: {
              petId: 5,
            },
          },
        });

        expectTypeOf(error).toEqualTypeOf<PetInvalid | undefined>();
      });
    });

    describe("useInfinite", () => {
      it("returns correct error", () => {
        const { error } = useInfinite("/pet/findByStatus", (_index, _prev) => ({
          params: { query: { status: "available" } },
        }));

        expectTypeOf(error).toEqualTypeOf<PetStatusInvalid | undefined>();
      });
    });
  });
});

describe("TypesForRequest", () => {
  type GetPet = TypesForRequest<paths, "get", "/pet/{petId}">;
  type FindPetsByStatus = TypesForRequest<paths, "get", "/pet/findByStatus">;
  type FindPetsByTags = TypesForRequest<paths, "get", "/pet/findByTags">;

  describe("parity with openapi-fetch", () => {
    it("returns required init when params are required", () => {
      expectTypeOf<FindPetsByTags["Init"]>().toMatchTypeOf<{
        params: {
          query: {
            tags: string[];
          };
          header?: never;
          path?: never;
          cookie?: never;
        };
      }>();
    });

    it("returns optional init when no params are required", () => {
      expectTypeOf<GetPet["Init"]>().toMatchTypeOf<
        | undefined
        | {
            params: {
              path: {
                petId: number;
              };
              query?: never;
              header?: never;
              cookie?: never;
            };
          }
      >();
    });
  });

  it("returns correct data", () => {
    expectTypeOf<GetPet["Data"]>().toEqualTypeOf<Pet>();
    expectTypeOf<FindPetsByStatus["Data"]>().toEqualTypeOf<Pet[]>();
    expectTypeOf<FindPetsByTags["Data"]>().toEqualTypeOf<Pet[]>();
  });

  it("returns correct error", () => {
    expectTypeOf<GetPet["Error"]>().toEqualTypeOf<PetInvalid>();
    expectTypeOf<FindPetsByStatus["Error"]>().toEqualTypeOf<PetStatusInvalid>();
    expectTypeOf<FindPetsByTags["Error"]>().toEqualTypeOf<never>();
  });

  it("returns correct path params", () => {
    expectTypeOf<GetPet["Path"]>().toEqualTypeOf<{ petId: number }>();
    expectTypeOf<FindPetsByStatus["Path"]>().toEqualTypeOf<undefined>();
    expectTypeOf<FindPetsByTags["Path"]>().toEqualTypeOf<undefined>();
  });

  it("returns correct query params", () => {
    expectTypeOf<GetPet["Query"]>().toEqualTypeOf<undefined>();
    expectTypeOf<FindPetsByStatus["Query"]>().toEqualTypeOf<
      | undefined
      | {
          status?: "available" | "pending" | "sold";
        }
    >();
    expectTypeOf<FindPetsByTags["Query"]>().toEqualTypeOf<{
      tags: string[];
    }>();
  });

  it("returns correct headers", () => {
    expectTypeOf<GetPet["Headers"]>().toEqualTypeOf<undefined>();
    expectTypeOf<FindPetsByStatus["Headers"]>().toEqualTypeOf<
      | undefined
      | {
          "X-Example": string;
        }
    >();
    expectTypeOf<FindPetsByTags["Headers"]>().toEqualTypeOf<undefined>();
  });

  it("returns correct cookies", () => {
    expectTypeOf<GetPet["Cookies"]>().toEqualTypeOf<undefined>();
    expectTypeOf<FindPetsByStatus["Cookies"]>().toEqualTypeOf<
      | undefined
      | {
          "some-cookie-key": string;
        }
    >();
    expectTypeOf<FindPetsByTags["Cookies"]>().toEqualTypeOf<undefined>();
  });

  it("returns correct SWR config", () => {
    expectTypeOf<GetPet["SWRConfig"]>().toEqualTypeOf<
      SWR.SWRConfiguration<Pet, PetInvalid>
    >();
    expectTypeOf<FindPetsByStatus["SWRConfig"]>().toEqualTypeOf<
      SWR.SWRConfiguration<Pet[], PetStatusInvalid>
    >();
    expectTypeOf<FindPetsByTags["SWRConfig"]>().toEqualTypeOf<
      SWR.SWRConfiguration<Pet[], never>
    >();
  });

  it("returns correct SWR response", () => {
    expectTypeOf<GetPet["SWRResponse"]>().toEqualTypeOf<
      SWR.SWRResponse<Pet, PetInvalid, SWR.SWRConfiguration<Pet, PetInvalid>>
    >();
    expectTypeOf<FindPetsByStatus["SWRResponse"]>().toEqualTypeOf<
      SWR.SWRResponse<
        Pet[],
        PetStatusInvalid,
        SWR.SWRConfiguration<Pet[], PetStatusInvalid>
      >
    >();
    expectTypeOf<FindPetsByTags["SWRResponse"]>().toEqualTypeOf<
      SWR.SWRResponse<Pet[], never, SWR.SWRConfiguration<Pet[], never>>
    >();
  });
});
