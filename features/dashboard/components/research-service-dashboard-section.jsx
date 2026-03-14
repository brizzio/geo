"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { RESEARCH_SERVICE_STATUSES } from "../../domain/models/price-research-model";
import SectionCard from "./section-card";
import ResearchServiceDashboardItem from "./research-service-dashboard-item";

const PAGE_SIZE = 6;
const STATUS_FILTERS = {
  ALL: "ALL",
  ACTIVE: RESEARCH_SERVICE_STATUSES.ACTIVE,
  SUSPENDED: RESEARCH_SERVICE_STATUSES.SUSPENDED
};
const DATE_FILTERS = {
  ALL: "ALL",
  LAST_30: "LAST_30",
  LAST_90: "LAST_90",
  CURRENT_YEAR: "CURRENT_YEAR"
};
const SORT_OPTIONS = {
  UPDATED_DESC: "UPDATED_DESC",
  UPDATED_ASC: "UPDATED_ASC",
  START_DATE_DESC: "START_DATE_DESC",
  NAME_ASC: "NAME_ASC"
};

const INPUT_CLASS =
  "w-full rounded-md border border-slate-300 bg-white p-2 text-[13px]";

function parseDateValue(value) {
  const raw = String(value || "").trim();
  if (!raw) {
    return null;
  }

  const normalized = /^\d{4}-\d{2}-\d{2}$/.test(raw) ? `${raw}T00:00:00` : raw;
  const parsed = Date.parse(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function normalizeSearchText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function resolveSortTimestamp(research) {
  return (
    parseDateValue(research?.updated_at) ||
    parseDateValue(research?.created_at) ||
    parseDateValue(research?.start_date) ||
    0
  );
}

function sortResearches(items, sortBy) {
  return [...items].sort((a, b) => {
    if (sortBy === SORT_OPTIONS.NAME_ASC) {
      return String(a?.name || "").localeCompare(String(b?.name || ""));
    }

    if (sortBy === SORT_OPTIONS.START_DATE_DESC) {
      const dateA = parseDateValue(a?.start_date) || 0;
      const dateB = parseDateValue(b?.start_date) || 0;
      return dateB - dateA;
    }

    const timestampA = resolveSortTimestamp(a);
    const timestampB = resolveSortTimestamp(b);
    return sortBy === SORT_OPTIONS.UPDATED_ASC ? timestampA - timestampB : timestampB - timestampA;
  });
}

function matchStatusFilter(research, statusFilter) {
  if (statusFilter === STATUS_FILTERS.ALL) {
    return true;
  }
  return String(research?.status || "").toUpperCase() === statusFilter;
}

function matchDateFilter(research, dateFilter) {
  if (dateFilter === DATE_FILTERS.ALL) {
    return true;
  }

  const startTimestamp = parseDateValue(research?.start_date);
  if (!startTimestamp) {
    return false;
  }

  const now = new Date();
  const nowTimestamp = now.getTime();

  if (dateFilter === DATE_FILTERS.CURRENT_YEAR) {
    return new Date(startTimestamp).getFullYear() === now.getFullYear();
  }

  const daysToSubtract = dateFilter === DATE_FILTERS.LAST_30 ? 30 : 90;
  const threshold = new Date(now.getFullYear(), now.getMonth(), now.getDate() - daysToSubtract).getTime();
  return startTimestamp >= threshold && startTimestamp <= nowTimestamp;
}

export default function ResearchServiceDashboardSection({
  tenantId,
  clusters,
  priceResearches
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState(STATUS_FILTERS.ALL);
  const [dateFilter, setDateFilter] = useState(DATE_FILTERS.ALL);
  const [sortBy, setSortBy] = useState(SORT_OPTIONS.UPDATED_DESC);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);

    return () => window.clearTimeout(timeoutId);
  }, [searchTerm]);

  const clusterNameById = useMemo(
    () => Object.fromEntries((clusters || []).map((cluster) => [String(cluster.id), cluster.name])),
    [clusters]
  );
  const filteredResearches = useMemo(() => {
    const source = priceResearches || [];
    const normalizedSearchTerm = normalizeSearchText(debouncedSearchTerm);
    const filtered = source.filter(
      (research) => {
        const matchesName =
          !normalizedSearchTerm ||
          normalizeSearchText(research?.name).includes(normalizedSearchTerm);

        return (
          matchesName &&
          matchStatusFilter(research, statusFilter) &&
          matchDateFilter(research, dateFilter)
        );
      }
    );
    return sortResearches(filtered, sortBy);
  }, [priceResearches, debouncedSearchTerm, statusFilter, dateFilter, sortBy]);

  const visibleResearches = useMemo(
    () => filteredResearches.slice(0, visibleCount),
    [filteredResearches, visibleCount]
  );
  const hasMore = visibleCount < filteredResearches.length;

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [tenantId, debouncedSearchTerm, statusFilter, dateFilter, sortBy, priceResearches]);

  return (
    <SectionCard
      title="SERVICOS DE PESQUISA"
      full
      sectionId="dashboard-servicos"
      hint="Servicos do tenant ativo para acompanhamento rapido."
    >
      {!tenantId ? (
        <div className={"rounded-lg border border-dashed border-slate-300 p-2.5 text-xs opacity-75"}>
          Selecione uma conta ativa para visualizar os servicos.
        </div>
      ) : null}

      <div className={"flex flex-wrap gap-2"}>
        <Link
          href="/researches/new"
          className={
            "inline-flex items-center justify-center rounded-lg border border-slate-900 bg-slate-900 px-3 py-2.5 text-[13px] text-white no-underline"
          }
        >
          Criar servico
        </Link>
        <Link
          href="/researches"
          className={
            "inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-[13px] text-slate-900 no-underline"
          }
        >
          Ver todos
        </Link>
      </div>

      <div className={"grid gap-2 [grid-template-columns:repeat(auto-fit,minmax(220px,1fr))]"}>
        <label className={"grid gap-1 text-xs"}>
          <span>Buscar por nome</span>
          <input
            type="text"
            className={INPUT_CLASS}
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Ex: UHT, Leite, Semanal..."
          />
        </label>

        <label className={"grid gap-1 text-xs"}>
          <span>Status</span>
          <select
            className={INPUT_CLASS}
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
          >
            <option value={STATUS_FILTERS.ALL}>Todos</option>
            <option value={STATUS_FILTERS.ACTIVE}>Ativos</option>
            <option value={STATUS_FILTERS.SUSPENDED}>Suspensos</option>
          </select>
        </label>

        <label className={"grid gap-1 text-xs"}>
          <span>Periodo (inicio)</span>
          <select
            className={INPUT_CLASS}
            value={dateFilter}
            onChange={(event) => setDateFilter(event.target.value)}
          >
            <option value={DATE_FILTERS.ALL}>Qualquer data</option>
            <option value={DATE_FILTERS.LAST_30}>Ultimos 30 dias</option>
            <option value={DATE_FILTERS.LAST_90}>Ultimos 90 dias</option>
            <option value={DATE_FILTERS.CURRENT_YEAR}>Ano atual</option>
          </select>
        </label>

        <label className={"grid gap-1 text-xs"}>
          <span>Ordenar por</span>
          <select
            className={INPUT_CLASS}
            value={sortBy}
            onChange={(event) => setSortBy(event.target.value)}
          >
            <option value={SORT_OPTIONS.UPDATED_DESC}>Mais recentes</option>
            <option value={SORT_OPTIONS.UPDATED_ASC}>Mais antigos</option>
            <option value={SORT_OPTIONS.START_DATE_DESC}>Inicio mais recente</option>
            <option value={SORT_OPTIONS.NAME_ASC}>Nome (A-Z)</option>
          </select>
        </label>
      </div>

      {tenantId ? (
        <p className={"m-0 text-xs opacity-70"}>
          Mostrando {visibleResearches.length} de {filteredResearches.length} servico(s).
        </p>
      ) : null}

      <div className={"grid gap-1.5"}>
        {tenantId && filteredResearches.length === 0 ? (
          <div className={"rounded-lg border border-dashed border-slate-300 p-2.5 text-xs opacity-75"}>
            Nenhum servico encontrado para os filtros selecionados.
          </div>
        ) : (
          visibleResearches.map((research) => (
            <ResearchServiceDashboardItem
              key={research.id}
              research={research}
              clusterName={clusterNameById[String(research.cluster_id)] || "N/A"}
            />
          ))
        )}
      </div>

      {tenantId && filteredResearches.length > PAGE_SIZE ? (
        <div className={"flex flex-wrap gap-2"}>
          {hasMore ? (
            <button
              type="button"
              className={
                "cursor-pointer rounded-md border border-slate-300 bg-white px-2.5 py-2 text-xs text-slate-900"
              }
              onClick={() => setVisibleCount((prev) => prev + PAGE_SIZE)}
            >
              Ver mais
            </button>
          ) : (
            <button
              type="button"
              className={
                "cursor-pointer rounded-md border border-slate-300 bg-white px-2.5 py-2 text-xs text-slate-900"
              }
              onClick={() => setVisibleCount(PAGE_SIZE)}
            >
              Mostrar menos
            </button>
          )}
        </div>
      ) : null}
    </SectionCard>
  );
}
