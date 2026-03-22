"use client";

import { Fragment, useState } from "react";
import ResearchTaskResultsTable from "./research-task-results-table";

export default function CompletedResearchTasksTable({
  tasks = [],
  title = "Tarefas concluidas"
}) {
  const [expandedTaskId, setExpandedTaskId] = useState("");

  if (!Array.isArray(tasks) || tasks.length === 0) {
    return null;
  }

  return (
    <div className={"mt-1 overflow-hidden rounded-lg border border-emerald-200"}>
      <div className={"border-b border-emerald-200 bg-emerald-50 px-2.5 py-2 text-[11px] font-medium uppercase tracking-[0.35px] text-emerald-900"}>
        {title}
      </div>
      <div className={"max-h-[420px] overflow-auto"}>
        <table className={"w-full border-collapse text-left text-[12px]"}>
          <thead className={"bg-white text-slate-500"}>
            <tr>
              <th className={"px-2.5 py-2 font-medium"}>Data</th>
              <th className={"px-2.5 py-2 font-medium"}>Concorrente</th>
              <th className={"px-2.5 py-2 font-medium"}>Nivel</th>
              <th className={"px-2.5 py-2 font-medium text-center"}>Cobertura</th>
              <th className={"px-2.5 py-2 font-medium text-center"}>Pesquisadores</th>
              <th className={"px-2.5 py-2 font-medium text-right"}>Detalhe</th>
            </tr>
          </thead>
          <tbody>
            {tasks.map((task) => {
              const taskId = String(task?.event_id || task?.research_task_id || "");
              const isExpanded = expandedTaskId === taskId;

              return (
                <Fragment key={taskId}>
                  <tr key={taskId} className={"border-t border-slate-100 align-top"}>
                    <td className={"px-2.5 py-2 text-slate-700"}>{task.date || "-"}</td>
                    <td className={"px-2.5 py-2 text-slate-700"}>{task.competitor_name || "-"}</td>
                    <td className={"px-2.5 py-2 text-slate-700"}>{task.competition_level || "-"}</td>
                    <td className={"px-2.5 py-2 text-center text-slate-900"}>
                      <span className={"inline-flex min-w-[56px] items-center justify-center rounded-full border border-emerald-300 bg-emerald-100 px-2 py-0.5 text-[11px] text-emerald-900"}>
                        {task.coverage_label || "0/0"}
                      </span>
                    </td>
                    <td className={"px-2.5 py-2 text-center text-slate-900"}>
                      {Number(task.researcher_count || 0)}
                    </td>
                    <td className={"px-2.5 py-2 text-right"}>
                      <button
                        type="button"
                        onClick={() => setExpandedTaskId(isExpanded ? "" : taskId)}
                        className={"cursor-pointer rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-[11px] text-slate-900"}
                      >
                        {isExpanded ? "Ocultar" : "Detalhe"}
                      </button>
                    </td>
                  </tr>
                  {isExpanded ? (
                    <tr className={"border-t border-slate-100 align-top"}>
                      <td colSpan={6} className={"px-2.5 py-2"}>
                        <ResearchTaskResultsTable task={task} />
                      </td>
                    </tr>
                  ) : null}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
