"use client";

function formatSubscriptions(eventItem) {
  const count = Number(eventItem?.subscriptions_count || 0);
  const max = Number(eventItem?.max_subscriptions || 20);
  return `${count}/${max}`;
}

export default function OpenResearchEventsTable({
  events = [],
  title = "Tarefas abertas para pesquisadores"
}) {
  if (!Array.isArray(events) || events.length === 0) {
    return null;
  }

  return (
    <div className={"mt-1 overflow-hidden rounded-lg border border-slate-200"}>
      <div className={"border-b border-slate-200 bg-slate-50 px-2.5 py-2 text-[11px] font-medium uppercase tracking-[0.35px] text-slate-600"}>
        {title}
      </div>
      <div className={"max-h-[180px] overflow-auto"}>
        <table className={"w-full border-collapse text-left text-[12px]"}>
          <thead className={"bg-white text-slate-500"}>
            <tr>
              <th className={"px-2.5 py-2 font-medium"}>Data</th>
              <th className={"px-2.5 py-2 font-medium"}>Concorrente</th>
              <th className={"px-2.5 py-2 font-medium"}>Nivel</th>
              <th className={"px-2.5 py-2 font-medium text-right"}>Inscritos</th>
            </tr>
          </thead>
          <tbody>
            {events.map((eventItem) => (
              <tr key={eventItem.id} className={"border-t border-slate-100 align-top"}>
                <td className={"px-2.5 py-2 text-slate-700"}>{eventItem.date || "-"}</td>
                <td className={"px-2.5 py-2 text-slate-700"}>{eventItem.competitor_name || "-"}</td>
                <td className={"px-2.5 py-2 text-slate-700"}>{eventItem.competition_level || "-"}</td>
                <td className={"px-2.5 py-2 text-right text-slate-900"}>
                  <span className={"inline-flex min-w-[52px] items-center justify-center rounded-full border border-slate-300 px-2 py-0.5 text-[11px]"}>
                    {formatSubscriptions(eventItem)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
