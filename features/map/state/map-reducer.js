import { HYDRATE } from "./action-types";
import { initialState } from "./initial-state";
import { catalogReducer } from "./slices/catalog-slice";
import { metaReducer } from "./slices/meta-slice";
import { networkReducer } from "./slices/network-slice";
import { searchReducer } from "./slices/search-slice";

function coerceArray(value) {
  return Array.isArray(value) ? value : [];
}

function normalizeFlatState(raw) {
  return {
    meta: {
      tenantId: raw?.meta?.tenantId || initialState.meta.tenantId
    },
    search: {
      items: coerceArray(raw?.searchItems)
    },
    catalog: {
      banners: coerceArray(raw?.banners),
      clusters: coerceArray(raw?.clusters)
    },
    network: {
      headquarters: coerceArray(raw?.headquarters),
      headquarterStores: coerceArray(raw?.headquarterStores),
      branchStores: coerceArray(raw?.branchStores),
      concurrentStores: coerceArray(raw?.concurrentStores)
    }
  };
}

function normalizeDomainState(raw) {
  return {
    meta: {
      tenantId: raw?.meta?.tenantId || initialState.meta.tenantId
    },
    search: {
      items: coerceArray(raw?.search?.items)
    },
    catalog: {
      banners: coerceArray(raw?.catalog?.banners),
      clusters: coerceArray(raw?.catalog?.clusters)
    },
    network: {
      headquarters: coerceArray(raw?.network?.headquarters),
      headquarterStores: coerceArray(raw?.network?.headquarterStores),
      branchStores: coerceArray(raw?.network?.branchStores),
      concurrentStores: coerceArray(raw?.network?.concurrentStores)
    }
  };
}

export function normalizePersistedState(raw) {
  if (!raw || typeof raw !== "object") {
    return initialState;
  }

  if (raw.search || raw.catalog || raw.network) {
    return normalizeDomainState(raw);
  }

  return normalizeFlatState(raw);
}

export function mapReducer(state, action) {
  if (action.type === HYDRATE) {
    return normalizePersistedState(action.payload);
  }

  return {
    meta: metaReducer(state.meta, action),
    search: searchReducer(state.search, action),
    catalog: catalogReducer(state.catalog, action),
    network: networkReducer(state.network, action)
  };
}
