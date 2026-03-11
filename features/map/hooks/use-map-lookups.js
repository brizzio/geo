"use client";

import { useCallback } from "react";
import { STORE_TYPE_OPTIONS } from "../constants/store-types";
import { useMapState } from "../state/map-state";
import {
  selectBannerOptions,
  selectClusterOptions,
  selectHeadquarterStoreOptions
} from "../state/selectors";

export function useMapLookups() {
  const { state } = useMapState();

  const loadBannerOptions = useCallback((tenantId = "tenant1") => {
    return selectBannerOptions(state, tenantId);
  }, [state]);

  const loadStoreTypeOptions = useCallback(() => {
    return STORE_TYPE_OPTIONS;
  }, []);

  const loadHeadquarterStoreOptions = useCallback((tenantId = "tenant1") => {
    return selectHeadquarterStoreOptions(state, tenantId);
  }, [state]);

  const loadClusterOptions = useCallback((tenantId = "tenant1") => {
    return selectClusterOptions(state, tenantId);
  }, [state]);

  return {
    loadBannerOptions,
    loadStoreTypeOptions,
    loadHeadquarterStoreOptions,
    loadClusterOptions
  };
}
