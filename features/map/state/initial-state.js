import { initialCatalogState } from "./slices/catalog-slice";
import { initialMetaState } from "./slices/meta-slice";
import { initialNetworkState } from "./slices/network-slice";
import { initialSearchState } from "./slices/search-slice";

export const initialState = {
  meta: initialMetaState,
  search: initialSearchState,
  catalog: initialCatalogState,
  network: initialNetworkState
};
