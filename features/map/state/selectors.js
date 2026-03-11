export function selectTenantId(state) {
  return state?.meta?.tenantId || "tenant1";
}

export function selectSearchItems(state) {
  return state?.search?.items || [];
}

export function selectBanners(state) {
  return state?.catalog?.banners || [];
}

export function selectClusters(state) {
  return state?.catalog?.clusters || [];
}

export function selectHeadquarters(state) {
  return state?.network?.headquarters || [];
}

export function selectHeadquarterStores(state) {
  return state?.network?.headquarterStores || [];
}

export function selectBranchStores(state) {
  return state?.network?.branchStores || [];
}

export function selectConcurrentStores(state) {
  return state?.network?.concurrentStores || [];
}

export function selectLayerCount(state) {
  return (
    selectSearchItems(state).length +
    selectHeadquarters(state).length +
    selectHeadquarterStores(state).length +
    selectBranchStores(state).length +
    selectConcurrentStores(state).length
  );
}

export function selectHeadquarterStoreById(state, id) {
  return selectHeadquarterStores(state).find((item) => String(item.id) === String(id)) || null;
}

export function selectBannerOptions(state, tenantId = "tenant1") {
  return selectBanners(state)
    .filter((item) => item.tenant_id === tenantId)
    .map((item) => ({
      id: String(item.id),
      label: item.name || item.code || String(item.id)
    }));
}

export function selectHeadquarterStoreOptions(state, tenantId = "tenant1") {
  return selectHeadquarterStores(state)
    .filter((item) => item.tenant_id === tenantId)
    .map((item) => ({
      id: String(item.id),
      label: item.name || item.internal_code || String(item.id)
    }));
}

export function selectClusterOptions(state, tenantId = "tenant1") {
  return selectClusters(state)
    .filter((item) => item.tenant_id === tenantId)
    .map((item) => ({
      id: String(item.id),
      label: item.name || item.code || String(item.id)
    }));
}
