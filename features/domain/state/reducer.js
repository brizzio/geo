import {
  DOMAIN_DELETE_BANNER,
  DOMAIN_DELETE_CLUSTER,
  DOMAIN_DELETE_CLUSTER_LEVEL,
  DOMAIN_DELETE_NETWORK,
  DOMAIN_DELETE_PRODUCT,
  DOMAIN_DELETE_PRICE_RESEARCH,
  DOMAIN_DELETE_STORE,
  DOMAIN_DELETE_TENANT,
  DOMAIN_HYDRATE,
  DOMAIN_SET_ACTIVE_TENANT,
  DOMAIN_UPSERT_BANNER,
  DOMAIN_UPSERT_CLUSTER,
  DOMAIN_UPSERT_CLUSTER_LEVEL,
  DOMAIN_UPSERT_NETWORK,
  DOMAIN_UPSERT_PRODUCT,
  DOMAIN_UPSERT_PRICE_RESEARCH,
  DOMAIN_UPSERT_STORE,
  DOMAIN_UPSERT_TENANT
} from "./action-types";
import { domainInitialState } from "./initial-state";
import { removeById, upsertById, uniqueStrings } from "./state-utils";
import { createDefaultClusterLevelsForCluster } from "../models";

function toArray(value) {
  return Array.isArray(value) ? value : [];
}

function normalizeText(value) {
  if (value === null || value === undefined) {
    return "";
  }
  return String(value).trim();
}

function normalizeBannerLogo(rawBanner = {}) {
  const rawLogo = rawBanner?.logo && typeof rawBanner.logo === "object" ? rawBanner.logo : {};
  const legacyLogoUrl = normalizeText(rawBanner.logo_url);

  const imageUrl = normalizeText(rawLogo.image_url || rawLogo.url) || legacyLogoUrl || null;
  const displayUrl = normalizeText(rawLogo.display_url) || imageUrl || null;
  const thumbUrl = normalizeText(rawLogo.thumb_url) || null;
  const mediumUrl = normalizeText(rawLogo.medium_url) || null;
  const deleteUrl = normalizeText(rawLogo.delete_url) || null;
  const providerId = normalizeText(rawLogo.id) || null;
  const provider = normalizeText(rawLogo.provider) || (imageUrl ? "imgbb" : null);

  const hasAnyValue =
    imageUrl || displayUrl || thumbUrl || mediumUrl || deleteUrl || providerId || provider;

  if (!hasAnyValue) {
    return null;
  }

  return {
    provider,
    id: providerId,
    image_url: imageUrl,
    display_url: displayUrl,
    thumb_url: thumbUrl,
    medium_url: mediumUrl,
    delete_url: deleteUrl
  };
}

function normalizeRetailBanner(item = {}) {
  const logo = normalizeBannerLogo(item);

  return {
    ...item,
    logo,
    logo_url: logo?.image_url || normalizeText(item.logo_url) || null
  };
}

function normalizeStoreFacade(rawStore = {}) {
  const rawFacade = rawStore?.facade && typeof rawStore.facade === "object" ? rawStore.facade : {};
  const legacyFacadeUrl = normalizeText(rawStore.facade_url);

  const imageUrl = normalizeText(rawFacade.image_url || rawFacade.url) || legacyFacadeUrl || null;
  const displayUrl = normalizeText(rawFacade.display_url) || imageUrl || null;
  const thumbUrl = normalizeText(rawFacade.thumb_url) || null;
  const mediumUrl = normalizeText(rawFacade.medium_url) || null;
  const deleteUrl = normalizeText(rawFacade.delete_url) || null;
  const providerId = normalizeText(rawFacade.id) || null;
  const provider = normalizeText(rawFacade.provider) || (imageUrl ? "imgbb" : null);

  const hasAnyValue =
    imageUrl || displayUrl || thumbUrl || mediumUrl || deleteUrl || providerId || provider;

  if (!hasAnyValue) {
    return null;
  }

  return {
    provider,
    id: providerId,
    image_url: imageUrl,
    display_url: displayUrl,
    thumb_url: thumbUrl,
    medium_url: mediumUrl,
    delete_url: deleteUrl
  };
}

function normalizeStoreCompetitorBannerLogo(rawStore = {}) {
  const rawLogo =
    rawStore?.competitor_banner_logo && typeof rawStore.competitor_banner_logo === "object"
      ? rawStore.competitor_banner_logo
      : {};
  const legacyLogoUrl =
    normalizeText(rawStore.competitor_banner_logo_url) || normalizeText(rawStore.competitor_logo_url);

  const imageUrl = normalizeText(rawLogo.image_url || rawLogo.url) || legacyLogoUrl || null;
  const displayUrl = normalizeText(rawLogo.display_url) || imageUrl || null;
  const thumbUrl = normalizeText(rawLogo.thumb_url) || null;
  const mediumUrl = normalizeText(rawLogo.medium_url) || null;
  const deleteUrl = normalizeText(rawLogo.delete_url) || null;
  const providerId = normalizeText(rawLogo.id) || null;
  const provider = normalizeText(rawLogo.provider) || (imageUrl ? "imgbb" : null);

  const hasAnyValue =
    imageUrl || displayUrl || thumbUrl || mediumUrl || deleteUrl || providerId || provider;

  if (!hasAnyValue) {
    return null;
  }

  return {
    provider,
    id: providerId,
    image_url: imageUrl,
    display_url: displayUrl,
    thumb_url: thumbUrl,
    medium_url: mediumUrl,
    delete_url: deleteUrl
  };
}

function normalizeStore(item = {}) {
  const internalCode = normalizeText(item.internal_code) || normalizeText(item.code) || null;
  const facade = normalizeStoreFacade(item);
  const competitorBannerLogo = normalizeStoreCompetitorBannerLogo(item);
  const rawAddress = item?.address && typeof item.address === "object" ? item.address : {};
  const city = normalizeText(rawAddress.city) || normalizeText(item.address_city) || null;
  const state = normalizeText(rawAddress.state) || normalizeText(item.address_state) || null;
  const street = normalizeText(rawAddress.street) || null;
  const streetNumber = normalizeText(rawAddress.street_number) || null;
  const neighbourhood = normalizeText(rawAddress.neighbourhood) || null;
  const postcode = normalizeText(rawAddress.postcode) || null;
  const country = normalizeText(rawAddress.country) || "Brasil";
  const displayName = normalizeText(rawAddress.display_name) || null;

  const rawGeo = item?.geo && typeof item.geo === "object" ? item.geo : {};
  const lat = Number.parseFloat(rawGeo?.latlon?.[0]);
  const lon = Number.parseFloat(rawGeo?.latlon?.[1]);
  const hasCoords = Number.isFinite(lat) && Number.isFinite(lon);
  const geo = {
    latlon: hasCoords ? [lat, lon] : null,
    source: normalizeText(rawGeo.source) || null
  };

  return {
    ...item,
    internal_code: internalCode,
    code: internalCode,
    banner_id: normalizeText(item.banner_id) || null,
    competitor_banner_name:
      normalizeText(item.competitor_banner_name) ||
      normalizeText(item.banner_name) ||
      normalizeText(item.banner) ||
      normalizeText(item.brand) ||
      null,
    competitor_banner_logo: competitorBannerLogo,
    competitor_banner_logo_url:
      competitorBannerLogo?.image_url || normalizeText(item.competitor_banner_logo_url) || null,
    short_name: normalizeText(item.short_name) || null,
    store_number: normalizeText(item.store_number) || null,
    address: {
      street,
      street_number: streetNumber,
      neighbourhood,
      city,
      state,
      postcode,
      country,
      display_name: displayName
    },
    geo,
    address_city: city,
    address_state: state,
    facade,
    facade_url: facade?.image_url || normalizeText(item.facade_url) || null
  };
}

function normalizeProductImage(rawProduct = {}) {
  const rawImage = rawProduct?.image && typeof rawProduct.image === "object" ? rawProduct.image : {};
  const legacyImageUrl =
    normalizeText(rawProduct.image_url) ||
    (typeof rawProduct.image === "string" ? normalizeText(rawProduct.image) : "");

  const imageUrl = normalizeText(rawImage.image_url || rawImage.url) || legacyImageUrl || null;
  const displayUrl = normalizeText(rawImage.display_url) || imageUrl || null;
  const thumbUrl = normalizeText(rawImage.thumb_url) || null;
  const mediumUrl = normalizeText(rawImage.medium_url) || null;
  const deleteUrl = normalizeText(rawImage.delete_url) || null;
  const providerId = normalizeText(rawImage.id) || null;
  const provider = normalizeText(rawImage.provider) || (imageUrl ? "imgbb" : null);

  const hasAnyValue =
    imageUrl || displayUrl || thumbUrl || mediumUrl || deleteUrl || providerId || provider;

  if (!hasAnyValue) {
    return null;
  }

  return {
    provider,
    id: providerId,
    image_url: imageUrl,
    display_url: displayUrl,
    thumb_url: thumbUrl,
    medium_url: mediumUrl,
    delete_url: deleteUrl
  };
}

function normalizeProductNumber(value) {
  const text = normalizeText(value);
  if (!text && text !== "0") {
    return null;
  }

  const parsed = Number.parseFloat(String(value).replace(",", "."));
  if (!Number.isFinite(parsed) || parsed < 0) {
    return null;
  }

  return parsed;
}

function normalizeProduct(item = {}) {
  const image = normalizeProductImage(item);

  return {
    ...item,
    tenant_id: normalizeText(item.tenant_id) || null,
    internal_reference: normalizeText(item.internal_reference) || null,
    ean: normalizeText(item.ean) || null,
    name: normalizeText(item.name) || "",
    description: normalizeText(item.description) || null,
    code_plu: normalizeText(item.code_plu) || null,
    image,
    image_url: image?.image_url || normalizeText(item.image_url) || null,
    brand: normalizeText(item.brand) || null,
    line: normalizeText(item.line) || null,
    industry_name: normalizeText(item.industry_name) || null,
    presentation: normalizeText(item.presentation) || null,
    weight: normalizeProductNumber(item.weight),
    weight_unit: normalizeText(item.weight_unit) || null,
    volume: normalizeProductNumber(item.volume),
    volume_unit: normalizeText(item.volume_unit) || null,
    category: normalizeText(item.category) || null
  };
}

const RESEARCH_WEEKDAY_IDS = new Set([
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
  "SUNDAY"
]);

function normalizeResearchStatus(value) {
  const normalized = normalizeText(value).toUpperCase();
  return normalized === "SUSPENDED" ? "SUSPENDED" : "ACTIVE";
}

function normalizeResearchWeekdays(rawResearch = {}) {
  const source =
    rawResearch?.recurrence?.weekdays ||
    rawResearch?.recurrence_weekdays ||
    [];

  return uniqueStrings(source)
    .map((item) => normalizeText(item).toUpperCase())
    .filter((item) => RESEARCH_WEEKDAY_IDS.has(item));
}

function normalizeResearchDurationDays(rawResearch = {}) {
  const parsedDuration = Number.parseInt(rawResearch?.duration_days, 10);
  if (Number.isFinite(parsedDuration) && parsedDuration > 0) {
    return parsedDuration;
  }

  const startDate = normalizeText(rawResearch?.start_date);
  const endDate = normalizeText(rawResearch?.end_date);
  if (!startDate || !endDate) {
    return null;
  }

  const start = Date.parse(`${startDate}T00:00:00Z`);
  const end = Date.parse(`${endDate}T00:00:00Z`);
  if (!Number.isFinite(start) || !Number.isFinite(end) || end < start) {
    return null;
  }

  const days = Math.floor((end - start) / 86_400_000) + 1;
  return days > 0 ? days : null;
}

function buildProductLookupByTenant(products = []) {
  const map = new Map();

  products.forEach((product) => {
    const tenantId = String(product?.tenant_id || "");
    if (!tenantId) {
      return;
    }

    const current = map.get(tenantId) || {
      byId: new Map(),
      byEan: new Map(),
      byName: new Map()
    };

    const productId = String(product?.id || "");
    if (productId) {
      current.byId.set(productId, productId);
    }

    const ean = normalizeText(product?.ean);
    if (ean) {
      current.byEan.set(ean, productId);
    }

    const name = normalizeText(product?.name).toLowerCase();
    if (name) {
      current.byName.set(name, productId);
    }

    map.set(tenantId, current);
  });

  return map;
}

function resolveLegacyResearchProductId(product = {}, lookup = null) {
  const directId = normalizeText(product?.product_id || product?.productId || product?.id);
  if (directId && lookup?.byId?.has(directId)) {
    return directId;
  }

  const ean = normalizeText(product?.ean || product?.gtin);
  if (ean && lookup?.byEan?.has(ean)) {
    return lookup.byEan.get(ean);
  }

  const name = normalizeText(product?.name).toLowerCase();
  if (name && lookup?.byName?.has(name)) {
    return lookup.byName.get(name);
  }

  return null;
}

function normalizeResearchLevelProductLists(rawResearch = {}, cluster = null, lookup = null) {
  const clusterLevelIds = uniqueStrings(
    (cluster?.levels || []).map((level) => String(level.id))
  );

  const sourceLevelLists = toArray(rawResearch.level_product_lists)
    .map((entry) => ({
      level_id: normalizeText(entry?.level_id),
      product_ids: uniqueStrings(entry?.product_ids || entry?.products || [])
        .map((value) => normalizeText(value))
        .filter(Boolean)
    }))
    .filter((entry) => entry.level_id);

  const legacyProductIds = toArray(rawResearch.products)
    .map((product) => resolveLegacyResearchProductId(product, lookup))
    .filter(Boolean);

  const defaultProductIds = uniqueStrings([
    ...toArray(rawResearch.default_product_ids),
    ...toArray(rawResearch.product_ids),
    ...legacyProductIds
  ])
    .map((value) => normalizeText(value))
    .filter(Boolean);

  const sameForAll =
    rawResearch.same_product_list_for_all_levels === undefined
      ? sourceLevelLists.length === 0
      : Boolean(rawResearch.same_product_list_for_all_levels);

  const targetLevelIds =
    clusterLevelIds.length > 0
      ? clusterLevelIds
      : uniqueStrings(sourceLevelLists.map((entry) => String(entry.level_id)));

  if (targetLevelIds.length === 0) {
    return {
      same_product_list_for_all_levels: sameForAll,
      default_product_ids: defaultProductIds,
      level_product_lists: []
    };
  }

  if (sameForAll) {
    const sharedProductIds =
      defaultProductIds.length > 0
        ? defaultProductIds
        : uniqueStrings(sourceLevelLists.flatMap((entry) => entry.product_ids || []));

    return {
      same_product_list_for_all_levels: true,
      default_product_ids: sharedProductIds,
      level_product_lists: targetLevelIds.map((levelId) => ({
        level_id: String(levelId),
        product_ids: uniqueStrings(sharedProductIds)
      }))
    };
  }

  const sourceMap = new Map(
    sourceLevelLists.map((entry) => [String(entry.level_id), uniqueStrings(entry.product_ids || [])])
  );

  const levelProductLists = targetLevelIds.map((levelId) => ({
    level_id: String(levelId),
    product_ids: uniqueStrings(sourceMap.get(String(levelId)) || [])
  }));

  return {
    same_product_list_for_all_levels: false,
    default_product_ids: uniqueStrings(levelProductLists.flatMap((entry) => entry.product_ids || [])),
    level_product_lists: levelProductLists
  };
}

function normalizePriceResearch(rawResearch = {}, clusterById = new Map(), productLookupByTenant = new Map()) {
  const tenantId = normalizeText(rawResearch?.tenant_id) || null;
  const clusterId = normalizeText(rawResearch?.cluster_id) || null;
  const cluster = clusterById.get(String(clusterId)) || null;
  const lookup = productLookupByTenant.get(String(tenantId)) || null;
  const normalizedLevels = normalizeResearchLevelProductLists(rawResearch, cluster, lookup);
  const recurrenceWeekdays = normalizeResearchWeekdays(rawResearch);
  const recurrenceEnabled =
    Boolean(rawResearch?.recurrence_enabled) ||
    Boolean(rawResearch?.recurrence?.enabled) ||
    recurrenceWeekdays.length > 0;
  const isDurationIndefinite = Boolean(rawResearch?.is_duration_indefinite);

  return {
    ...rawResearch,
    tenant_id: tenantId,
    cluster_id: clusterId,
    name: normalizeText(rawResearch?.name) || "",
    status: normalizeResearchStatus(rawResearch?.status),
    start_date: normalizeText(rawResearch?.start_date) || "",
    duration_days: isDurationIndefinite ? null : normalizeResearchDurationDays(rawResearch),
    is_duration_indefinite: isDurationIndefinite,
    recurrence_enabled: recurrenceEnabled,
    recurrence_weekdays: recurrenceEnabled ? recurrenceWeekdays : [],
    same_product_list_for_all_levels: normalizedLevels.same_product_list_for_all_levels,
    default_product_ids: normalizedLevels.default_product_ids,
    level_product_lists: normalizedLevels.level_product_lists
  };
}

function normalizeLevelCode(value) {
  const raw = normalizeText(value);
  if (!raw) {
    return null;
  }
  return raw
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "_")
    .toUpperCase();
}

function normalizeClusterLevel(level = {}, fallbackId = "level_custom") {
  const code = normalizeLevelCode(level.code || level.name || fallbackId);
  const name = normalizeText(level.name || code || "NIVEL");
  const id = normalizeText(level.id) || fallbackId;
  const sortOrder = Number.isFinite(Number(level.sort_order)) ? Number(level.sort_order) : 100;

  return {
    id,
    code: code || normalizeLevelCode(name) || "NIVEL",
    name,
    sort_order: sortOrder,
    is_system: Boolean(level.is_system)
  };
}

function normalizeClusterLevels(levels = [], legacyLevels = []) {
  const source =
    Array.isArray(levels) && levels.length > 0
      ? levels
      : legacyLevels.length > 0
        ? legacyLevels
        : createDefaultClusterLevelsForCluster();

  const byId = new Map();
  const byCode = new Set();

  source.forEach((level, index) => {
    const normalized = normalizeClusterLevel(level, `level_${index + 1}`);
    const codeKey = String(normalized.code).toUpperCase();
    if (byCode.has(codeKey)) {
      return;
    }
    byCode.add(codeKey);
    byId.set(String(normalized.id), normalized);
  });

  const result = [...byId.values()].sort(
    (a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name)
  );

  if (result.length > 0) {
    return result;
  }

  return createDefaultClusterLevelsForCluster();
}

function normalizeCluster(item = {}, legacyClusterLevels = []) {
  const tenantId = String(item.tenant_id || "");
  const legacyLevelsForTenant = legacyClusterLevels.filter(
    (level) => String(level.tenant_id || "") === tenantId
  );

  const levels = normalizeClusterLevels(item.levels || [], legacyLevelsForTenant);
  const levelIds = new Set(levels.map((level) => String(level.id)));
  const nextLevels = [...levels];

  const competitorGroups = toArray(item.competitor_groups)
    .map((group) => {
      const levelId = normalizeText(group?.level_id);
      const storeIds = uniqueStrings(group?.store_ids || []);
      if (!levelId || storeIds.length === 0) {
        return null;
      }

      if (!levelIds.has(levelId)) {
        const inferred = normalizeClusterLevel(
          {
            id: levelId,
            code: levelId,
            name: levelId,
            sort_order: 900
          },
          levelId
        );
        nextLevels.push(inferred);
        levelIds.add(levelId);
      }

      return {
        level_id: levelId,
        store_ids: storeIds
      };
    })
    .filter(Boolean);

  return {
    ...item,
    tenant_id: tenantId,
    own_store_ids: uniqueStrings(item.own_store_ids || []),
    levels: nextLevels.sort((a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name)),
    competitor_groups: competitorGroups
  };
}

export function normalizeDomainState(rawState) {
  if (!rawState || typeof rawState !== "object") {
    return domainInitialState;
  }

  const legacyClusterLevels = toArray(rawState.clusterLevels);
  const clusters = toArray(rawState.clusters).map((cluster) =>
    normalizeCluster(cluster, legacyClusterLevels)
  );
  const products = toArray(rawState.products).map(normalizeProduct);
  const clusterById = new Map(clusters.map((cluster) => [String(cluster.id), cluster]));
  const productLookupByTenant = buildProductLookupByTenant(products);

  return {
    meta: {
      activeTenantId: rawState?.meta?.activeTenantId || null
    },
    tenants: toArray(rawState.tenants),
    networks: toArray(rawState.networks),
    retailBanners: toArray(rawState.retailBanners).map(normalizeRetailBanner),
    stores: toArray(rawState.stores).map(normalizeStore),
    clusterLevels: [],
    clusters,
    priceResearches: toArray(rawState.priceResearches).map((research) =>
      normalizePriceResearch(research, clusterById, productLookupByTenant)
    ),
    products
  };
}

function pruneClusterStoreReferences(cluster, storeId) {
  const ownStoreIds = (cluster.own_store_ids || []).filter((id) => String(id) !== String(storeId));
  const competitorGroups = (cluster.competitor_groups || [])
    .map((group) => ({
      ...group,
      store_ids: (group.store_ids || []).filter((id) => String(id) !== String(storeId))
    }))
    .filter((group) => group.store_ids.length > 0);

  return {
    ...cluster,
    own_store_ids: ownStoreIds,
    competitor_groups: competitorGroups
  };
}

function pruneLevelReferences(cluster, levelId) {
  return {
    ...cluster,
    levels: (cluster.levels || []).filter((level) => String(level.id) !== String(levelId)),
    competitor_groups: (cluster.competitor_groups || []).filter(
      (group) => String(group.level_id) !== String(levelId)
    )
  };
}

function pruneClusterReferencesFromResearch(research, clusterId) {
  return String(research.cluster_id) !== String(clusterId);
}

function pruneStoreReferencesFromResearch(research, storeId) {
  return {
    ...research,
    competitor_store_ids: (research.competitor_store_ids || []).filter(
      (id) => String(id) !== String(storeId)
    )
  };
}

function cascadeDeleteTenant(state, tenantId) {
  const tenantIds = new Set([String(tenantId)]);
  const networks = state.networks.filter((item) => !tenantIds.has(String(item.tenant_id)));
  const removedNetworkIds = new Set(
    state.networks
      .filter((item) => tenantIds.has(String(item.tenant_id)))
      .map((item) => String(item.id))
  );

  const retailBanners = state.retailBanners.filter(
    (item) => !tenantIds.has(String(item.tenant_id)) && !removedNetworkIds.has(String(item.network_id))
  );
  const removedBannerIds = new Set(
    state.retailBanners
      .filter(
        (item) => tenantIds.has(String(item.tenant_id)) || removedNetworkIds.has(String(item.network_id))
      )
      .map((item) => String(item.id))
  );

  const stores = state.stores.filter(
    (item) =>
      !tenantIds.has(String(item.tenant_id)) &&
      !removedNetworkIds.has(String(item.network_id)) &&
      !removedBannerIds.has(String(item.banner_id))
  );
  const removedStoreIds = new Set(
    state.stores
      .filter(
        (item) =>
          tenantIds.has(String(item.tenant_id)) ||
          removedNetworkIds.has(String(item.network_id)) ||
          removedBannerIds.has(String(item.banner_id))
      )
      .map((item) => String(item.id))
  );

  const clusters = state.clusters
    .filter(
      (item) =>
        !tenantIds.has(String(item.tenant_id)) &&
        !removedNetworkIds.has(String(item.network_id)) &&
        !removedBannerIds.has(String(item.banner_id))
    )
    .map((cluster) => {
      let next = cluster;
      removedStoreIds.forEach((storeId) => {
        next = pruneClusterStoreReferences(next, storeId);
      });
      return next;
    });

  const keptClusterIds = new Set(clusters.map((item) => String(item.id)));
  const priceResearches = state.priceResearches
    .filter((item) => !tenantIds.has(String(item.tenant_id)))
    .filter((item) => keptClusterIds.has(String(item.cluster_id)))
    .map((research) => {
      let next = research;
      removedStoreIds.forEach((storeId) => {
        next = pruneStoreReferencesFromResearch(next, storeId);
      });
      return next;
    });
  const products = state.products.filter((item) => !tenantIds.has(String(item.tenant_id)));

  return {
    ...state,
    meta: {
      ...state.meta,
      activeTenantId:
        String(state.meta.activeTenantId) === String(tenantId) ? null : state.meta.activeTenantId
    },
    tenants: removeById(state.tenants, tenantId),
    networks,
    retailBanners,
    stores,
    clusterLevels: [],
    clusters,
    priceResearches,
    products
  };
}

function cascadeDeleteNetwork(state, networkId) {
  const networkIds = new Set([String(networkId)]);
  const retailBanners = state.retailBanners.filter((item) => !networkIds.has(String(item.network_id)));
  const removedBannerIds = new Set(
    state.retailBanners
      .filter((item) => networkIds.has(String(item.network_id)))
      .map((item) => String(item.id))
  );

  const stores = state.stores.filter(
    (item) => !networkIds.has(String(item.network_id)) && !removedBannerIds.has(String(item.banner_id))
  );
  const removedStoreIds = new Set(
    state.stores
      .filter((item) => networkIds.has(String(item.network_id)) || removedBannerIds.has(String(item.banner_id)))
      .map((item) => String(item.id))
  );

  const clusters = state.clusters
    .filter(
      (item) =>
        !networkIds.has(String(item.network_id)) && !removedBannerIds.has(String(item.banner_id))
    )
    .map((cluster) => {
      let next = cluster;
      removedStoreIds.forEach((storeId) => {
        next = pruneClusterStoreReferences(next, storeId);
      });
      return next;
    });

  const keptClusterIds = new Set(clusters.map((item) => String(item.id)));
  const priceResearches = state.priceResearches
    .filter((item) => keptClusterIds.has(String(item.cluster_id)))
    .map((research) => {
      let next = research;
      removedStoreIds.forEach((storeId) => {
        next = pruneStoreReferencesFromResearch(next, storeId);
      });
      return next;
    });

  return {
    ...state,
    networks: removeById(state.networks, networkId),
    retailBanners,
    stores,
    clusters,
    priceResearches
  };
}

function cascadeDeleteBanner(state, bannerId) {
  const bannerIds = new Set([String(bannerId)]);
  const stores = state.stores.filter((item) => !bannerIds.has(String(item.banner_id)));
  const removedStoreIds = new Set(
    state.stores
      .filter((item) => bannerIds.has(String(item.banner_id)))
      .map((item) => String(item.id))
  );

  const clusters = state.clusters
    .filter((item) => !bannerIds.has(String(item.banner_id)))
    .map((cluster) => {
      let next = cluster;
      removedStoreIds.forEach((storeId) => {
        next = pruneClusterStoreReferences(next, storeId);
      });
      return next;
    });

  const keptClusterIds = new Set(clusters.map((item) => String(item.id)));
  const priceResearches = state.priceResearches
    .filter((item) => keptClusterIds.has(String(item.cluster_id)))
    .map((research) => {
      let next = research;
      removedStoreIds.forEach((storeId) => {
        next = pruneStoreReferencesFromResearch(next, storeId);
      });
      return next;
    });

  return {
    ...state,
    retailBanners: removeById(state.retailBanners, bannerId),
    stores,
    clusters,
    priceResearches
  };
}

function cascadeDeleteStore(state, storeId) {
  const clusters = state.clusters.map((cluster) => pruneClusterStoreReferences(cluster, storeId));
  const priceResearches = state.priceResearches.map((research) =>
    pruneStoreReferencesFromResearch(research, storeId)
  );

  return {
    ...state,
    stores: removeById(state.stores, storeId),
    clusters,
    priceResearches
  };
}

function cascadeDeleteClusterLevel(state, levelId) {
  return {
    ...state,
    clusterLevels: removeById(state.clusterLevels, levelId),
    clusters: state.clusters.map((cluster) => pruneLevelReferences(cluster, levelId))
  };
}

function cascadeDeleteCluster(state, clusterId) {
  return {
    ...state,
    clusters: removeById(state.clusters, clusterId),
    priceResearches: state.priceResearches.filter((research) =>
      pruneClusterReferencesFromResearch(research, clusterId)
    )
  };
}

export function domainReducer(state, action) {
  switch (action.type) {
    case DOMAIN_HYDRATE: {
      return normalizeDomainState(action.payload);
    }
    case DOMAIN_SET_ACTIVE_TENANT:
      return {
        ...state,
        meta: {
          ...state.meta,
          activeTenantId: action.payload ? String(action.payload) : null
        }
      };
    case DOMAIN_UPSERT_TENANT: {
      let nextState = {
        ...state,
        tenants: upsertById(state.tenants, action.payload)
      };
      if (!nextState.meta.activeTenantId) {
        nextState = {
          ...nextState,
          meta: {
            ...nextState.meta,
            activeTenantId: String(action.payload.id)
          }
        };
      }
      return nextState;
    }
    case DOMAIN_DELETE_TENANT:
      return cascadeDeleteTenant(state, action.payload);
    case DOMAIN_UPSERT_NETWORK:
      return {
        ...state,
        networks: upsertById(state.networks, action.payload)
      };
    case DOMAIN_DELETE_NETWORK:
      return cascadeDeleteNetwork(state, action.payload);
    case DOMAIN_UPSERT_BANNER:
      return {
        ...state,
        retailBanners: upsertById(state.retailBanners, action.payload)
      };
    case DOMAIN_DELETE_BANNER:
      return cascadeDeleteBanner(state, action.payload);
    case DOMAIN_UPSERT_STORE:
      return {
        ...state,
        stores: upsertById(state.stores, normalizeStore(action.payload))
      };
    case DOMAIN_DELETE_STORE:
      return cascadeDeleteStore(state, action.payload);
    case DOMAIN_UPSERT_CLUSTER_LEVEL: {
      const merged = upsertById(state.clusterLevels, action.payload)
        .map((level) => ({
          ...level,
          sort_order: Number(level.sort_order) || 100
        }))
        .sort((a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name));

      return {
        ...state,
        clusterLevels: merged
      };
    }
    case DOMAIN_DELETE_CLUSTER_LEVEL:
      return cascadeDeleteClusterLevel(state, action.payload);
    case DOMAIN_UPSERT_CLUSTER:
      return {
        ...state,
        clusters: upsertById(
          state.clusters,
          normalizeCluster(
            {
              ...action.payload,
              own_store_ids: uniqueStrings(action.payload.own_store_ids || [])
            },
            []
          )
        )
      };
    case DOMAIN_DELETE_CLUSTER:
      return cascadeDeleteCluster(state, action.payload);
    case DOMAIN_UPSERT_PRICE_RESEARCH:
      {
        const clusterById = new Map((state.clusters || []).map((cluster) => [String(cluster.id), cluster]));
        const productLookupByTenant = buildProductLookupByTenant(state.products || []);
        return {
          ...state,
          priceResearches: upsertById(
            state.priceResearches,
            normalizePriceResearch(action.payload, clusterById, productLookupByTenant)
          )
        };
      }
    case DOMAIN_DELETE_PRICE_RESEARCH:
      return {
        ...state,
        priceResearches: removeById(state.priceResearches, action.payload)
      };
    case DOMAIN_UPSERT_PRODUCT:
      return {
        ...state,
        products: upsertById(state.products, normalizeProduct(action.payload))
      };
    case DOMAIN_DELETE_PRODUCT:
      return {
        ...state,
        products: removeById(state.products, action.payload)
      };
    default:
      return state;
  }
}
