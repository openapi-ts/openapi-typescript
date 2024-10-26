import useSWRImmutable from "swr/immutable";
import { describe, expect, it, vi } from "vitest";
import * as QueryBase from "../query-base.js";

vi.mock("../query-base.js");
const { configureBaseQueryHook } = vi.mocked(QueryBase);
// @ts-expect-error - return type is not relevant to this test
configureBaseQueryHook.mockReturnValue("pretend");

describe("createImmutableHook", () => {
  it("creates factory function using useSWRImmutable", async () => {
    const { createImmutableHook } = await import("../immutable.js");

    expect(configureBaseQueryHook).toHaveBeenLastCalledWith(useSWRImmutable);
    expect(createImmutableHook).toBe("pretend");
  });
});
