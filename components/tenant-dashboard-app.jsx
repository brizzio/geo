"use client";

import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import { useDomainActions } from "../features/domain/hooks/use-domain-actions";
import { STORE_KINDS } from "../features/domain/models";
import { useDomainState } from "../features/domain/state/domain-state";
import {
  selectActiveTenant,
  selectActiveTenantId,
  selectDashboardTotals,
  selectStoresByKind
} from "../features/domain/state/selectors";

function DashboardRuntime() {
  const { state } = useDomainState();
  const {
    exportTenantSnapshot,
    importTenantSnapshot
  } = useDomainActions();
  const fileInputRef = useRef(null);
  const [backupMessage, setBackupMessage] = useState(null);

  const activeTenantId = useMemo(() => selectActiveTenantId(state), [state]);
  const activeTenant = useMemo(() => selectActiveTenant(state), [state]);
  const totals = useMemo(
    () => (activeTenantId ? selectDashboardTotals(state, activeTenantId) : null),
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
  const statCards = useMemo(
    () => [
      { label: "REDES", value: totals?.networks ?? 0, href: "/networks" },
      { label: "BANDEIRAS", value: totals?.retailBanners ?? 0, href: "/banners" },
      { label: "LOJAS PROPRIAS", value: ownStores.length, href: "/stores" },
      { label: "LOJAS CONCORRENTES", value: competitorStores.length, href: "/competitors" },
      { label: "CLUSTERS", value: totals?.clusters ?? 0, href: "/clusters" },
      { label: "PESQUISAS", value: totals?.priceResearches ?? 0, href: "/researches" },
      { label: "PRODUTOS", value: totals?.products ?? 0, href: "/products" }
    ],
    [totals, ownStores.length, competitorStores.length]
  );

  function buildDownloadName(tenantName) {
    const base = (tenantName || "tenant")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9-_]+/g, "-")
      .replace(/-+/g, "-")
      .toLowerCase();
    const day = new Date().toISOString().slice(0, 10);
    return `tenant-backup-${base || "tenant"}-${day}.json`;
  }

  function handleExportJson() {
    setBackupMessage(null);
    try {
      const snapshot = exportTenantSnapshot(activeTenantId);
      const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = buildDownloadName(snapshot?.tenant?.name);
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      setBackupMessage({ type: "success", text: "Backup exportado com sucesso." });
    } catch (err) {
      setBackupMessage({ type: "error", text: err?.message || "Falha ao exportar backup." });
    }
  }

  async function handleImportJson(event) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setBackupMessage(null);

    try {
      const raw = await file.text();
      const parsed = JSON.parse(raw);
      const result = importTenantSnapshot(parsed);
      setBackupMessage({
        type: "success",
        text:
          `Backup importado. Redes: ${result.counts.networks}, Bandeiras: ${result.counts.retailBanners}, ` +
          `Lojas: ${result.counts.stores}, Clusters: ${result.counts.clusters}, Pesquisas: ${result.counts.priceResearches}, Produtos: ${result.counts.products || 0}.`
      });
    } catch (err) {
      setBackupMessage({ type: "error", text: err?.message || "Falha ao importar backup." });
    } finally {
      event.target.value = "";
    }
  }

  return (
    <main className={"min-h-screen p-6 text-slate-900 bg-[radial-gradient(circle_at_12%_10%,rgba(255,208,82,0.18),transparent_32%),radial-gradient(circle_at_85%_90%,rgba(37,99,235,0.16),transparent_40%),linear-gradient(180deg,#f7f7f8_0%,#f0f2f5_100%)]"}>
      <div className={"mx-auto grid max-w-[1440px] gap-4"}>
        <header className={"flex items-center justify-between gap-4 rounded-[14px] bg-white/[0.85] px-5 py-[18px] shadow-[0_10px_20px_rgba(15,23,42,0.08)]"}>
          <div>
            <h1 className={"m-0 text-[30px] tracking-[0.5px]"}>DASHBOARD</h1>
            <p className={"mb-0 mt-1 text-sm [opacity:0.85]"}>
              Estrutura multi-tenant para redes, bandeiras, lojas, clusters e eventos de price research.
            </p>
            <p className={"mb-0 mt-1 text-sm [opacity:0.85]"}>
              CONTA ativa: <strong>{activeTenant?.name || "nenhuma selecionada"}</strong>
            </p>
          </div>
          <div className={"flex flex-wrap items-center gap-2"}>
            <button
              type="button"
              className={`${"cursor-pointer rounded-md border-0 bg-slate-800 px-2.5 py-2 text-xs text-white"} ${"border border-slate-300 bg-white text-slate-900"}`}
              disabled={!activeTenantId}
              onClick={handleExportJson}
            >
              Exportar JSON
            </button>
            <button
              type="button"
              className={`${"cursor-pointer rounded-md border-0 bg-slate-800 px-2.5 py-2 text-xs text-white"} ${"border border-slate-300 bg-white text-slate-900"}`}
              onClick={() => fileInputRef.current?.click()}
            >
              Importar JSON
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/json"
              onChange={handleImportJson}
              style={{ display: "none" }}
            />
            <Link href="/map" className={"inline-flex items-center justify-center rounded-lg border border-slate-900 bg-slate-900 px-3 py-2.5 text-[13px] text-white no-underline"}>
              Abrir mapa (/map)
            </Link>
            <Link href="/database" className={"inline-flex items-center justify-center rounded-lg border border-slate-900 bg-slate-900 px-3 py-2.5 text-[13px] text-white no-underline"}>
              Banco de dados
            </Link>
          </div>
        </header>

        {backupMessage ? (
          <p className={backupMessage.type === "error" ? "m-0 rounded-lg border border-red-200 bg-red-50 p-2 text-xs text-red-800" : "m-0 rounded-lg border border-green-200 bg-green-50 p-2 text-xs text-green-800"}>
            {backupMessage.text}
          </p>
        ) : null}

        {totals ? (
          <section className={"grid w-full gap-3 [grid-template-columns:repeat(auto-fit,minmax(170px,1fr))]"}>
            {statCards.map((card) => (
              <Link key={card.label} href={card.href} className={"group text-inherit no-underline"}>
                <article className={"rounded-xl bg-white p-3 shadow-[0_8px_16px_rgba(15,23,42,0.07)] transition group-hover:-translate-y-px group-hover:shadow-[0_10px_18px_rgba(15,23,42,0.12)]"}>
                  <div className={"text-[11px] tracking-[0.4px] opacity-75"}>{card.label}</div>
                  <div className={"mt-2 text-2xl"}>{card.value}</div>
                </article>
              </Link>
            ))}
          </section>
        ) : null}
      </div>
    </main>
  );
}

export default function TenantDashboardApp() {
  return <DashboardRuntime />;
}

