import createClient from "openapi-fetch";
import * as React from "react";
import * as SWR from "swr";
import { afterEach, describe, expect, it, vi } from "vitest";
import { configureBaseQueryHook } from "../query-base.js";
import type { paths } from "./fixtures/petstore.js";

// Mock `useCallback` (return given function as-is)
vi.mock("react");
const { useCallback, useMemo, useDebugValue } = vi.mocked(React);
useCallback.mockImplementation((fn) => fn);
useMemo.mockImplementation((fn) => fn());

// Mock `useSWR`
vi.mock("swr");
const { default: useSWR } = vi.mocked(SWR);
useSWR.mockReturnValue({
  data: undefined,
  error: undefined,
  isLoading: false,
  isValidating: false,
  mutate: vi.fn(),
});

// Mock `client.GET`
const client = createClient<paths>();
const getSpy = vi.spyOn(client, "GET");
getSpy.mockResolvedValue({ data: undefined, error: undefined });
// Create testable useQuery hook
const createQueryHook = configureBaseQueryHook(useSWR);
const useQuery = createQueryHook(client, "<unique-key>");

describe("configureBaseQueryHook", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("passes correct key to useSWR", () => {
    useQuery("/store/inventory", {});

    expect(useSWR).toHaveBeenLastCalledWith(["<unique-key>", "/store/inventory", {}], expect.any(Function), undefined);

    useQuery("/pet/findByTags", {
      params: {
        query: {
          tags: ["tag1", "tag2"],
        },
      },
    });

    expect(useSWR).toHaveBeenLastCalledWith(
      [
        "<unique-key>",
        "/pet/findByTags",
        {
          params: {
            query: {
              tags: ["tag1", "tag2"],
            },
          },
        },
      ],
      expect.any(Function),
      undefined,
    );

    useQuery("/store/inventory");

    expect(useSWR).toHaveBeenLastCalledWith(
      ["<unique-key>", "/store/inventory", undefined],
      expect.any(Function),
      undefined,
    );
  });

  it("passes correct fetcher to useSWR", async () => {
    // Note: useQuery input doesn't matter here, since we test the fetcher in isolation
    useQuery("/pet/findByStatus");

    const fetcher = useSWR.mock.lastCall![1];

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

  it("passes correct config to useSWR", () => {
    useQuery("/pet/findByStatus", {}, { errorRetryCount: 56 });

    expect(useSWR).toHaveBeenLastCalledWith(["<unique-key>", "/pet/findByStatus", {}], expect.any(Function), {
      errorRetryCount: 56,
    });
  });

  it("invokes debug value hook with path", () => {
    useQuery("/pet/findByStatus");

    expect(useDebugValue).toHaveBeenLastCalledWith("<unique-key> - /pet/findByStatus");

    useQuery("/pet/{petId}", { params: { path: { petId: 4 } } });

    expect(useDebugValue).toHaveBeenLastCalledWith("<unique-key> - /pet/{petId}");
  });
});
