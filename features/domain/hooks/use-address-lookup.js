"use client";

import { useCallback, useRef, useState } from "react";
import {
  geocodeAddressCandidatesByInput,
  geocodeAddressCandidatesByQuery
} from "../services/nominatim-geocode";

const LOOKUP_CACHE_TTL_MS = 45 * 1000;
const LOOKUP_DEBUG = process.env.NODE_ENV !== "production";
const LOOKUP_LOG_PREFIX = "[address-lookup]";

function logLookup(event, details = {}) {
  if (!LOOKUP_DEBUG) {
    return;
  }
  console.info(`${LOOKUP_LOG_PREFIX} ${event}`, details);
}

function normalizeLookupToken(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function buildInputSignature(input = {}) {
  const parts = [
    input.street,
    input.street_number,
    input.neighbourhood,
    input.city,
    input.state,
    input.country
  ];
  return parts.map((item) => normalizeLookupToken(item)).filter(Boolean).join("|");
}

export function useAddressLookup({
  getAddressInput,
  applyResolvedAddress,
  countryCode = "br"
}) {
  const [searchValue, setSearchValue] = useState("");
  const [resolving, setResolving] = useState(false);
  const [addressOptions, setAddressOptions] = useState([]);
  const [selectedAddressOption, setSelectedAddressOption] = useState("0");
  const inFlightRef = useRef({ key: "", promise: null });
  const cachedRef = useRef({
    key: "",
    first: null,
    candidates: [],
    updatedAt: 0
  });

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
      const query = (searchValue || "").trim();
      const input = query ? null : getAddressInput();
      const sourceSignature = query
        ? `query:${normalizeLookupToken(query)}`
        : `input:${buildInputSignature(input)}`;
      const requestKey = `${normalizeLookupToken(countryCode)}:${sourceSignature}`;
      const cacheAgeMs = Date.now() - cachedRef.current.updatedAt;

      const cacheIsFresh =
        cachedRef.current.key === requestKey &&
        cacheAgeMs <= LOOKUP_CACHE_TTL_MS;

      if (cacheIsFresh && cachedRef.current.first) {
        logLookup("cache-hit", {
          key: requestKey,
          ageMs: cacheAgeMs,
          candidateCount: (cachedRef.current.candidates || []).length
        });
        setAddressOptions(cachedRef.current.candidates || []);
        setSelectedAddressOption("0");
        applyResolvedAddress(cachedRef.current.first);
        syncSearchWithResolved(cachedRef.current.first);
        return cachedRef.current.first;
      }

      if (inFlightRef.current.key === requestKey && inFlightRef.current.promise) {
        logLookup("dedupe-hit", { key: requestKey });
        try {
          return await inFlightRef.current.promise;
        } catch (error) {
          logLookup("dedupe-error", {
            key: requestKey,
            message: error?.message || "Erro desconhecido"
          });
          if (throwOnError) {
            throw error;
          }
          return null;
        }
      }

      logLookup("request-start", {
        key: requestKey,
        mode: query ? "query" : "input",
        query
      });
      setResolving(true);

      const execution = (async () => {
        const candidates = query
          ? await geocodeAddressCandidatesByQuery(query, countryCode)
          : await geocodeAddressCandidatesByInput(input || {}, countryCode);

        const first = candidates[0] || null;
        setAddressOptions(candidates);
        setSelectedAddressOption("0");

        if (first) {
          applyResolvedAddress(first);
          syncSearchWithResolved(first);
          cachedRef.current = {
            key: requestKey,
            first,
            candidates,
            updatedAt: Date.now()
          };
        } else {
          cachedRef.current = {
            key: "",
            first: null,
            candidates: [],
            updatedAt: 0
          };
        }

        logLookup("request-success", {
          key: requestKey,
          candidateCount: candidates.length,
          hasFirstResult: Boolean(first)
        });
        return first;
      })();

      inFlightRef.current = { key: requestKey, promise: execution };

      try {
        return await execution;
      } catch (error) {
        logLookup("request-error", {
          key: requestKey,
          message: error?.message || "Erro desconhecido"
        });
        resetAddressLookup();
        if (throwOnError) {
          throw error;
        }
        return null;
      } finally {
        if (inFlightRef.current.key === requestKey) {
          inFlightRef.current = { key: "", promise: null };
        }
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
