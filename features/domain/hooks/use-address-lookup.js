"use client";

import { useCallback, useState } from "react";
import {
  geocodeAddressCandidatesByInput,
  geocodeAddressCandidatesByQuery
} from "../services/nominatim-geocode";

export function useAddressLookup({
  getAddressInput,
  applyResolvedAddress,
  countryCode = "br"
}) {
  const [searchValue, setSearchValue] = useState("");
  const [resolving, setResolving] = useState(false);
  const [addressOptions, setAddressOptions] = useState([]);
  const [selectedAddressOption, setSelectedAddressOption] = useState("0");

  const resetAddressLookup = useCallback(() => {
    setAddressOptions([]);
    setSelectedAddressOption("0");
  }, []);

  const syncSearchWithResolved = useCallback((resolved) => {
    setSearchValue(resolved?.address?.display_name || "");
  }, []);

  const selectAddressOption = useCallback(
    (value) => {
      const nextIndex = Number.parseInt(value, 10);
      if (!Number.isFinite(nextIndex) || nextIndex < 0) {
        return;
      }

      setSelectedAddressOption(String(nextIndex));
      const selected = addressOptions[nextIndex];
      if (!selected) {
        return;
      }

      applyResolvedAddress(selected);
      syncSearchWithResolved(selected);
    },
    [addressOptions, applyResolvedAddress, syncSearchWithResolved]
  );

  const resolveAddress = useCallback(
    async ({ throwOnError = false } = {}) => {
      setResolving(true);
      try {
        const query = (searchValue || "").trim();
        const candidates = query
          ? await geocodeAddressCandidatesByQuery(query, countryCode)
          : await geocodeAddressCandidatesByInput(getAddressInput(), countryCode);

        const first = candidates[0] || null;
        setAddressOptions(candidates);
        setSelectedAddressOption("0");

        if (first) {
          applyResolvedAddress(first);
          syncSearchWithResolved(first);
        }

        return first;
      } catch (error) {
        resetAddressLookup();
        if (throwOnError) {
          throw error;
        }
        return null;
      } finally {
        setResolving(false);
      }
    },
    [
      applyResolvedAddress,
      countryCode,
      getAddressInput,
      resetAddressLookup,
      searchValue,
      syncSearchWithResolved
    ]
  );

  return {
    searchValue,
    setSearchValue,
    resolving,
    addressOptions,
    selectedAddressOption,
    resetAddressLookup,
    selectAddressOption,
    resolveAddress
  };
}
