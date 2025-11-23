import type { KeyedMutator } from "swr";

import type { TableContentResponse } from "@/lib/types";

export type TableDetailQueryState = {
  data?: TableContentResponse;
  error?: Error;
  isLoading: boolean;
  mutate: KeyedMutator<TableContentResponse>;
};

