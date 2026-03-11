"use client";

import Link from "next/link";
import SectionCard from "./section-card";

export default function ClusterSection({
  tenantId,
  networks,
  banners,
  clusters,
  onDelete
}) {
  const networkName = Object.fromEntries(networks.map((item) => [String(item.id), item.name]));
  const bannerName = Object.fromEntries(banners.map((item) => [String(item.id), item.name]));

  return (
    <SectionCard
      title="CLUSTERS"
      full
      sectionId="clusters"
      hint="Listagem simples de clusters. Cadastro e niveis de concorrencia sao gerenciados na pagina dedicada."
    >
      {!tenantId ? <div className={"rounded-lg border border-dashed border-slate-300 p-2.5 text-xs opacity-75"}>Selecione uma conta ativa para gerenciar clusters.</div> : null}

      <div className={"flex flex-wrap gap-2"}>
        <Link href="/clusters/new" className={"inline-flex items-center justify-center rounded-lg border border-slate-900 bg-slate-900 px-3 py-2.5 text-[13px] text-white no-underline"}>
          Criar Cluster
        </Link>
      </div>

      <div className={"grid gap-1.5"}>
        {clusters.length === 0 ? (
          <div className={"rounded-lg border border-dashed border-slate-300 p-2.5 text-xs opacity-75"}>Nenhum cluster cadastrado.</div>
        ) : (
          clusters.map((cluster) => {
            const levelName = Object.fromEntries(
              (cluster.levels || []).map((item) => [String(item.id), item.name])
            );
            const totalCompetitors = (cluster.competitor_groups || []).reduce(
              (acc, group) => acc + (group.store_ids || []).length,
              0
            );
            const totalLevels = (cluster.levels || []).length;

            return (
              <article key={cluster.id} className={"grid gap-1.5 rounded-lg border border-slate-200 bg-white p-2"}>
                <div className={"flex items-center justify-between gap-2"}>
                  <strong>{cluster.name}</strong>
                  <span className={"inline-flex items-center justify-center rounded-full bg-indigo-100 px-2 py-0.5 text-[11px] text-indigo-900"}>
                    {cluster.own_store_ids?.length || 0} proprias | {totalCompetitors} concorrentes |{" "}
                    {totalLevels} niveis
                  </span>
                </div>
                <small>
                  Rede: {networkName[String(cluster.network_id)] || "N/A"} | Bandeira: {bannerName[String(cluster.banner_id)] || "N/A"}
                </small>
                <div className={"flex flex-wrap gap-1.5"}>
                  {(cluster.competitor_groups || []).map((group) => (
                    <span key={`${cluster.id}_${group.level_id}`} className={"rounded-full border border-slate-300 px-2 py-0.5 text-[11px]"}>
                      {levelName[String(group.level_id)] || "Nivel"}: {group.store_ids?.length || 0}
                    </span>
                  ))}
                </div>
                <div className={"flex flex-wrap gap-2"}>
                  <Link href={`/clusters/${cluster.id}/edit`} className={"inline-flex items-center justify-center rounded-lg border border-slate-900 bg-slate-900 px-3 py-2.5 text-[13px] text-white no-underline"}>
                    Editar
                  </Link>
                  <button
                    type="button"
                    className={`${"cursor-pointer rounded-md border-0 bg-slate-800 px-2.5 py-2 text-xs text-white"} ${"bg-red-700"}`}
                    onClick={() => onDelete(cluster.id)}
                  >
                    Remover
                  </button>
                </div>
              </article>
            );
          })
        )}
      </div>
    </SectionCard>
  );
}

