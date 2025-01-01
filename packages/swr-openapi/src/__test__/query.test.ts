import { describe, expect, it, vi } from "vitest";
import * as QueryBase from "../query-base.js";
import useSWR from "swr";

vi.mock("../query-base.js");
const { configureBaseQueryHook } = vi.mocked(QueryBase);
// @ts-expect-error - return type is not relevant to this test
configureBaseQueryHook.mockReturnValue("pretend");

describe("createQueryHook", () => {
  it("creates factory function using useSWR", async () => {
    const { createQueryHook } = await import("../query.js");

    expect(configureBaseQueryHook).toHaveBeenLastCalledWith(useSWR);
    expect(createQueryHook).toBe("pretend");
  });
});
