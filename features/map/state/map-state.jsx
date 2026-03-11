"use client";

import { createContext, useContext, useEffect, useMemo, useReducer } from "react";
import { HYDRATE } from "./action-types";
import { initialState } from "./initial-state";
import { mapReducer } from "./map-reducer";

const STORAGE_KEY = "geo-react-state-v1";

const MapStateContext = createContext(null);

export function MapStateProvider({ children }) {
  const [state, dispatch] = useReducer(mapReducer, initialState);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        return;
      }
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object") {
        dispatch({ type: HYDRATE, payload: parsed });
      }
    } catch (_error) {
      // ignore hydration errors from old state versions
    }
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (_error) {
      // ignore persist errors
    }
  }, [state]);

  const value = useMemo(() => ({ state, dispatch }), [state, dispatch]);
  return <MapStateContext.Provider value={value}>{children}</MapStateContext.Provider>;
}

export function useMapState() {
  const context = useContext(MapStateContext);
  if (!context) {
    throw new Error("useMapState must be used inside MapStateProvider");
  }
  return context;
}
