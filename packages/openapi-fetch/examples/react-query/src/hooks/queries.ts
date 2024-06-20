import { useQuery } from "@tanstack/react-query";
import type { ParamsOption, RequestBodyOption } from "openapi-fetch";
import type { paths } from "../lib/api/v1";
import client from "../lib/api";

type UseQueryOptions<T> = ParamsOption<T> &
  RequestBodyOption<T> & {
    // add your custom options here
    reactQuery?: {
      enabled: boolean; // Note: React Query type’s inference is difficult to apply automatically, hence manual option passing here
      // add other React Query options as needed
    };
  };

// paths
const GET_FACT = "/fact";

export function getFact({ params, body, reactQuery }: UseQueryOptions<paths[typeof GET_FACT]["get"]>) {
  return useQuery({
    ...reactQuery,
    queryKey: [
      GET_FACT,
      // add any other hook dependencies here
    ],
    queryFn: async ({ signal }) => {
      const { data } = await client.GET(GET_FACT, {
        params,
        // body - isn’t used for GET, but needed for other request types
        signal, // allows React Query to cancel request
      });
      return data;
      // Note: Error throwing handled automatically via middleware
    },
  });
}
