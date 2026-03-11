import { ADD_BANNER, ADD_CLUSTER } from "../action-types";
import { upsertById } from "../state-utils";

export const initialCatalogState = {
  banners: [],
  clusters: []
};

export function catalogReducer(state = initialCatalogState, action) {
  switch (action.type) {
    case ADD_BANNER:
      return {
        ...state,
        banners: upsertById(state.banners, action.payload)
      };
    case ADD_CLUSTER:
      return {
        ...state,
        clusters: upsertById(state.clusters, action.payload)
      };
    default:
      return state;
  }
}
