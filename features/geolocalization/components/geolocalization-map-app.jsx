"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { STORE_KINDS } from "../../domain/models/store-model";
import {
  selectActiveTenant,
  selectActiveTenantId,
  selectBannersByTenant,
  selectClustersByTenant,
  selectNetworksByTenant,
  selectStoresByTenant
} from "../../domain/state/selectors";
import { useDomainState } from "../../domain/state/domain-state";
import GeolocalizationMapCanvas from "./geolocalization-map-canvas";
import MapFloatingFilters from "./map-floating-filters";
import {
  ALL_FILTER_VALUE,
  buildClusterCoverage,
  getStoreLatLng,
  resolveCompetitorStoreLogo,
  resolveOwnStoreLogo,
  resolveStoreFacade
} from "../utils/map-utils";

function byName(a, b) {
  return String(a?.name || "").localeCompare(String(b?.name || ""));
}

function asOptions(items = []) {
  return [...items]
    .map((item) => ({ id: String(item?.id || ""), name: String(item?.name || item?.id || "") }))
    .filter((item) => item.id)
    .sort(byName);
}

function isAll(value) {
  return String(value || "") === ALL_FILTER_VALUE;
}

function isCompetitorKind(kind) {
  const normalized = String(kind || "").toUpperCase();
  return normalized.includes("COMPETITOR") || normalized.includes("CONCURRENT");
}

function summarizeGeolocation(items = [], getLatLng) {
  const total = Array.isArray(items) ? items.length : 0;
  const withGeo = (items || []).filter((item) => Boolean(getLatLng(item))).length;
  return {
    total,
    withGeo,
    withoutGeo: Math.max(0, total - withGeo)
  };
}

export default function GeolocalizationMapApp() {
  const { state, hydrationDone } = useDomainState();
  const activeTenantId = useMemo(() => selectActiveTenantId(state), [state]);
  const activeTenant = useMemo(() => selectActiveTenant(state), [state]);
  const networks = useMemo(
    () => (activeTenantId ? selectNetworksByTenant(state, activeTenantId) : []),
    [state, activeTenantId]
  );
  const banners = useMemo(
    () => (activeTenantId ? selectBannersByTenant(state, activeTenantId) : []),
    [state, activeTenantId]
  );
  const stores = useMemo(
    () => (activeTenantId ? selectStoresByTenant(state, activeTenantId) : []),
    [state, activeTenantId]
  );
  const clusters = useMemo(
    () => (activeTenantId ? selectClustersByTenant(state, activeTenantId) : []),
    [state, activeTenantId]
  );
  const ownStores = useMemo(
    () =>
      stores.filter(
        (item) =>
          String(item?.kind || "").toUpperCase() === STORE_KINDS.OWN || !isCompetitorKind(item?.kind)
      ),
    [stores]
  );
  const competitorStores = useMemo(
    () => stores.filter((item) => isCompetitorKind(item?.kind)),
    [stores]
  );
  const bannerById = useMemo(
    () => new Map((banners || []).map((banner) => [String(banner.id), banner])),
    [banners]
  );
  const networkById = useMemo(
    () => new Map((networks || []).map((network) => [String(network.id), network])),
    [networks]
  );
  const storeById = useMemo(
    () => new Map((stores || []).map((store) => [String(store.id), store])),
    [stores]
  );

  const [selectedNetworkId, setSelectedNetworkId] = useState(ALL_FILTER_VALUE);
  const [selectedBannerId, setSelectedBannerId] = useState(ALL_FILTER_VALUE);
  const [selectedOwnStoreId, setSelectedOwnStoreId] = useState(ALL_FILTER_VALUE);
  const [selectedCompetitorStoreId, setSelectedCompetitorStoreId] = useState(ALL_FILTER_VALUE);
  const [selectedClusterId, setSelectedClusterId] = useState(ALL_FILTER_VALUE);
  const [layerVisibility, setLayerVisibility] = useState({
    ownStores: true,
    competitorStores: true,
    clusters: true,
    coverage: true
  });

  const networkFilteredOwnStores = useMemo(() => {
    if (isAll(selectedNetworkId)) {
      return ownStores;
    }
    return ownStores.filter(
      (store) => String(store?.network_id || "") === String(selectedNetworkId)
    );
  }, [ownStores, selectedNetworkId]);

  const networkFilteredCompetitorStores = useMemo(() => {
    if (isAll(selectedNetworkId)) {
      return competitorStores;
    }
    return competitorStores.filter(
      (store) => String(store?.network_id || "") === String(selectedNetworkId)
    );
  }, [competitorStores, selectedNetworkId]);

  const networkFilteredClusters = useMemo(() => {
    if (isAll(selectedNetworkId)) {
      return clusters;
    }
    return clusters.filter(
      (cluster) => String(cluster?.network_id || "") === String(selectedNetworkId)
    );
  }, [clusters, selectedNetworkId]);

  const networkFilteredBanners = useMemo(() => {
    if (isAll(selectedNetworkId)) {
      return banners;
    }
    return banners.filter(
      (banner) => String(banner?.network_id || "") === String(selectedNetworkId)
    );
  }, [banners, selectedNetworkId]);

  const networkBannerFilteredOwnStores = useMemo(() => {
    if (isAll(selectedBannerId)) {
      return networkFilteredOwnStores;
    }
    return networkFilteredOwnStores.filter(
      (store) => String(store?.banner_id || "") === String(selectedBannerId)
    );
  }, [networkFilteredOwnStores, selectedBannerId]);

  const networkBannerFilteredClusters = useMemo(() => {
    if (isAll(selectedBannerId)) {
      return networkFilteredClusters;
    }
    return networkFilteredClusters.filter(
      (cluster) => String(cluster?.banner_id || "") === String(selectedBannerId)
    );
  }, [networkFilteredClusters, selectedBannerId]);

  const selectedCluster = useMemo(
    () =>
      networkBannerFilteredClusters.find(
        (cluster) => String(cluster?.id || "") === String(selectedClusterId)
      ) || null,
    [networkBannerFilteredClusters, selectedClusterId]
  );

  const clusterOwnStoreIds = useMemo(() => {
    if (!selectedCluster || isAll(selectedClusterId)) {
      return null;
    }
    return new Set((selectedCluster?.own_store_ids || []).map((item) => String(item)));
  }, [selectedCluster, selectedClusterId]);

  const clusterCompetitorStoreIds = useMemo(() => {
    if (!selectedCluster || isAll(selectedClusterId)) {
      return null;
    }
    const ids = (selectedCluster?.competitor_groups || []).flatMap((group) => group?.store_ids || []);
    return new Set(ids.map((item) => String(item)));
  }, [selectedCluster, selectedClusterId]);

  const clusterFilteredOwnStores = useMemo(() => {
    if (!clusterOwnStoreIds) {
      return networkBannerFilteredOwnStores;
    }
    return networkBannerFilteredOwnStores.filter((store) =>
      clusterOwnStoreIds.has(String(store?.id || ""))
    );
  }, [networkBannerFilteredOwnStores, clusterOwnStoreIds]);

  const clusterFilteredCompetitorStores = useMemo(() => {
    if (!clusterCompetitorStoreIds) {
      return networkFilteredCompetitorStores;
    }
    return networkFilteredCompetitorStores.filter((store) =>
      clusterCompetitorStoreIds.has(String(store?.id || ""))
    );
  }, [networkFilteredCompetitorStores, clusterCompetitorStoreIds]);

  const networkOptions = useMemo(() => asOptions(networks), [networks]);
  const bannerOptions = useMemo(() => asOptions(networkFilteredBanners), [networkFilteredBanners]);
  const ownStoreOptions = useMemo(() => asOptions(clusterFilteredOwnStores), [clusterFilteredOwnStores]);
  const competitorStoreOptions = useMemo(
    () => asOptions(clusterFilteredCompetitorStores),
    [clusterFilteredCompetitorStores]
  );
  const clusterOptions = useMemo(() => asOptions(networkBannerFilteredClusters), [networkBannerFilteredClusters]);

  useEffect(() => {
    if (isAll(selectedNetworkId)) {
      return;
    }
    const found = networkOptions.some((option) => option.id === selectedNetworkId);
    if (!found) {
      setSelectedNetworkId(ALL_FILTER_VALUE);
    }
  }, [networkOptions, selectedNetworkId]);

  useEffect(() => {
    if (isAll(selectedOwnStoreId)) {
      return;
    }
    const found = ownStoreOptions.some((option) => option.id === selectedOwnStoreId);
    if (!found) {
      setSelectedOwnStoreId(ALL_FILTER_VALUE);
    }
  }, [ownStoreOptions, selectedOwnStoreId]);

  useEffect(() => {
    if (isAll(selectedBannerId)) {
      return;
    }
    const found = bannerOptions.some((option) => option.id === selectedBannerId);
    if (!found) {
      setSelectedBannerId(ALL_FILTER_VALUE);
    }
  }, [bannerOptions, selectedBannerId]);

  useEffect(() => {
    if (isAll(selectedCompetitorStoreId)) {
      return;
    }
    const found = competitorStoreOptions.some(
      (option) => option.id === selectedCompetitorStoreId
    );
    if (!found) {
      setSelectedCompetitorStoreId(ALL_FILTER_VALUE);
    }
  }, [competitorStoreOptions, selectedCompetitorStoreId]);

  useEffect(() => {
    if (isAll(selectedClusterId)) {
      return;
    }
    const found = clusterOptions.some((option) => option.id === selectedClusterId);
    if (!found) {
      setSelectedClusterId(ALL_FILTER_VALUE);
    }
  }, [clusterOptions, selectedClusterId]);

  const visibleOwnStores = useMemo(() => {
    const list = isAll(selectedOwnStoreId)
      ? clusterFilteredOwnStores
      : clusterFilteredOwnStores.filter(
          (store) => String(store?.id || "") === String(selectedOwnStoreId)
        );
    return list.map((store) => ({
      ...store,
      marker_logo_url: resolveOwnStoreLogo(store, bannerById),
      marker_facade_url: resolveStoreFacade(store),
      marker_network_name: String(
        networkById.get(String(store?.network_id || ""))?.name || "-"
      ),
      marker_banner_name: String(
        bannerById.get(String(store?.banner_id || ""))?.name || "-"
      ),
      marker_city: String(store?.address?.city || store?.address_city || "-"),
      marker_state: String(store?.address?.state || store?.address_state || "-")
    }));
  }, [clusterFilteredOwnStores, selectedOwnStoreId, bannerById, networkById]);

  const visibleCompetitorStores = useMemo(() => {
    const list = isAll(selectedCompetitorStoreId)
      ? clusterFilteredCompetitorStores
      : clusterFilteredCompetitorStores.filter(
          (store) => String(store?.id || "") === String(selectedCompetitorStoreId)
        );
    return list.map((store) => ({
      ...store,
      marker_logo_url: resolveCompetitorStoreLogo(store, bannerById),
      marker_facade_url: resolveStoreFacade(store),
      marker_network_name: String(
        networkById.get(String(store?.network_id || ""))?.name || "-"
      ),
      marker_banner_name: String(
        store?.competitor_banner_name ||
          bannerById.get(String(store?.banner_id || ""))?.name ||
          "-"
      ),
      marker_city: String(store?.address?.city || store?.address_city || "-"),
      marker_state: String(store?.address?.state || store?.address_state || "-")
    }));
  }, [clusterFilteredCompetitorStores, selectedCompetitorStoreId, bannerById, networkById]);

  const visibleClusters = useMemo(() => {
    if (isAll(selectedClusterId)) {
      return networkBannerFilteredClusters;
    }
    return networkBannerFilteredClusters.filter(
      (cluster) => String(cluster?.id || "") === String(selectedClusterId)
    );
  }, [networkBannerFilteredClusters, selectedClusterId]);

  const clusterCoverages = useMemo(() => {
    return visibleClusters
      .map((cluster) => {
        const ownIds = (cluster?.own_store_ids || []).map((item) => String(item));
        const competitorIds = (cluster?.competitor_groups || []).flatMap(
          (group) => (group?.store_ids || []).map((item) => String(item))
        );
        const allStoreIds = [...new Set([...ownIds, ...competitorIds])];
        const points = allStoreIds
          .map((storeId) => getStoreLatLng(storeById.get(storeId)))
          .filter(Boolean);

        if (points.length === 0) {
          return null;
        }

        const coverage = buildClusterCoverage(points);
        if (!coverage?.center) {
          return null;
        }

        return {
          id: String(cluster?.id || ""),
          name: String(cluster?.name || "Cluster"),
          lat: Number(coverage.center[0]),
          lon: Number(coverage.center[1]),
          coverage_type: String(coverage.type || "circle"),
          coverage_polygon: Array.isArray(coverage.polygon) ? coverage.polygon : [],
          coverage_radius_meters: Number(coverage.radius_meters || 0),
          coverage_point_count: Number(coverage.point_count || points.length),
          own_count: ownIds.length,
          competitor_count: competitorIds.length
        };
      })
      .filter(Boolean);
  }, [visibleClusters, storeById]);

  const clusterMarkers = clusterCoverages;
  const ownGeoSummary = useMemo(
    () => summarizeGeolocation(visibleOwnStores, getStoreLatLng),
    [visibleOwnStores]
  );
  const competitorGeoSummary = useMemo(
    () => summarizeGeolocation(visibleCompetitorStores, getStoreLatLng),
    [visibleCompetitorStores]
  );
  const clusterGeoSummary = useMemo(
    () => ({
      total: visibleClusters.length,
      withCoverage: clusterCoverages.length,
      withoutCoverage: Math.max(0, visibleClusters.length - clusterCoverages.length)
    }),
    [visibleClusters, clusterCoverages]
  );
  const mapEmptyState = useMemo(() => {
    const ownRenderableCount = ownGeoSummary.withGeo;
    const competitorRenderableCount = competitorGeoSummary.withGeo;
    const clusterMarkerCount = clusterMarkers.length;
    const coverageRenderableCount = clusterCoverages.filter((cluster) => {
      const polygon = Array.isArray(cluster?.coverage_polygon) ? cluster.coverage_polygon : [];
      if (polygon.length >= 3) {
        return true;
      }
      const lat = Number(cluster?.lat);
      const lon = Number(cluster?.lon);
      const radius = Number(cluster?.coverage_radius_meters || 0);
      return Number.isFinite(lat) && Number.isFinite(lon) && Number.isFinite(radius) && radius > 0;
    }).length;
    const hasAnyLayerEnabled =
      Boolean(layerVisibility?.ownStores) ||
      Boolean(layerVisibility?.competitorStores) ||
      Boolean(layerVisibility?.clusters) ||
      Boolean(layerVisibility?.coverage);

    if (!hasAnyLayerEnabled) {
      return {
        visible: true,
        title: "Todas as camadas estao ocultas",
        description: "Ative ao menos uma camada nos filtros para visualizar o mapa."
      };
    }

    const visibleGeometryCount =
      (layerVisibility?.ownStores ? ownRenderableCount : 0) +
      (layerVisibility?.competitorStores ? competitorRenderableCount : 0) +
      (layerVisibility?.clusters ? clusterMarkerCount : 0) +
      (layerVisibility?.coverage ? coverageRenderableCount : 0);

    if (visibleGeometryCount > 0) {
      return { visible: false, title: "", description: "" };
    }

    return {
      visible: true,
      title: "Nenhuma camada com geolocalizacao",
      description: "Os filtros atuais nao retornaram pontos ou areas com coordenadas."
    };
  }, [ownGeoSummary, competitorGeoSummary, clusterMarkers, clusterCoverages, layerVisibility]);

  function toggleLayer(layerKey) {
    setLayerVisibility((previous) => ({
      ...previous,
      [layerKey]: !Boolean(previous?.[layerKey])
    }));
  }

  function clearMapFilters() {
    setSelectedNetworkId(ALL_FILTER_VALUE);
    setSelectedBannerId(ALL_FILTER_VALUE);
    setSelectedOwnStoreId(ALL_FILTER_VALUE);
    setSelectedCompetitorStoreId(ALL_FILTER_VALUE);
    setSelectedClusterId(ALL_FILTER_VALUE);
    setLayerVisibility({
      ownStores: true,
      competitorStores: true,
      clusters: true,
      coverage: true
    });
  }

  if (!hydrationDone) {
    return (
      <main className={"grid min-h-screen place-items-center bg-slate-100 p-6"}>
        <p className={"m-0 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700"}>
          Carregando mapa...
        </p>
      </main>
    );
  }

  if (!activeTenantId) {
    return (
      <main className={"grid min-h-screen place-items-center bg-slate-100 p-6"}>
        <div className={"grid gap-2 rounded-lg border border-slate-200 bg-white p-4"}>
          <strong>Nenhuma conta ativa selecionada.</strong>
          <Link href="/accounts" className={"inline-flex items-center justify-center rounded-lg border border-slate-900 bg-slate-900 px-3 py-2 text-xs text-white no-underline"}>
            Selecionar conta
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className={"relative h-screen w-full overflow-hidden"}>
      <GeolocalizationMapCanvas
        ownStores={visibleOwnStores}
        competitorStores={visibleCompetitorStores}
        clusters={clusterMarkers}
        clusterCoverages={clusterCoverages}
        layerVisibility={layerVisibility}
        emptyState={mapEmptyState}
      />
      <div className={"pointer-events-none absolute inset-0 z-[1300]"}>
        <MapFloatingFilters
          networks={networkOptions}
          banners={bannerOptions}
          ownStores={ownStoreOptions}
          competitorStores={competitorStoreOptions}
          clusters={clusterOptions}
          selectedNetworkId={selectedNetworkId}
          selectedBannerId={selectedBannerId}
          selectedOwnStoreId={selectedOwnStoreId}
          selectedCompetitorStoreId={selectedCompetitorStoreId}
          selectedClusterId={selectedClusterId}
          layerVisibility={layerVisibility}
          onNetworkChange={setSelectedNetworkId}
          onBannerChange={setSelectedBannerId}
          onOwnStoreChange={setSelectedOwnStoreId}
          onCompetitorStoreChange={setSelectedCompetitorStoreId}
          onClusterChange={setSelectedClusterId}
          onToggleOwnStores={() => toggleLayer("ownStores")}
          onToggleCompetitorStores={() => toggleLayer("competitorStores")}
          onToggleClusters={() => toggleLayer("clusters")}
          onToggleCoverage={() => toggleLayer("coverage")}
        />
        <section className={"pointer-events-auto absolute bottom-3 left-3 right-3 z-[1301] rounded-xl border border-slate-200 bg-white/95 px-3 py-2 text-xs text-slate-700 shadow-[0_10px_24px_rgba(15,23,42,0.16)] backdrop-blur-sm"}>
          <div className={"flex flex-wrap items-end justify-between gap-2"}>
            <div className={"grid gap-1"}>
              <strong className={"block text-slate-900"}>{activeTenant?.name || activeTenantId}</strong>
              <span>
                Redes: {networkOptions.length} | Lojas: {visibleOwnStores.length} | Concorrentes: {visibleCompetitorStores.length} | Clusters: {clusterMarkers.length}
              </span>
              <span>
                Geo lojas: {ownGeoSummary.withGeo} com geo, {ownGeoSummary.withoutGeo} sem geo
              </span>
              <span>
                Geo concorrentes: {competitorGeoSummary.withGeo} com geo, {competitorGeoSummary.withoutGeo} sem geo
              </span>
              <span>
                Cobertura clusters: {clusterGeoSummary.withCoverage} com area, {clusterGeoSummary.withoutCoverage} sem area
              </span>
            </div>
            <div className={"flex flex-wrap items-center gap-2"}>
              <button
                type="button"
                onClick={clearMapFilters}
                className={"inline-flex h-[34px] items-center justify-center rounded-lg border border-slate-300 bg-white px-3 text-xs text-slate-900"}
              >
                Limpar filtros
              </button>
              <Link
                href="/dashboard"
                className={"inline-flex h-[34px] items-center justify-center rounded-lg border border-slate-900 bg-slate-900 px-3 text-xs text-white no-underline"}
              >
                Dashboard
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
