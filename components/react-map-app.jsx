"use client";

import { useMemo, useState } from "react";
import MapLogo from "./ui/map-logo";
import MapControls from "./ui/map-controls";
import MapSidebar from "./ui/map-sidebar";
import MapSearch from "./ui/map-search";
import MapCanvas from "./ui/map-canvas";
import BannerFormModal from "../features/map/components/banner-form-modal";
import HeadquarterFormModal from "../features/map/components/headquarter-form-modal";
import HeadquarterStoreFormModal from "../features/map/components/headquarter-store-form-modal";
import BranchStoreFormModal from "../features/map/components/branch-store-form-modal";
import ConcurrentStoreFormModal from "../features/map/components/concurrent-store-form-modal";
import ClusterFormModal from "../features/map/components/cluster-form-modal";
import { useMapActions } from "../features/map/hooks/use-map-actions";
import { MapStateProvider, useMapState } from "../features/map/state/map-state";
import { selectLayerCount, selectTenantId } from "../features/map/state/selectors";

function ReactMapRuntime() {
  const { state } = useMapState();
  const {
    createBanner,
    createHeadquarter,
    createHeadquarterStore,
    createBranchStore,
    createConcurrentStore,
    createCluster
  } = useMapActions();
  const [bannerFormOpen, setBannerFormOpen] = useState(false);
  const [headquarterFormOpen, setHeadquarterFormOpen] = useState(false);
  const [headquarterStoreFormOpen, setHeadquarterStoreFormOpen] = useState(false);
  const [branchStoreFormOpen, setBranchStoreFormOpen] = useState(false);
  const [concurrentStoreFormOpen, setConcurrentStoreFormOpen] = useState(false);
  const [clusterFormOpen, setClusterFormOpen] = useState(false);
  const [savingBanner, setSavingBanner] = useState(false);
  const [savingHeadquarter, setSavingHeadquarter] = useState(false);
  const [savingHeadquarterStore, setSavingHeadquarterStore] = useState(false);
  const [savingBranchStore, setSavingBranchStore] = useState(false);
  const [savingConcurrentStore, setSavingConcurrentStore] = useState(false);
  const [savingCluster, setSavingCluster] = useState(false);

  const tenantId = useMemo(() => selectTenantId(state), [state]);
  const layerCount = useMemo(() => selectLayerCount(state), [state]);

  async function handleSaveBanner(values) {
    setSavingBanner(true);
    try {
      await createBanner(values, tenantId);
      setBannerFormOpen(false);
    } finally {
      setSavingBanner(false);
    }
  }

  async function handleSaveHeadquarter(values) {
    setSavingHeadquarter(true);
    try {
      await createHeadquarter(values, tenantId);
      setHeadquarterFormOpen(false);
    } finally {
      setSavingHeadquarter(false);
    }
  }

  async function handleSaveHeadquarterStore(values) {
    setSavingHeadquarterStore(true);
    try {
      await createHeadquarterStore(values, tenantId);
      setHeadquarterStoreFormOpen(false);
    } finally {
      setSavingHeadquarterStore(false);
    }
  }

  async function handleSaveBranchStore(values) {
    setSavingBranchStore(true);
    try {
      await createBranchStore(values, tenantId);
      setBranchStoreFormOpen(false);
    } finally {
      setSavingBranchStore(false);
    }
  }

  async function handleSaveConcurrentStore(values) {
    setSavingConcurrentStore(true);
    try {
      await createConcurrentStore(values, tenantId);
      setConcurrentStoreFormOpen(false);
    } finally {
      setSavingConcurrentStore(false);
    }
  }

  async function handleSaveCluster(values) {
    setSavingCluster(true);
    try {
      await createCluster(values, tenantId);
      setClusterFormOpen(false);
    } finally {
      setSavingCluster(false);
    }
  }

  return (
    <main style={{ width: "100%", height: "100vh", position: "relative" }}>
      <MapCanvas />
      <MapLogo />
      <MapSearch />
      <MapSidebar
        tenantId={tenantId}
        layerCount={layerCount}
        onCreateCluster={() => setClusterFormOpen(true)}
        onCreateBanner={() => setBannerFormOpen(true)}
        onCreateHeadquarter={() => setHeadquarterFormOpen(true)}
        onCreateHeadquarterStore={() => setHeadquarterStoreFormOpen(true)}
        onCreateBranchStore={() => setBranchStoreFormOpen(true)}
        onCreateConcurrentStore={() => setConcurrentStoreFormOpen(true)}
        onOpenClusters={() => setClusterFormOpen(true)}
      />
      <MapControls
        onCreateCluster={() => setClusterFormOpen(true)}
        onCreateBanner={() => setBannerFormOpen(true)}
        onCreateHeadquarter={() => setHeadquarterFormOpen(true)}
        onCreateHeadquarterStore={() => setHeadquarterStoreFormOpen(true)}
        onCreateBranchStore={() => setBranchStoreFormOpen(true)}
        onCreateConcurrentStore={() => setConcurrentStoreFormOpen(true)}
        onOpenClusters={() => setClusterFormOpen(true)}
      />
      <BannerFormModal
        open={bannerFormOpen}
        saving={savingBanner}
        onClose={() => setBannerFormOpen(false)}
        onSave={handleSaveBanner}
      />
      <HeadquarterFormModal
        open={headquarterFormOpen}
        saving={savingHeadquarter}
        onClose={() => setHeadquarterFormOpen(false)}
        onSave={handleSaveHeadquarter}
      />
      <HeadquarterStoreFormModal
        open={headquarterStoreFormOpen}
        saving={savingHeadquarterStore}
        onClose={() => setHeadquarterStoreFormOpen(false)}
        onSave={handleSaveHeadquarterStore}
        tenantId={tenantId}
      />
      <BranchStoreFormModal
        open={branchStoreFormOpen}
        saving={savingBranchStore}
        onClose={() => setBranchStoreFormOpen(false)}
        onSave={handleSaveBranchStore}
        tenantId={tenantId}
      />
      <ConcurrentStoreFormModal
        open={concurrentStoreFormOpen}
        saving={savingConcurrentStore}
        onClose={() => setConcurrentStoreFormOpen(false)}
        onSave={handleSaveConcurrentStore}
        tenantId={tenantId}
      />
      <ClusterFormModal
        open={clusterFormOpen}
        saving={savingCluster}
        onClose={() => setClusterFormOpen(false)}
        onSave={handleSaveCluster}
      />
    </main>
  );
}

export default function ReactMapApp() {
  return (
    <MapStateProvider>
      <ReactMapRuntime />
    </MapStateProvider>
  );
}
