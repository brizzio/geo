"use client";

function formatCurrency(value) {
  if (value === null || value === undefined || value === "") {
    return "-";
  }

  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return "-";
  }

  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL"
  }).format(numeric);
}

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

export default function ResearchTaskResultsTable({ task = null }) {
  const resultRows = Array.isArray(task?.result_rows) ? task.result_rows : [];

  return (
    <div className={"grid gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3"}>
      <div className={"flex flex-wrap gap-2 text-[11px] text-slate-600"}>
        <span className={"rounded-full border border-slate-300 bg-white px-2 py-0.5"}>
          Cobertura: {task?.coverage_label || "0/0"}
        </span>
        <span className={"rounded-full border border-slate-300 bg-white px-2 py-0.5"}>
          Pesquisadores: {Number(task?.researcher_count || 0)}
        </span>
        <span className={"rounded-full border border-slate-300 bg-white px-2 py-0.5"}>
          Entregas: {Number(task?.done_count || 0)}
        </span>
      </div>

      {resultRows.length === 0 ? (
        <div className={"rounded-lg border border-dashed border-slate-300 bg-white p-3 text-xs text-slate-600"}>
          Nenhum dado coletado para esta tarefa.
        </div>
      ) : (
        <div className={"max-h-[320px] overflow-auto rounded-lg border border-slate-200 bg-white"}>
          <table className={"w-full border-collapse text-left text-[12px]"}>
            <thead className={"bg-slate-100 text-slate-600"}>
              <tr>
                <th className={"px-2.5 py-2 font-medium"}>Produto</th>
                <th className={"px-2.5 py-2 font-medium"}>Pesquisador</th>
                <th className={"px-2.5 py-2 font-medium"}>1o preco</th>
                <th className={"px-2.5 py-2 font-medium"}>2o preco</th>
                <th className={"px-2.5 py-2 font-medium"}>Qtd</th>
                <th className={"px-2.5 py-2 font-medium"}>Fidelidade</th>
                <th className={"px-2.5 py-2 font-medium"}>Promocao</th>
                <th className={"px-2.5 py-2 font-medium"}>Departamento</th>
                <th className={"px-2.5 py-2 font-medium"}>Foto etiqueta</th>
                <th className={"px-2.5 py-2 font-medium"}>Enviado em</th>
              </tr>
            </thead>
            <tbody>
              {resultRows.map((row) => (
                <tr key={row.row_id} className={"border-t border-slate-100 align-top"}>
                  <td className={"px-2.5 py-2 text-slate-900"}>
                    {row.product_name || row.product_id || "-"}
                  </td>
                  <td className={"px-2.5 py-2 text-slate-700"}>{row.researcher_name || "-"}</td>
                  <td className={"px-2.5 py-2 text-slate-700"}>{formatCurrency(row.first_price)}</td>
                  <td className={"px-2.5 py-2 text-slate-700"}>{formatCurrency(row.second_price)}</td>
                  <td className={"px-2.5 py-2 text-slate-700"}>
                    {row.second_price_quantity ?? "-"}
                  </td>
                  <td className={"px-2.5 py-2 text-slate-700"}>{formatCurrency(row.loyalty_price)}</td>
                  <td className={"px-2.5 py-2 text-slate-700"}>{row.is_promotion ? "Sim" : "Nao"}</td>
                  <td className={"px-2.5 py-2 text-slate-700"}>{row.department_name || "-"}</td>
                  <td className={"px-2.5 py-2 text-slate-700"}>
                    {row.has_shelf_tag_photo ? "Sim" : "Nao"}
                  </td>
                  <td className={"px-2.5 py-2 text-slate-700"}>{formatDateTime(row.completed_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
