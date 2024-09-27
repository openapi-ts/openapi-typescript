import { isMatch } from "lodash";
import createClient from "openapi-fetch";
import * as React from "react";
import * as SWR from "swr";
import type { ScopedMutator } from "swr/_internal";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createMutateHook } from "../mutate.js";
import type { paths } from "./fixtures/petstore.js";

// Mock `useCallback` (return given function as-is)
vi.mock("react");
const { useCallback, useDebugValue } = vi.mocked(React);
useCallback.mockImplementation((fn) => fn);

// Mock `useSWRConfig`
const swrMutate = vi.fn<ScopedMutator>();
vi.mock("swr");
const { useSWRConfig } = vi.mocked(SWR);
// @ts-expect-error - only `mutate` is relevant to this test
useSWRConfig.mockReturnValue({ mutate: swrMutate });

// Setup
const client = createClient<paths>();
const getKeyMatcher = () => {
  if (swrMutate.mock.calls.length === 0) {
    throw new Error("swr `mutate` not called");
  }
  return swrMutate.mock.lastCall![0] as ScopedMutator;
};

const useMutate = createMutateHook(
  client,
  "<unique-key>",
  // @ts-expect-error - not going to compare for most tests
  null,
);
const mutate = useMutate();

describe("createMutateHook", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("returns callback that invokes swr `mutate` with fn, data and options", async () => {
    expect(swrMutate).not.toHaveBeenCalled();

    const data = [{ name: "doggie", photoUrls: ["https://example.com"] }];
    const config = { throwOnError: false };

    await mutate(["/pet/findByStatus"], data, config);

    expect(swrMutate).toHaveBeenCalledTimes(1);
    expect(swrMutate).toHaveBeenLastCalledWith(
      // Matcher function
      expect.any(Function),
      // Data
      data,
      // Config
      config,
    );
  });

  it("supports boolean for options argument", async () => {
    expect(swrMutate).not.toHaveBeenCalled();

    const data = [{ name: "doggie", photoUrls: ["https://example.com"] }];

    await mutate(["/pet/findByStatus"], data, false);

    expect(swrMutate).toHaveBeenCalledTimes(1);
    expect(swrMutate).toHaveBeenLastCalledWith(
      // Matcher function
      expect.any(Function),
      // Data
      data,
      // Config
      false,
    );
  });

  it("invokes debug value hook with client prefix", () => {
    useMutate();

    expect(useDebugValue).toHaveBeenLastCalledWith("<unique-key>");
  });

  describe("useMutate -> mutate -> key matcher", () => {
    it("returns false for non-array keys", async () => {
      await mutate(["/pet/findByStatus"]);
      const keyMatcher = getKeyMatcher();

      expect(keyMatcher(null)).toBe(false);
      expect(keyMatcher(undefined)).toBe(false);
      expect(keyMatcher("")).toBe(false);
      expect(keyMatcher({})).toBe(false);
    });

    it("returns false for arrays with length !== 3", async () => {
      await mutate(["/pet/findByStatus"]);
      const keyMatcher = getKeyMatcher();

      expect(keyMatcher(Array(0))).toBe(false);
      expect(keyMatcher(Array(1))).toBe(false);
      expect(keyMatcher(Array(2))).toBe(false);
      expect(keyMatcher(Array(4))).toBe(false);
      expect(keyMatcher(Array(5))).toBe(false);
    });

    it("matches when prefix and path are equal and init isn't given", async () => {
      await mutate(["/pet/findByStatus"]);
      const keyMatcher = getKeyMatcher();

      // Same path, no init
      expect(keyMatcher(["<unique-key>", "/pet/findByStatus"])).toBe(true);

      // Same path, init ignored
      expect(
        keyMatcher(["<unique-key>", "/pet/findByStatus", { some: "init" }]),
      ).toBe(true);

      // Same path, undefined init ignored
      expect(keyMatcher(["<unique-key>", "/pet/findByStatus", undefined])).toBe(
        true,
      );
    });

    it("returns compare result when prefix and path are equal and init is given", async () => {
      const psudeoCompare = vi.fn().mockReturnValue("booleanPlaceholder");

      const prefix = "<unique-key>";
      const path = "/pet/findByStatus";
      const givenInit = {};

      const useMutate = createMutateHook(client, prefix, psudeoCompare);
      const mutate = useMutate();
      await mutate([path, givenInit]);
      const keyMatcher = getKeyMatcher();

      const result = keyMatcher([
        prefix, // Same prefix -> true
        path, // Same path -> true
        { some: "init" }, // Init -> should call `compare`
      ]);

      expect(psudeoCompare).toHaveBeenLastCalledWith(
        { some: "init" }, // Init from key
        givenInit, // Init given to compare
      );

      // Note: compare result is returned (real world would be boolean)
      expect(result).toBe("booleanPlaceholder");
    });
  });
});

describe("createMutateHook with lodash.isMatch as `compare`", () => {
  const useMutate = createMutateHook(client, "<unique-key>", isMatch);
  const mutate = useMutate();

  it("returns true when init is a subset of key init", async () => {
    await mutate([
      "/pet/findByTags",
      {
        params: {
          query: {
            tags: ["tag1"],
          },
        },
      },
    ]);
    const keyMatcher = getKeyMatcher();

    expect(
      keyMatcher([
        "<unique-key>",
        "/pet/findByTags",
        {
          params: {
            query: {
              other: "value",
              tags: ["tag1", "tag2"],
            },
          },
        },
      ]),
    ).toBe(true);
  });
});
