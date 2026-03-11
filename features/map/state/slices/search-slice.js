import { ADD_SEARCH_ITEM } from "../action-types";
import { dedupeByPlaceId } from "../state-utils";

export const initialSearchState = {
  items: []
};

export function searchReducer(state = initialSearchState, action) {
  switch (action.type) {
    case ADD_SEARCH_ITEM:
      return {
        ...state,
        items: dedupeByPlaceId(state.items, action.payload)
      };
    default:
      return state;
  }
}
