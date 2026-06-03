import client from "#/lib";
import { ref } from "vue";
import type { ParamsOption, RequestBodyOption } from "openapi-fetch";
import type { paths } from "#/generated/catfact";

interface AppError {
  code: number;
  message: string;
}

type FactCatQueryOptions<T> = ParamsOption<T> & RequestBodyOption<T>;

type CatFactResponse =
  paths["/fact"]["get"]["responses"]["200"]["content"]["application/json"];

export const useCatFactQuery = (
  fetchOptions: FactCatQueryOptions<paths["/fact"]["get"]>
) => {
  const state = ref<CatFactResponse>();
  const isReady = ref(false);
  const isFetching = ref(false);
  const error = ref<AppError | undefined>(undefined);

  async function execute() {
    error.value = undefined;
    isReady.value = false;
    isFetching.value = true;

    const { data, error: fetchError } = await client.GET("/fact", fetchOptions);

    if (fetchError) {
      error.value = fetchError;
    } else {
      state.value = data;
      isReady.value = true;
    }

    isFetching.value = false;
  }

  execute();

  return {
    state,
    isReady,
    isFetching,
    error,
    execute,
  };
};
