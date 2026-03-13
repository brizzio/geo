"use client";

import Link from "next/link";
import SectionCard from "./section-card";

function formatDuration(research) {
  if (research?.is_duration_indefinite) {
    return "Prazo indeterminado";
  }
  const durationDays = Number.parseInt(research?.duration_days, 10);
  if (!Number.isFinite(durationDays) || durationDays <= 0) {
    return "Prazo nao definido";
  }
  return `${durationDays} dia(s)`;
}

function formatRecurrence(research) {
  if (!research?.recurrence_enabled) {
    return "Sem recorrencia";
  }
  const weekdays = Array.isArray(research?.recurrence_weekdays) ? research.recurrence_weekdays : [];
  if (weekdays.length === 0) {
    return "Recorrente (dias nao definidos)";
  }
  return `Recorrente: ${weekdays.join(", ")}`;
}

function countProducts(research) {
  const ids = [
    ...(research?.default_product_ids || []),
    ...(research?.level_product_lists || []).flatMap((entry) => entry?.product_ids || [])
  ].map((value) => String(value || ""));

  return new Set(ids.filter(Boolean)).size;
}

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

      <div className={"grid gap-1.5"}>
        {priceResearches.length === 0 ? (
          <div className={"rounded-lg border border-dashed border-slate-300 p-2.5 text-xs opacity-75"}>
            Nenhum servico cadastrado.
          </div>
        ) : (
          priceResearches.map((research) => (
            <article key={research.id} className={"grid gap-1.5 rounded-lg border border-slate-200 bg-white p-2"}>
              <div className={"flex items-center justify-between gap-2"}>
                <strong>{research.name}</strong>
                <span className={"inline-flex items-center justify-center rounded-full bg-indigo-100 px-2 py-0.5 text-[11px] text-indigo-900"}>
                  {research.status === "SUSPENDED" ? "SUSPENSO" : "ATIVO"}
                </span>
              </div>
              <small>Cluster: {clusterNameById[String(research.cluster_id)] || "N/A"}</small>
              <small>
                Inicio: {research.start_date || "-"} | {formatDuration(research)}
              </small>
              <small>{formatRecurrence(research)}</small>
              <small>
                Niveis: {(research.level_product_lists || []).length} | Produtos: {countProducts(research)}
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
