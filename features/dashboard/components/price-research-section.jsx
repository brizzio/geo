"use client";

import Link from "next/link";
import SectionCard from "./section-card";

export default function PriceResearchSection({
  tenantId,
  clusters,
  priceResearches,
  onDelete
}) {
  const clusterNameById = Object.fromEntries(clusters.map((cluster) => [String(cluster.id), cluster.name]));

  return (
    <SectionCard
      title="PESQUISAS"
      full
      sectionId="pesquisas"
      hint="Listagem simples de pesquisas. O cadastro e feito em pagina dedicada."
    >
      {!tenantId ? <div className={"rounded-lg border border-dashed border-slate-300 p-2.5 text-xs opacity-75"}>Selecione uma conta ativa para gerenciar pesquisas.</div> : null}

      <div className={"flex flex-wrap gap-2"}>
        <Link href="/researches/new" className={"inline-flex items-center justify-center rounded-lg border border-slate-900 bg-slate-900 px-3 py-2.5 text-[13px] text-white no-underline"}>
          Criar Pesquisa
        </Link>
      </div>

      <div className={"grid gap-1.5"}>
        {priceResearches.length === 0 ? (
          <div className={"rounded-lg border border-dashed border-slate-300 p-2.5 text-xs opacity-75"}>Nenhuma pesquisa cadastrada.</div>
        ) : (
          priceResearches.map((research) => (
            <article key={research.id} className={"grid gap-1.5 rounded-lg border border-slate-200 bg-white p-2"}>
              <div className={"flex items-center justify-between gap-2"}>
                <strong>{research.name}</strong>
                <span className={"inline-flex items-center justify-center rounded-full bg-indigo-100 px-2 py-0.5 text-[11px] text-indigo-900"}>
                  {(research.products || []).length} produtos |{" "}
                  {(research.competitor_store_ids || []).length} concorrentes
                </span>
              </div>
              <small>Cluster: {clusterNameById[String(research.cluster_id)] || "N/A"}</small>
              <small>
                {research.start_date} {research.start_time} ate {research.end_date} {research.end_time}
              </small>
              <div className={"flex flex-wrap gap-2"}>
                <Link href={`/researches/${research.id}/edit`} className={"inline-flex items-center justify-center rounded-lg border border-slate-900 bg-slate-900 px-3 py-2.5 text-[13px] text-white no-underline"}>
                  Editar
                </Link>
                <button
                  type="button"
                  className={`${"cursor-pointer rounded-md border-0 bg-slate-800 px-2.5 py-2 text-xs text-white"} ${"bg-red-700"}`}
                  onClick={() => onDelete(research.id)}
                >
                  Remover
                </button>
              </div>
            </article>
          ))
        )}
      </div>
    </SectionCard>
  );
}

