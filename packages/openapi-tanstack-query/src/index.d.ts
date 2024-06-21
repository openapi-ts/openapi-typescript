import type { UseMutationResult, UseQueryResult } from "@tanstack/react-query";
import type { MaybeOptionalInit, Client, FetchResponse } from "openapi-fetch";
import type {
  ErrorResponse,
  FilterKeys,
  HasRequiredKeys,
  HttpMethod,
  MediaType,
  OperationRequestBodyContent,
  PathsWithMethod,
  ResponseObjectMap,
  SuccessResponse,
} from "openapi-typescript-helpers";

export type UseQueryMethod<Paths extends Record<string, Record<HttpMethod, {}>>, Media extends MediaType> = <
  Method extends HttpMethod,
  Path extends PathsWithMethod<Paths, Method>,
  Init extends MaybeOptionalInit<Paths[Path], Method>,
  Response extends FetchResponse<Paths[Path][Method], Init, Media>,
>(
  method: Method,
  url: Path,
  ...init: HasRequiredKeys<Init> extends never
    ? [(Init & { [key: string]: unknown })?] // note: the arbitrary [key: string]: addition MUST happen here after all the inference happens (otherwise TS can’t infer if it’s required or not)
    : [Init & { [key: string]: unknown }]
) => UseQueryResult<NonNullable<Response["data"]>, NonNullable<Response["error"]>>;

export type UseMutationMethod<Paths extends Record<string, Record<HttpMethod, {}>>, Media extends MediaType> = <
  Method extends HttpMethod,
  Path extends PathsWithMethod<Paths, Method>,
  Init extends MaybeOptionalInit<Paths[Path], Method>,
  Response extends FetchResponse<Paths[Path][Method], Init, Media>,
>(
  method: Method,
  url: Path,
  ...init: HasRequiredKeys<Init> extends never
    ? [(Init & { [key: string]: unknown })?] // note: the arbitrary [key: string]: addition MUST happen here after all the inference happens (otherwise TS can’t infer if it’s required or not)
    : [Init & { [key: string]: unknown }]
) => UseMutationResult<NonNullable<Response["data"]>, NonNullable<Response["error"]>>;

export interface OpenapiQueryClient<Paths extends {}, Media extends MediaType = MediaType> {
  useQuery: UseQueryMethod<Paths, Media>;
  useMutation: UseMutationMethod<Paths, Media>;
}

export default function createClient<Paths extends {}, Media extends MediaType = MediaType>(
  client: Client<Paths, Media>,
): {
  useQuery: UseQueryMethod<Paths, Media>;
  useMutation: UseMutationMethod<Paths, Media>;
};
