import { useMutation, useQuery } from "@tanstack/react-query";

/**
 * Create an openapi-fetch client.
 * @type {import("./index.js").default}
 */
export default function createClient(client) {
  return {
    useQuery: (method, url, init, options) =>
      useQuery({
        queryKey: [method, url, init],
        queryFn: async () => {
          const { data, error } = await client[method.toUpperCase()](url, init);
          if (error) {
            throw error;
          }
          return data;
        },
        ...options,
      }),
    useMutation: (method, url, init, options) =>
      useMutation({
        mutationKey: [method, url, init],
        mutationFn: async () => {
          const { data, error } = await client[method.toUpperCase()](url, init);
          if (error) {
            throw error;
          }
          return data;
        },
        ...options,
      }),
  };
}
