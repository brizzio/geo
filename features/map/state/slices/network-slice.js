import {
  ADD_BRANCH_STORE,
  ADD_CONCURRENT_STORE,
  ADD_HEADQUARTER,
  ADD_HEADQUARTER_STORE
} from "../action-types";
import { upsertById } from "../state-utils";

export const initialNetworkState = {
  headquarters: [],
  headquarterStores: [],
  branchStores: [],
  concurrentStores: []
};

export function networkReducer(state = initialNetworkState, action) {
  switch (action.type) {
    case ADD_HEADQUARTER:
      return {
        ...state,
        headquarters: upsertById(state.headquarters, action.payload)
      };
    case ADD_HEADQUARTER_STORE:
      return {
        ...state,
        headquarterStores: upsertById(state.headquarterStores, action.payload)
      };
    case ADD_BRANCH_STORE:
      return {
        ...state,
        branchStores: upsertById(state.branchStores, action.payload)
      };
    case ADD_CONCURRENT_STORE:
      return {
        ...state,
        concurrentStores: upsertById(state.concurrentStores, action.payload)
      };
    default:
      return state;
  }
}
