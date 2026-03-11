"use client";

import { useCallback } from "react";
import {
  ADD_BANNER,
  ADD_BRANCH_STORE,
  ADD_CLUSTER,
  ADD_CONCURRENT_STORE,
  ADD_HEADQUARTER,
  ADD_HEADQUARTER_STORE,
  ADD_SEARCH_ITEM
} from "../state/action-types";
import { useMapState } from "../state/map-state";
import { selectHeadquarterStoreById } from "../state/selectors";

const DEFAULT_TENANT_ID = "tenant1";
const DEFAULT_COUNTRY = "Brasil";
const DEFAULT_STORE_COLOR = "#cc0000";

function buildId() {
  return Date.now() + Math.floor(Math.random() * 1000);
}

function normalizeText(value) {
  const text = typeof value === "string" ? value.trim() : "";
  return text || null;
}

function normalizeAddress(address = {}) {
  return {
    street: normalizeText(address.street),
    street_number: normalizeText(address.street_number),
    neighbourhood: normalizeText(address.neighbourhood),
    city: normalizeText(address.city),
    state: normalizeText(address.state),
    postcode: normalizeText(address.postcode),
    country: normalizeText(address.country) || DEFAULT_COUNTRY
  };
}

function buildAddressQuery(address = {}) {
  const parts = [
    address.street_number,
    address.street,
    address.city,
    address.state,
    address.country || DEFAULT_COUNTRY
  ]
    .map((item) => (item || "").toString().trim())
    .filter(Boolean);

  if (!parts.length) {
    return "Avenida Paulista 900, Sao Paulo, SP, Brasil";
  }

  return parts.join(", ");
}

function normalizeNominatimResult(result) {
  const lat = Number.parseFloat(result?.lat);
  const lon = Number.parseFloat(result?.lon);
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    throw new Error("Coordenadas invalidas retornadas na geocodificacao.");
  }

  return {
    ...result,
    geo: {
      latlon: [lat, lon]
    },
    address: result?.address || {}
  };
}

async function geocodeAddress(address = {}) {
  const query = buildAddressQuery(address);
  const response = await fetch(`/api/nominatim/search?q=${encodeURIComponent(query)}`);

  if (!response.ok) {
    const details = await response.json().catch(() => ({}));
    throw new Error(details.error || `Falha na geocodificacao (${response.status})`);
  }

  const results = await response.json();
  if (!Array.isArray(results) || results.length === 0) {
    throw new Error("Endereco nao encontrado.");
  }

  return normalizeNominatimResult(results[0]);
}

export function useMapActions() {
  const { state, dispatch } = useMapState();

  const createBanner = useCallback(async (values, tenantId = DEFAULT_TENANT_ID) => {
    if (!values?.name?.trim()) {
      throw new Error("Informe o nome da bandeira.");
    }

    const payload = {
      id: values.id ?? buildId(),
      tenant_id: tenantId,
      code: normalizeText(values.code),
      name: normalizeText(values.name),
      description: normalizeText(values.description),
      logo_url: normalizeText(values.logo_url),
      logo_base_64: values.logo_base_64 || null
    };

    dispatch({ type: ADD_BANNER, payload });
    return payload;
  }, [dispatch]);

  const createHeadquarter = useCallback(async (values, tenantId = DEFAULT_TENANT_ID) => {
    if (!values?.name?.trim()) {
      throw new Error("Informe o nome da matriz.");
    }

    const address = normalizeAddress(values.address);
    const geoResult = await geocodeAddress(address);

    const payload = {
      id: values.id ?? buildId(),
      tenant_id: tenantId,
      category: "headquarter",
      name: normalizeText(values.name),
      description: normalizeText(values.description),
      legal_type: normalizeText(values.legal_type),
      industry: normalizeText(values.industry),
      fiscal_code: normalizeText(values.fiscal_code),
      internal_code: normalizeText(values.internal_code),
      address,
      geo: {
        latlon: geoResult.geo.latlon,
        display_name: geoResult.display_name || null
      },
      search_result: geoResult
    };

    dispatch({ type: ADD_HEADQUARTER, payload });
    return payload;
  }, [dispatch]);

  const createHeadquarterStore = useCallback(async (values, tenantId = DEFAULT_TENANT_ID) => {
    if (!values?.name?.trim()) {
      throw new Error("Informe o nome da loja matriz.");
    }
    if (!values?.banner_id) {
      throw new Error("Selecione uma bandeira para a loja matriz.");
    }

    const address = normalizeAddress(values.address);
    const geoResult = await geocodeAddress(address);

    const payload = {
      id: values.id ?? buildId(),
      tenant_id: tenantId,
      category: "headquarter-store",
      industry: "retail",
      name: normalizeText(values.name),
      description: normalizeText(values.description),
      legal_type: normalizeText(values.legal_type),
      store_type: values.store_type || null,
      banner_id: values.banner_id || null,
      internal_code: normalizeText(values.internal_code),
      fiscal_code: normalizeText(values.fiscal_code),
      address,
      geo: {
        latlon: geoResult.geo.latlon,
        activated_marker_color: values.color || DEFAULT_STORE_COLOR,
        display_name: geoResult.display_name || null
      },
      search_result: geoResult
    };

    dispatch({ type: ADD_HEADQUARTER_STORE, payload });
    return payload;
  }, [dispatch]);

  const createBranchStore = useCallback(async (values, tenantId = DEFAULT_TENANT_ID) => {
    if (!values?.name?.trim()) {
      throw new Error("Informe o nome da loja de rede.");
    }
    if (!values?.parent_id) {
      throw new Error("Selecione uma loja matriz.");
    }
    if (!values?.banner_id) {
      throw new Error("Selecione uma bandeira.");
    }

    const parentStore = selectHeadquarterStoreById(state, values.parent_id);
    const inheritedColor = parentStore?.geo?.activated_marker_color || DEFAULT_STORE_COLOR;
    const address = normalizeAddress(values.address);
    const geoResult = await geocodeAddress(address);

    const payload = {
      id: values.id ?? buildId(),
      tenant_id: tenantId,
      category: "branch-store",
      industry: "retail",
      parent_id: values.parent_id || null,
      banner_id: values.banner_id || null,
      name: normalizeText(values.name),
      description: normalizeText(values.description),
      legal_type: normalizeText(values.legal_type),
      store_type: values.store_type || null,
      internal_code: normalizeText(values.internal_code),
      fiscal_code: normalizeText(values.fiscal_code),
      address,
      geo: {
        latlon: geoResult.geo.latlon,
        activated_marker_color: values.color || inheritedColor,
        display_name: geoResult.display_name || null
      },
      search_result: geoResult
    };

    dispatch({ type: ADD_BRANCH_STORE, payload });
    return payload;
  }, [dispatch, state]);

  const createConcurrentStore = useCallback(async (values, tenantId = DEFAULT_TENANT_ID) => {
    if (!values?.name?.trim()) {
      throw new Error("Informe o nome do concorrente.");
    }
    if (!values?.cluster_id) {
      throw new Error("Selecione um cluster.");
    }
    if (!values?.banner_id) {
      throw new Error("Selecione uma bandeira.");
    }

    const address = normalizeAddress(values.address);
    const geoResult = await geocodeAddress(address);

    const payload = {
      id: values.id ?? buildId(),
      tenant_id: tenantId,
      category: "concurrent-store",
      industry: "retail",
      cluster_id: values.cluster_id || null,
      banner_id: values.banner_id || null,
      name: normalizeText(values.name),
      corporate_name: normalizeText(values.corporate_name),
      fiscal_code: normalizeText(values.fiscal_code),
      legal_type: normalizeText(values.legal_type),
      store_type: values.store_type || null,
      description: normalizeText(values.description),
      address,
      geo: {
        latlon: geoResult.geo.latlon,
        activated_marker_color: DEFAULT_STORE_COLOR,
        display_name: geoResult.display_name || null
      },
      search_result: geoResult
    };

    dispatch({ type: ADD_CONCURRENT_STORE, payload });
    return payload;
  }, [dispatch]);

  const createCluster = useCallback(async (values, tenantId = DEFAULT_TENANT_ID) => {
    if (!values?.name?.trim()) {
      throw new Error("Informe o nome do cluster.");
    }

    const payload = {
      id: values.id ?? buildId(),
      tenant_id: tenantId,
      code: normalizeText(values.code),
      name: normalizeText(values.name),
      description: normalizeText(values.description),
      members: Array.isArray(values.members) ? values.members : [],
      concurrents: Array.isArray(values.concurrents) ? values.concurrents : []
    };

    dispatch({ type: ADD_CLUSTER, payload });
    return payload;
  }, [dispatch]);

  const createSearchItem = useCallback((result) => {
    const parsed = normalizeNominatimResult(result);
    const payload = {
      id: result?.id ?? buildId(),
      place_id: result?.place_id ?? null,
      display_name: result?.display_name || null,
      store_type: result?.type || null,
      address: result?.address || {},
      geo: parsed.geo,
      source: "nominatim"
    };

    dispatch({ type: ADD_SEARCH_ITEM, payload });
    return payload;
  }, [dispatch]);

  return {
    createBanner,
    createHeadquarter,
    createHeadquarterStore,
    createBranchStore,
    createConcurrentStore,
    createCluster,
    createSearchItem
  };
}
