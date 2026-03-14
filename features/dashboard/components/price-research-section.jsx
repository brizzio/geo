"use client";

import Link from "next/link";
import SectionCard from "./section-card";
import PriceResearchCard from "./price-research-card";

export default function PriceResearchSection({
  tenantId,
  clusters,
  priceResearches,
  onDelete
}) {
  const clusterNameById = Object.fromEntries(
    clusters.map((cluster) => [String(cluster.id), cluster.name])
  );

  return (
    <SectionCard
      title="SERVICOS DE PESQUISA"
      full
      sectionId="pesquisas"
      hint="Servicos com inicio, prazo, recorrencia, status e itens por nivel."
    >
      {!tenantId ? (
        <div className={"rounded-lg border border-dashed border-slate-300 p-2.5 text-xs opacity-75"}>
          Selecione uma conta ativa para gerenciar servicos.
        </div>
      ) : null}

      <div className={"flex flex-wrap gap-2"}>
        <Link href="/researches/new" className={"inline-flex items-center justify-center rounded-lg border border-slate-900 bg-slate-900 px-3 py-2.5 text-[13px] text-white no-underline"}>
          Criar Servico
        </Link>
      </div>

      <div className={"flex w-full flex-col gap-2"}>
        {priceResearches.length === 0 ? (
          <div className={"rounded-lg border border-dashed border-slate-300 p-2.5 text-xs opacity-75"}>
            Nenhum servico cadastrado.
          </div>
        ) : (
          priceResearches.map((research) => (
            <PriceResearchCard
              key={research.id}
              research={research}
              clusterName={clusterNameById[String(research.cluster_id)] || "N/A"}
              onDelete={onDelete}
            />
          ))
        )}
      </div>
    </SectionCard>
  );
}
