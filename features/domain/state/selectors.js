import { createDefaultClusterLevelsForCluster } from "../models";

export function selectTenants(state) {
  return state?.tenants || [];
}

export function selectTenantById(state, tenantId) {
  return selectTenants(state).find((item) => String(item.id) === String(tenantId)) || null;
}

export function selectActiveTenantId(state) {
  return state?.meta?.activeTenantId || null;
}

export function selectActiveTenant(state) {
  const tenantId = selectActiveTenantId(state);
  if (!tenantId) {
    return null;
  }
  return selectTenants(state).find((item) => String(item.id) === String(tenantId)) || null;
}

export function selectNetworksByTenant(state, tenantId) {
  return (state?.networks || []).filter((item) => String(item.tenant_id) === String(tenantId));
}

export function selectNetworkById(state, networkId) {
  return (state?.networks || []).find((item) => String(item.id) === String(networkId)) || null;
}

export function selectBannersByTenant(state, tenantId) {
  return (state?.retailBanners || []).filter((item) => String(item.tenant_id) === String(tenantId));
}

export function selectBannerById(state, bannerId) {
  return (state?.retailBanners || []).find((item) => String(item.id) === String(bannerId)) || null;
}

export function selectBannersByNetwork(state, networkId) {
  return (state?.retailBanners || []).filter((item) => String(item.network_id) === String(networkId));
}

export function selectStoresByTenant(state, tenantId) {
  return (state?.stores || []).filter((item) => String(item.tenant_id) === String(tenantId));
}

export function selectStoresByKind(state, tenantId, kind) {
  return selectStoresByTenant(state, tenantId).filter((item) => item.kind === kind);
}

export function selectClusterLevelsByTenant(state, tenantId) {
  const clusters = selectClustersByTenant(state, tenantId);
  const map = new Map();

  clusters.forEach((cluster) => {
    const levels =
      Array.isArray(cluster?.levels) && cluster.levels.length > 0
        ? cluster.levels
        : createDefaultClusterLevelsForCluster();

    levels.forEach((level) => {
      const key = String(level.id);
      if (!map.has(key)) {
        map.set(key, level);
      }
    });
  });

  return [...map.values()].sort((a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name));
}

export function selectClustersByTenant(state, tenantId) {
  return (state?.clusters || []).filter((item) => String(item.tenant_id) === String(tenantId));
}

export function selectPriceResearchesByTenant(state, tenantId) {
  return (state?.priceResearches || []).filter((item) => String(item.tenant_id) === String(tenantId));
}

export function selectPriceResearchById(state, researchId) {
  return (state?.priceResearches || []).find((item) => String(item.id) === String(researchId)) || null;
}

export function selectProductsByTenant(state, tenantId) {
  return (state?.products || []).filter((item) => String(item.tenant_id) === String(tenantId));
}

export function selectProductById(state, productId) {
  return (state?.products || []).find((item) => String(item.id) === String(productId)) || null;
}

export function selectClusterById(state, clusterId) {
  return (state?.clusters || []).find((item) => String(item.id) === String(clusterId)) || null;
}

export function selectStoreById(state, storeId) {
  return (state?.stores || []).find((item) => String(item.id) === String(storeId)) || null;
}

export function selectCompetitorStoreIdsFromCluster(cluster) {
  if (!cluster) {
    return [];
  }
  const ids = (cluster.competitor_groups || []).flatMap((group) => group.store_ids || []);
  return [...new Set(ids.map((item) => String(item)))];
}

export function selectDashboardTotals(state, tenantId) {
  return {
    networks: selectNetworksByTenant(state, tenantId).length,
    retailBanners: selectBannersByTenant(state, tenantId).length,
    stores: selectStoresByTenant(state, tenantId).length,
    clusters: selectClustersByTenant(state, tenantId).length,
    priceResearches: selectPriceResearchesByTenant(state, tenantId).length,
    products: selectProductsByTenant(state, tenantId).length
  };
}
