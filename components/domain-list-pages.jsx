"use client";

import Link from "next/link";
import { useMemo } from "react";
import TenantSection from "../features/dashboard/components/tenant-section";
import NetworkSection from "../features/dashboard/components/network-section";
import BannerSection from "../features/dashboard/components/banner-section";
import StoreSection from "../features/dashboard/components/store-section";
import CompetitorSection from "../features/dashboard/components/competitor-section";
import ClusterSection from "../features/dashboard/components/cluster-section";
import PriceResearchSection from "../features/dashboard/components/price-research-section";
import ProductSection from "../features/dashboard/components/product-section";
import { useDomainActions } from "../features/domain/hooks/use-domain-actions";
import { STORE_KINDS } from "../features/domain/models";
import { useDomainState } from "../features/domain/state/domain-state";
import {
  selectActiveTenant,
  selectActiveTenantId,
  selectBannersByTenant,
  selectClustersByTenant,
  selectNetworksByTenant,
  selectProductsByTenant,
  selectPriceResearchesByTenant,
  selectStoresByKind,
  selectStoresByTenant,
  selectTenants
} from "../features/domain/state/selectors";

function SectionPageShell({ title, description, children }) {
  return (
    <main className={"min-h-screen p-6 text-slate-900 bg-[radial-gradient(circle_at_12%_10%,rgba(255,208,82,0.18),transparent_32%),radial-gradient(circle_at_85%_90%,rgba(37,99,235,0.16),transparent_40%),linear-gradient(180deg,#f7f7f8_0%,#f0f2f5_100%)]"}>
      <div className={"mx-auto grid max-w-[1440px] gap-4"}>
        <header className={"flex items-center justify-between gap-4 rounded-[14px] bg-white/[0.85] px-5 py-[18px] shadow-[0_10px_20px_rgba(15,23,42,0.08)]"}>
          <div>
            <h1 className={"m-0 text-[30px] tracking-[0.5px]"}>{title}</h1>
            <p className={"mb-0 mt-1 text-sm [opacity:0.85]"}>{description}</p>
          </div>
          <div className={"flex flex-wrap items-center gap-2"}>
            <Link href="/dashboard" className={"inline-flex items-center justify-center rounded-lg border border-slate-900 bg-slate-900 px-3 py-2.5 text-[13px] text-white no-underline"}>
              Dashboard
            </Link>
            <Link href="/map" className={"inline-flex items-center justify-center rounded-lg border border-slate-900 bg-slate-900 px-3 py-2.5 text-[13px] text-white no-underline"}>
              Mapa
            </Link>
            <Link href="/database" className={"inline-flex items-center justify-center rounded-lg border border-slate-900 bg-slate-900 px-3 py-2.5 text-[13px] text-white no-underline"}>
              Banco de dados
            </Link>
          </div>
        </header>
        {children}
      </div>
    </main>
  );
}

function useDomainCollections() {
  const { state } = useDomainState();
  const actions = useDomainActions();

  const tenants = useMemo(() => selectTenants(state), [state]);
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
  const ownStores = useMemo(
    () => (activeTenantId ? selectStoresByKind(state, activeTenantId, STORE_KINDS.OWN) : []),
    [state, activeTenantId]
  );
  const competitorStores = useMemo(
    () => (activeTenantId ? selectStoresByKind(state, activeTenantId, STORE_KINDS.COMPETITOR) : []),
    [state, activeTenantId]
  );
  const clusters = useMemo(
    () => (activeTenantId ? selectClustersByTenant(state, activeTenantId) : []),
    [state, activeTenantId]
  );
  const priceResearches = useMemo(
    () => (activeTenantId ? selectPriceResearchesByTenant(state, activeTenantId) : []),
    [state, activeTenantId]
  );
  const products = useMemo(
    () => (activeTenantId ? selectProductsByTenant(state, activeTenantId) : []),
    [state, activeTenantId]
  );

  return {
    actions,
    activeTenant,
    activeTenantId,
    tenants,
    networks,
    banners,
    stores,
    ownStores,
    competitorStores,
    clusters,
    priceResearches,
    products
  };
}

export function AccountsListApp() {
  const { actions, activeTenant, activeTenantId, tenants } = useDomainCollections();
  const { setActiveTenant, saveTenantsBatch, removeTenant } = actions;

  return (
    <SectionPageShell
      title="CONTA"
      description={`CONTA ativa: ${activeTenant?.name || "nenhuma selecionada"}`}
    >
      <TenantSection
        tenants={tenants}
        activeTenantId={activeTenantId}
        onDelete={removeTenant}
        onActivate={setActiveTenant}
        onBulkCreate={(payload) => saveTenantsBatch(payload)}
      />
    </SectionPageShell>
  );
}

export function NetworksListApp() {
  const { actions, activeTenant, activeTenantId, networks } = useDomainCollections();
  const { saveNetworksBatch, removeNetwork } = actions;

  return (
    <SectionPageShell
      title="REDES"
      description={`CONTA ativa: ${activeTenant?.name || "nenhuma selecionada"}`}
    >
      <NetworkSection
        tenantId={activeTenantId}
        networks={networks}
        onDelete={removeNetwork}
        onBulkCreate={(payload) => saveNetworksBatch(activeTenantId, payload)}
      />
    </SectionPageShell>
  );
}

export function BannersListApp() {
  const { actions, activeTenant, activeTenantId, networks, banners } = useDomainCollections();
  const { saveRetailBannersBatch, removeRetailBanner } = actions;

  return (
    <SectionPageShell
      title="BANDEIRAS"
      description={`CONTA ativa: ${activeTenant?.name || "nenhuma selecionada"}`}
    >
      <BannerSection
        tenantId={activeTenantId}
        networks={networks}
        banners={banners}
        onDelete={removeRetailBanner}
        onBulkCreate={(payload) => saveRetailBannersBatch(activeTenantId, payload)}
      />
    </SectionPageShell>
  );
}

export function StoresListApp() {
  const { actions, activeTenant, activeTenantId, networks, banners, stores } = useDomainCollections();
  const { saveStoresBatch, removeStore } = actions;

  return (
    <SectionPageShell
      title="LOJAS"
      description={`CONTA ativa: ${activeTenant?.name || "nenhuma selecionada"}`}
    >
      <StoreSection
        tenantId={activeTenantId}
        networks={networks}
        banners={banners}
        stores={stores}
        onDelete={removeStore}
        onBulkCreateOwn={(payload) => saveStoresBatch(activeTenantId, payload, STORE_KINDS.OWN)}
        onBulkCreateCompetitor={(payload) =>
          saveStoresBatch(activeTenantId, payload, STORE_KINDS.COMPETITOR)
        }
      />
    </SectionPageShell>
  );
}

export function CompetitorsListApp() {
  const { actions, activeTenant, activeTenantId, networks, banners, competitorStores } = useDomainCollections();
  const { saveStoresBatch, removeStore } = actions;

  return (
    <SectionPageShell
      title="CONCORRENTES"
      description={`CONTA ativa: ${activeTenant?.name || "nenhuma selecionada"}`}
    >
      <CompetitorSection
        tenantId={activeTenantId}
        networks={networks}
        banners={banners}
        stores={competitorStores}
        onDelete={removeStore}
        onBulkCreate={(payload) => saveStoresBatch(activeTenantId, payload, STORE_KINDS.COMPETITOR)}
      />
    </SectionPageShell>
  );
}

export function ClustersListApp() {
  const { actions, activeTenant, activeTenantId, networks, banners, clusters } = useDomainCollections();
  const { removeCluster } = actions;

  return (
    <SectionPageShell
      title="CLUSTERS"
      description={`CONTA ativa: ${activeTenant?.name || "nenhuma selecionada"}`}
    >
      <ClusterSection
        tenantId={activeTenantId}
        networks={networks}
        banners={banners}
        clusters={clusters}
        onDelete={removeCluster}
      />
    </SectionPageShell>
  );
}

export function ResearchesListApp() {
  const { actions, activeTenant, activeTenantId, clusters, priceResearches } = useDomainCollections();
  const { removePriceResearch } = actions;

  return (
    <SectionPageShell
      title="PESQUISAS"
      description={`CONTA ativa: ${activeTenant?.name || "nenhuma selecionada"}`}
    >
      <PriceResearchSection
        tenantId={activeTenantId}
        clusters={clusters}
        priceResearches={priceResearches}
        onDelete={removePriceResearch}
      />
    </SectionPageShell>
  );
}

export function ProductsListApp() {
  const { actions, activeTenant, activeTenantId, products } = useDomainCollections();
  const { removeProduct } = actions;

  return (
    <SectionPageShell
      title="PRODUTOS"
      description={`CONTA ativa: ${activeTenant?.name || "nenhuma selecionada"}`}
    >
      <ProductSection
        tenantId={activeTenantId}
        products={products}
        onDelete={removeProduct}
      />
    </SectionPageShell>
  );
}


