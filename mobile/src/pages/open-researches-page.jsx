function slotsLabel(eventItem) {
  const max = Number(eventItem.max_subscriptions || 20);
  const current = Number(eventItem.subscriptions_count || 0);
  const left = Math.max(0, max - current);
  return `${current}/${max} inscritos (${left} vaga(s))`;
}

function statusText(subscription) {
  if (!subscription) {
    return "Disponivel";
  }
  if (subscription.status === "SUBSCRIBED") {
    return "Inscrito";
  }
  if (subscription.status === "REJECTED") {
    return `Nao aprovado: ${subscription.reason || "evento fechado"}`;
  }
  return "Aguardando sincronizacao";
}

export default function OpenResearchesPage({
  events,
  subscriptionsByEvent,
  syncing,
  onRefresh,
  onSubscribe
}) {
  return (
    <section className="panel">
      <div className="panel-header">
        <div>
          <h2>Pesquisas em aberto</h2>
          <p className="muted">Inscricao limitada a 20 pesquisadores por pesquisa.</p>
        </div>
        <button type="button" className="btn btn-outline" onClick={onRefresh} disabled={syncing}>
          {syncing ? "Sincronizando..." : "Atualizar"}
        </button>
      </div>

      {events.length === 0 ? (
        <div className="empty-box">Nenhuma pesquisa aberta no cache local.</div>
      ) : (
        <div className="event-list">
          {events.map((eventItem) => {
            const subscription = subscriptionsByEvent[eventItem.id] || null;
            const disabled =
              Boolean(subscription && subscription.status !== "REJECTED") ||
              Number(eventItem.subscriptions_count || 0) >= Number(eventItem.max_subscriptions || 20);

            return (
              <article key={eventItem.id} className="event-card">
                <div className="event-top">
                  <strong>{eventItem.name || "Pesquisa"}</strong>
                  <span className="tag">{eventItem.status || "OPEN"}</span>
                </div>
                <small>Data prevista: {eventItem.date || "-"}</small>
                <small>Cluster: {eventItem.cluster_name || "-"}</small>
                <small>Concorrente: {eventItem.competitor_name || "-"}</small>
                <small>Nivel: {eventItem.competition_level || "-"}</small>
                <small>{slotsLabel(eventItem)}</small>
                <small className="muted">{statusText(subscription)}</small>

                <button
                  type="button"
                  className="btn"
                  disabled={disabled}
                  onClick={() => onSubscribe(eventItem)}
                >
                  {disabled ? "Indisponivel" : "Inscrever"}
                </button>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
