"use client";

import Link from "next/link";
import { RESEARCH_SERVICE_WEEKDAYS } from "../../domain/models/price-research-model";

const WEEKDAY_NAME_BY_ID = Object.fromEntries(
  RESEARCH_SERVICE_WEEKDAYS.map((item) => [String(item.id), item.name])
);

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

  const weekdays = Array.isArray(research?.recurrence_weekdays)
    ? research.recurrence_weekdays
        .map((weekdayId) => WEEKDAY_NAME_BY_ID[String(weekdayId)] || String(weekdayId))
        .filter(Boolean)
    : [];

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

export default function ResearchServiceDashboardItem({ research, clusterName }) {
  const isSuspended = String(research?.status || "").toUpperCase() === "SUSPENDED";

  return (
    <article className={"grid gap-1.5 rounded-lg border border-slate-200 bg-white p-2"}>
      <div className={"flex items-center justify-between gap-2"}>
        <strong>{research?.name || "Servico sem nome"}</strong>
        <span
          className={
            isSuspended
              ? "inline-flex items-center justify-center rounded-full bg-amber-100 px-2 py-0.5 text-[11px] text-amber-900"
              : "inline-flex items-center justify-center rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] text-emerald-900"
          }
        >
          {isSuspended ? "SUSPENSO" : "ATIVO"}
        </span>
      </div>

      <small>Cluster: {clusterName || "N/A"}</small>
      <small>
        Inicio: {research?.start_date || "-"} | {formatDuration(research)}
      </small>
      <small>{formatRecurrence(research)}</small>
      <small>
        Niveis: {(research?.level_product_lists || []).length} | Produtos: {countProducts(research)}
      </small>

      <div className={"flex flex-wrap gap-2"}>
        <Link
          href={`/researches/${research?.id}/edit`}
          className={
            "inline-flex items-center justify-center rounded-lg border border-slate-900 bg-slate-900 px-3 py-2.5 text-[13px] text-white no-underline"
          }
        >
          Abrir servico
        </Link>
        <Link
          href={`/researches/${research?.id}/tasks`}
          className={
            "inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-[13px] text-slate-900 no-underline"
          }
        >
          Tarefas de pesquisa
        </Link>
        <Link
          href={`/researches/${research?.id}/list`}
          className={
            "inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-[13px] text-slate-900 no-underline"
          }
        >
          Ver lista
        </Link>
      </div>
    </article>
  );
}
