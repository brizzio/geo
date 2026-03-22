"use client";

import { useState } from "react";
import ResearchTaskResultsTable from "../../research-tasks/components/research-task-results-table";

function formatDateTime(value) {
  const raw = String(value || "").trim();
  if (!raw) {
    return "-";
  }

  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) {
    return raw;
  }

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short"
  }).format(date);
}

export default function MobileResearchHistoryCard({ item }) {
  const [expanded, setExpanded] = useState(false);
  const resultRows = Array.isArray(item?.items) ? item.items : [];
  const taskForResults = {
    coverage_label: `${resultRows.filter((row) => row?.first_price !== null && row?.first_price !== undefined).length}/${resultRows.length}`,
    researcher_count: 1,
    done_count: 1,
    result_rows: resultRows.map((row, index) => ({
      row_id: `${item?.id || "history"}_${index}`,
      researcher_name: item?.researcher_name || "-",
      completed_at: item?.completed_at || null,
      product_id: row?.product_id || "",
      product_name: row?.product_name || row?.product_id || "-",
      first_price: row?.first_price,
      second_price: row?.second_price,
      second_price_quantity: row?.second_price_quantity,
      loyalty_price: row?.loyalty_price,
      is_promotion: row?.is_promotion,
      department_name: row?.department_name || "",
      has_shelf_tag_photo: Boolean(row?.shelf_tag_photo?.display_url || row?.shelf_tag_photo?.image_url)
    }))
  };

  return (
    <article className={"grid gap-2 rounded-xl border border-slate-200 bg-white p-3 shadow-[0_10px_24px_rgba(15,23,42,0.06)]"}>
      <div className={"flex items-start justify-between gap-3"}>
        <div className={"grid gap-1"}>
          <strong className={"text-sm text-slate-900"}>
            {item?.meta?.event_name || "Pesquisa concluida"}
          </strong>
          <small className={"text-slate-600"}>Concorrente: {item?.meta?.competitor_name || "-"}</small>
          <small className={"text-slate-600"}>Nivel: {item?.meta?.competition_level || "-"}</small>
        </div>
        <span className={"rounded-full border border-emerald-300 bg-emerald-100 px-2 py-0.5 text-[11px] text-emerald-900"}>
          CONCLUIDA
        </span>
      </div>

      <div className={"grid gap-1 rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-xs text-slate-600"}>
        <small>Finalizada em: {formatDateTime(item?.completed_at)}</small>
        <small>Prazo aceito: {formatDateTime(item?.deadline_at)}</small>
        <small>Endereco: {item?.meta?.address_display_name || "-"}</small>
        <small>Itens enviados: {resultRows.length}</small>
        <small>Foto da fachada: {item?.facade_photo?.display_url || item?.facade_photo?.image_url ? "Sim" : "Nao"}</small>
      </div>

      <button
        type="button"
        onClick={() => setExpanded((previous) => !previous)}
        className={"cursor-pointer rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900"}
      >
        {expanded ? "Ocultar detalhes" : "Ver detalhes"}
      </button>

      {expanded ? <ResearchTaskResultsTable task={taskForResults} /> : null}
    </article>
  );
}
