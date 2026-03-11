"use client";

import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import { useDomainActions } from "../features/domain/hooks/use-domain-actions";
import { STORE_KINDS } from "../features/domain/models";
import {
  competitorStoresTemplate,
  networksTemplate,
  priceResearchesTemplate,
  retailBannersTemplate,
  ownStoresTemplate,
  tenantsTemplate
} from "../features/domain/templates/dataset-templates";
import { useDomainState } from "../features/domain/state/domain-state";
import {
  selectActiveTenant,
  selectActiveTenantId,
  selectTenants
} from "../features/domain/state/selectors";

function downloadJsonFile(filename, payload) {
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: "application/json"
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function sanitizeName(value) {
  return String(value || "tenant")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9-_]+/g, "-")
    .replace(/-+/g, "-")
    .toLowerCase();
}

function DatasetCard({
  title,
  description,
  disabled,
  onExport,
  onImport,
  onTemplate,
  filePrefix = "dataset"
}) {
  const inputRef = useRef(null);
  const [message, setMessage] = useState(null);

  async function handleExport() {
    setMessage(null);
    try {
      const payload = await onExport();
      const day = new Date().toISOString().slice(0, 10);
      downloadJsonFile(`${filePrefix}-${day}.json`, payload);
      setMessage({ type: "success", text: "Download concluido." });
    } catch (error) {
      setMessage({ type: "error", text: error?.message || "Falha ao exportar JSON." });
    }
  }

  async function handleFile(event) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setMessage(null);

    try {
      const raw = await file.text();
      const parsed = JSON.parse(raw);
      const summary = await onImport(parsed);
      if (summary?.failed) {
        const firstError = summary.errors?.[0];
        setMessage({
          type: "error",
          text:
            `Importacao parcial: ${summary.success}/${summary.total}. ` +
            `Primeiro erro na linha ${Number(firstError?.index ?? 0) + 1}: ${firstError?.message || "erro"}.`
        });
      } else {
        setMessage({
          type: "success",
          text: `Importacao concluida: ${summary?.success ?? 0}/${summary?.total ?? 0}.`
        });
      }
    } catch (error) {
      setMessage({ type: "error", text: error?.message || "Falha ao importar JSON." });
    } finally {
      event.target.value = "";
    }
  }

  async function handleTemplate() {
    setMessage(null);
    try {
      const payload = await onTemplate();
      downloadJsonFile(`${filePrefix}-template.json`, payload);
      setMessage({ type: "success", text: "Template baixado." });
    } catch (error) {
      setMessage({ type: "error", text: error?.message || "Falha ao baixar template." });
    }
  }

  return (
    <section className={"grid gap-2.5 rounded-xl border border-slate-900/10 bg-white/90 p-[14px]"}>
      <h2 className={"m-0 text-lg"}>{title}</h2>
      <p className={"m-0 text-xs opacity-70"}>{description}</p>
      <div className={"flex flex-wrap gap-2"}>
        <button type="button" className={"cursor-pointer rounded-md border-0 bg-slate-800 px-2.5 py-2 text-xs text-white"} disabled={disabled} onClick={handleExport}>
          Download JSON
        </button>
        <button type="button" className={`${"cursor-pointer rounded-md border-0 bg-slate-800 px-2.5 py-2 text-xs text-white"} ${"border border-slate-300 bg-white text-slate-900"}`} onClick={handleTemplate}>
          Baixar template
        </button>
        <button
          type="button"
          className={`${"cursor-pointer rounded-md border-0 bg-slate-800 px-2.5 py-2 text-xs text-white"} ${"border border-slate-300 bg-white text-slate-900"}`}
          disabled={disabled}
          onClick={() => inputRef.current?.click()}
        >
          Upload JSON
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="application/json"
          style={{ display: "none" }}
          onChange={handleFile}
        />
      </div>
      {message ? (
        <p className={message.type === "error" ? "m-0 rounded-lg border border-red-200 bg-red-50 p-2 text-xs text-red-800" : "m-0 rounded-lg border border-green-200 bg-green-50 p-2 text-xs text-green-800"}>{message.text}</p>
      ) : null}
    </section>
  );
}

function DatabaseRuntime() {
  const { state } = useDomainState();
  const {
    setActiveTenant,
    exportTenantsDataset,
    exportNetworksDataset,
    exportRetailBannersDataset,
    exportStoresDataset,
    exportPriceResearchesDataset,
    saveTenantsBatch,
    saveNetworksBatch,
    saveRetailBannersBatch,
    saveStoresBatch,
    savePriceResearchesBatch
  } = useDomainActions();

  const tenants = useMemo(() => selectTenants(state), [state]);
  const activeTenantId = useMemo(() => selectActiveTenantId(state), [state]);
  const activeTenant = useMemo(() => selectActiveTenant(state), [state]);

  const tenantLabel = sanitizeName(activeTenant?.name || activeTenantId || "tenant");
  const demoTenantId = activeTenantId || "tenant_demo_1";
  const demoNetworkId = "network_demo_1";
  const demoBannerId = "banner_demo_1";
  const demoCompetitorStoreId = "store_comp_demo_1";

  return (
    <main className={"min-h-screen p-6 text-slate-900 bg-[radial-gradient(circle_at_12%_10%,rgba(255,208,82,0.18),transparent_32%),radial-gradient(circle_at_85%_90%,rgba(37,99,235,0.16),transparent_40%),linear-gradient(180deg,#f7f7f8_0%,#f0f2f5_100%)]"}>
      <div className={"mx-auto grid max-w-[1440px] gap-4"}>
        <header className={"flex items-center justify-between gap-4 rounded-[14px] bg-white/[0.85] px-5 py-[18px] shadow-[0_10px_20px_rgba(15,23,42,0.08)]"}>
          <div>
            <h1 className={"m-0 text-[30px] tracking-[0.5px]"}>Banco de Dados</h1>
            <p className={"mb-0 mt-1 text-sm [opacity:0.85]"}>
              Upload/download por colecao para carga em lote e manutencao dos dados.
            </p>
            <p className={"mb-0 mt-1 text-sm [opacity:0.85]"}>
              Tenant ativo: <strong>{activeTenant?.name || "nenhum selecionado"}</strong>
            </p>
          </div>
          <div className={"flex flex-wrap items-center gap-2"}>
            <Link href="/dashboard" className={"inline-flex items-center justify-center rounded-lg border border-slate-900 bg-slate-900 px-3 py-2.5 text-[13px] text-white no-underline"}>
              Dashboard
            </Link>
            <Link href="/map" className={"inline-flex items-center justify-center rounded-lg border border-slate-900 bg-slate-900 px-3 py-2.5 text-[13px] text-white no-underline"}>
              Mapa
            </Link>
          </div>
        </header>

        <section className={"grid gap-2.5 rounded-xl border border-slate-900/10 bg-white/90 p-[14px]"}>
          <h2 className={"m-0 text-lg"}>Selecionar Tenant Ativo</h2>
          <p className={"m-0 text-xs opacity-70"}>As colecoes abaixo (exceto tenants) usam o tenant ativo.</p>
          <div className={"grid gap-1 text-xs [&>input]:w-full [&>input]:rounded-md [&>input]:border [&>input]:border-slate-300 [&>input]:bg-white [&>input]:p-2 [&>input]:text-[13px] [&>select]:w-full [&>select]:rounded-md [&>select]:border [&>select]:border-slate-300 [&>select]:bg-white [&>select]:p-2 [&>select]:text-[13px] [&>textarea]:w-full [&>textarea]:min-h-[70px] [&>textarea]:rounded-md [&>textarea]:border [&>textarea]:border-slate-300 [&>textarea]:bg-white [&>textarea]:p-2 [&>textarea]:text-[13px]"}>
            <select
              value={activeTenantId || ""}
              onChange={(e) => setActiveTenant(e.target.value || null)}
            >
              <option value="">Selecione...</option>
              {tenants.map((tenant) => (
                <option key={tenant.id} value={tenant.id}>
                  {tenant.name}
                </option>
              ))}
            </select>
          </div>
        </section>

        <div className={"grid grid-cols-2 gap-[14px] max-[980px]:grid-cols-1"}>
          <DatasetCard
            title="Tenants"
            description="Colecao global de tenants (PF/PJ)."
            disabled={false}
            onExport={() => exportTenantsDataset()}
            onImport={(payload) => saveTenantsBatch(payload)}
            onTemplate={() => tenantsTemplate()}
            filePrefix="tenants"
          />

          <DatasetCard
            title="Redes"
            description="Redes do tenant ativo."
            disabled={!activeTenantId}
            onExport={() => exportNetworksDataset(activeTenantId)}
            onImport={(payload) => saveNetworksBatch(activeTenantId, payload)}
            onTemplate={() => networksTemplate(demoTenantId)}
            filePrefix={`networks-${tenantLabel}`}
          />

          <DatasetCard
            title="Bandeiras"
            description="Bandeiras do tenant ativo."
            disabled={!activeTenantId}
            onExport={() => exportRetailBannersDataset(activeTenantId)}
            onImport={(payload) => saveRetailBannersBatch(activeTenantId, payload)}
            onTemplate={() => retailBannersTemplate(demoTenantId, demoNetworkId)}
            filePrefix={`retail-banners-${tenantLabel}`}
          />

          <DatasetCard
            title="Lojas Proprias"
            description="Lojas do tenant ativo no tipo OWN."
            disabled={!activeTenantId}
            onExport={() => exportStoresDataset(activeTenantId, STORE_KINDS.OWN)}
            onImport={(payload) => saveStoresBatch(activeTenantId, payload, STORE_KINDS.OWN)}
            onTemplate={() => ownStoresTemplate(demoTenantId, demoNetworkId, demoBannerId)}
            filePrefix={`stores-own-${tenantLabel}`}
          />

          <DatasetCard
            title="Lojas Concorrentes"
            description="Lojas do tenant ativo no tipo COMPETITOR."
            disabled={!activeTenantId}
            onExport={() => exportStoresDataset(activeTenantId, STORE_KINDS.COMPETITOR)}
            onImport={(payload) => saveStoresBatch(activeTenantId, payload, STORE_KINDS.COMPETITOR)}
            onTemplate={() => competitorStoresTemplate(demoTenantId, demoNetworkId)}
            filePrefix={`stores-competitor-${tenantLabel}`}
          />

          <DatasetCard
            title="Listas de Pesquisa"
            description="Price researches do tenant ativo."
            disabled={!activeTenantId}
            onExport={() => exportPriceResearchesDataset(activeTenantId)}
            onImport={(payload) => savePriceResearchesBatch(activeTenantId, payload)}
            onTemplate={() =>
              priceResearchesTemplate(demoTenantId, "cluster_demo_1", demoCompetitorStoreId)
            }
            filePrefix={`price-researches-${tenantLabel}`}
          />
        </div>
      </div>
    </main>
  );
}

export default function DatabaseAdminApp() {
  return <DatabaseRuntime />;
}


