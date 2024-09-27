import createClient from "openapi-fetch";
import * as React from "react";
import * as SWRInfinite from "swr/infinite";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createInfiniteHook } from "../infinite.js";
import type { paths } from "./fixtures/petstore.js";

// Mock `useCallback` (return given function as-is)
vi.mock("react");
const { useCallback, useMemo, useDebugValue } = vi.mocked(React);
useCallback.mockImplementation((fn) => fn);
useMemo.mockImplementation((fn) => fn());

// Mock `useSWRInfinite`
vi.mock("swr/infinite");
const { default: useSWRInfinite } = vi.mocked(SWRInfinite);

// Mock `client.GET`
const client = createClient<paths>();
const getSpy = vi.spyOn(client, "GET");
getSpy.mockResolvedValue({ data: undefined, error: undefined });

// Create testable useInfinite hook
const useInfinite = createInfiniteHook(client, "<unique-key>");

describe("createInfiniteHook", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("passes correct key loader to useSWRInfinite", () => {
    const getInit = vi.fn().mockReturnValueOnce({ foo: "bar" });

    useInfinite("/pet/{petId}", getInit);

    // Invokes `useSWRInfinite`
    expect(useSWRInfinite).toHaveBeenCalledTimes(1);

    let getKey = useSWRInfinite.mock.lastCall![0];

    // Calling `getKey` should invoke `getInit`
    const key = getKey(0, null);

    expect(getInit).toHaveBeenCalledTimes(1);

    // `getInit` should be called with key loader arguments
    expect(getInit).toHaveBeenCalledWith(0, null);

    // `getKey` should return correct key
    expect(key).toMatchObject(["<unique-key>", "/pet/{petId}", { foo: "bar" }]);

    // Key is `null` when `getInit` returns `null`
    getInit.mockReturnValueOnce(null);
    useInfinite("/pet/{petId}", getInit);
    getKey = useSWRInfinite.mock.lastCall![0];

    expect(getKey(0, null)).toBeNull();
  });

  it("passes correct fetcher to useSWRInfinite", async () => {
    useInfinite("/pet/{petId}", vi.fn());

    const fetcher = useSWRInfinite.mock.lastCall![1];

    // client.GET not called until fetcher is called
    expect(getSpy).not.toHaveBeenCalled();

    // Call fetcher
    getSpy.mockResolvedValueOnce({ data: "some-data", error: undefined });
    const data = await fetcher!(["some-key", "any-path", { some: "init" }]);

    expect(getSpy).toHaveBeenLastCalledWith("any-path", { some: "init" });
    expect(data).toBe("some-data");

    // Call fetcher with error
    getSpy.mockResolvedValueOnce({
      data: undefined,
      error: new Error("Yikes"),
    });

    await expect(() => fetcher!(["some-key", "any-path", { some: "init" }])).rejects.toThrow(new Error("Yikes"));
  });

  it("passes correct config to useSWRInfinite", () => {
    useInfinite("/pet/{petId}", vi.fn(), { initialSize: 5000 });

    expect(useSWRInfinite).toHaveBeenLastCalledWith(expect.any(Function), expect.any(Function), { initialSize: 5000 });

    useInfinite("/pet/{petId}", vi.fn());

    expect(useSWRInfinite).toHaveBeenLastCalledWith(expect.any(Function), expect.any(Function), undefined);
  });

  it("invokes debug value hook with path", () => {
    useInfinite("/pet/findByStatus", () => null);

    expect(useDebugValue).toHaveBeenLastCalledWith("<unique-key> - /pet/findByStatus");

    useInfinite("/pet/findByTags", () => ({
      params: { query: { tags: ["tag1"] } },
    }));

    expect(useDebugValue).toHaveBeenLastCalledWith("<unique-key> - /pet/findByTags");
  });
});
