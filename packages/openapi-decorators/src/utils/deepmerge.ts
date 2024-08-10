import deepmergeBase from "@fastify/deepmerge";

export function deepmerge<T>(target: T, source: Partial<T>): T {
  const dm = deepmergeBase();
  return dm(target, source) as T;
}
