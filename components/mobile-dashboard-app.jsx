"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useFirebaseAuth } from "../features/auth/state/firebase-auth-context";
import { useMobileResearchState } from "../features/mobile/state/mobile-research-state";
import MobileStandaloneGuard from "./mobile-standalone-guard";

function slotsLabel(eventItem) {
  const max = Number(eventItem?.max_subscriptions || 20);
  const count = Number(eventItem?.subscriptions_count || 0);
  const remaining = Math.max(0, max - count);
  return `${count}/${max} inscritos (${remaining} vaga(s))`;
}

function normalizeCoordinate(value) {
  if (value === null || value === undefined || value === "") {
    return null;
  }
  const numeric = Number(String(value).replace(",", "."));
  return Number.isFinite(numeric) ? numeric : null;
}

function haversineDistanceKm(fromLat, fromLon, toLat, toLon) {
  const earthRadiusKm = 6371;
  const toRad = (degrees) => (degrees * Math.PI) / 180;
  const dLat = toRad(toLat - fromLat);
  const dLon = toRad(toLon - fromLon);
  const lat1 = toRad(fromLat);
  const lat2 = toRad(toLat);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadiusKm * c;
}

function formatDistanceKm(distanceKm) {
  if (!Number.isFinite(distanceKm) || distanceKm <= 0) {
    return "0 km";
  }
  return `${distanceKm.toFixed(1)} km`;
}

export default function MobileDashboardApp() {
  const router = useRouter();
  const { currentUser, loading: authLoading, profile, signOut } = useFirebaseAuth();
  const {
    loading,
    hydrationDone,
    error,
    isResearcher,
    researcherProfile,
    tenantOptions,
    events,
    subscriptionsByEvent,
    subscribingEventId,
    refresh,
    subscribeToEvent,
    updateDistanceReference
  } = useMobileResearchState();
  const [feedback, setFeedback] = useState("");
  const [showOnlyPreferredTenants, setShowOnlyPreferredTenants] = useState(false);
  const [selectedDistanceReference, setSelectedDistanceReference] = useState("WORK");

  const preferredTenantIds = useMemo(
    () =>
      [...new Set((researcherProfile?.preferred_tenants || []).map((item) => String(item || "").trim()).filter(Boolean))],
    [researcherProfile?.preferred_tenants]
  );
  const tenantNameById = useMemo(
    () => new Map((tenantOptions || []).map((tenant) => [String(tenant.id || ""), String(tenant.name || tenant.id || "")])),
    [tenantOptions]
  );
  const preferredTenantNames = useMemo(
    () =>
      preferredTenantIds.map((tenantId) => tenantNameById.get(String(tenantId)) || String(tenantId)),
    [preferredTenantIds, tenantNameById]
  );
  const preferredTenantSet = useMemo(() => new Set(preferredTenantIds), [preferredTenantIds]);
  useEffect(() => {
    const fromProfile = String(researcherProfile?.distance_reference || "").toUpperCase();
    setSelectedDistanceReference(fromProfile === "HOME" ? "HOME" : "WORK");
  }, [researcherProfile?.distance_reference]);

  const distanceBase = useMemo(() => {
    if (selectedDistanceReference === "HOME") {
      const homeLat = normalizeCoordinate(researcherProfile?.home_geo_lat);
      const homeLon = normalizeCoordinate(researcherProfile?.home_geo_lon);
      return {
        source: "HOME",
        point: homeLat !== null && homeLon !== null ? [homeLat, homeLon] : null
      };
    }

    const workLat = normalizeCoordinate(researcherProfile?.work_geo_lat);
    const workLon = normalizeCoordinate(researcherProfile?.work_geo_lon);
    return {
      source: "WORK",
      point: workLat !== null && workLon !== null ? [workLat, workLon] : null
    };
  }, [
    selectedDistanceReference,
    researcherProfile?.work_geo_lat,
    researcherProfile?.work_geo_lon,
    researcherProfile?.home_geo_lat,
    researcherProfile?.home_geo_lon
  ]);
  const distanceBaseLabel =
    distanceBase.source === "WORK"
      ? "Trabalho"
      : distanceBase.source === "HOME"
        ? "Residencial"
        : "Nao definida";
  const orderedEvents = useMemo(() => {
    return [...events].sort((a, b) => {
      const aPreferred = preferredTenantSet.has(String(a?.tenant_id || ""));
      const bPreferred = preferredTenantSet.has(String(b?.tenant_id || ""));
      if (aPreferred !== bPreferred) {
        return aPreferred ? -1 : 1;
      }
      const byDate = String(a?.date || "").localeCompare(String(b?.date || ""));
      if (byDate !== 0) {
        return byDate;
      }
      return String(a?.name || "").localeCompare(String(b?.name || ""));
    });
  }, [events, preferredTenantSet]);
  const visibleEvents = useMemo(() => {
    if (!showOnlyPreferredTenants) {
      return orderedEvents;
    }
    return orderedEvents.filter((eventItem) =>
      preferredTenantSet.has(String(eventItem?.tenant_id || ""))
    );
  }, [showOnlyPreferredTenants, orderedEvents, preferredTenantSet]);
  const distanceKmByEventId = useMemo(() => {
    const result = {};
    visibleEvents.forEach((eventItem) => {
      const eventLat = normalizeCoordinate(eventItem?.place_geo_lat);
      const eventLon = normalizeCoordinate(eventItem?.place_geo_lon);
      if (eventLat === null || eventLon === null || !distanceBase.point) {
        result[String(eventItem.id || "")] = 0;
        return;
      }
      const [baseLat, baseLon] = distanceBase.point;
      const distance = haversineDistanceKm(baseLat, baseLon, eventLat, eventLon);
      result[String(eventItem.id || "")] = Number.isFinite(distance) ? distance : 0;
    });
    return result;
  }, [visibleEvents, distanceBase]);

  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (!currentUser) {
      router.replace("/mobile");
      return;
    }

    if (!isResearcher) {
      router.replace("/dashboard");
    }
  }, [authLoading, currentUser, isResearcher, router]);

  async function handleSubscribe(eventId) {
    setFeedback("");
    try {
      const result = await subscribeToEvent(eventId);
      if (result?.status === "ALREADY_SUBSCRIBED") {
        setFeedback("Voce ja esta inscrito neste evento.");
        return;
      }
      setFeedback("Inscricao realizada com sucesso.");
    } catch (subscribeError) {
      setFeedback(subscribeError?.message || "Falha ao realizar inscricao.");
    }
  }

  async function handleDistanceReferenceChange(nextValue) {
    const normalized = String(nextValue || "").toUpperCase() === "HOME" ? "HOME" : "WORK";
    setSelectedDistanceReference(normalized);
    try {
      await updateDistanceReference(normalized);
    } catch (referenceError) {
      setFeedback(referenceError?.message || "Falha ao salvar referencia de distancia.");
    }
  }

  return (
    <MobileStandaloneGuard
      title={"Abra o dashboard pelo app instalado"}
      subtitle={"O dashboard mobile foi bloqueado fora do modo standalone."}
      description={"Instale o NKET Mobile e abra pela tela inicial para usar pesquisas, perfil e sincronizacao."}
    >
      {authLoading || !hydrationDone ? (
        <main className={"grid min-h-screen place-items-center bg-[linear-gradient(160deg,#f8fafc_0%,#dbeafe_52%,#e2e8f0_100%)] p-6"}>
          <p className={"m-0 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-[0_12px_24px_rgba(15,23,42,0.08)]"}>
            Carregando mobile...
          </p>
        </main>
      ) : !currentUser || !isResearcher ? null : (
        <main className={"min-h-screen bg-[radial-gradient(circle_at_10%_12%,rgba(34,197,94,0.18),transparent_35%),radial-gradient(circle_at_88%_90%,rgba(59,130,246,0.2),transparent_40%),linear-gradient(145deg,#f8fafc_0%,#e2e8f0_46%,#f1f5f9_100%)] p-4 text-slate-900"}>
          <div className={"mx-auto grid max-w-[740px] gap-3"}>
        <header className={"grid gap-2 rounded-xl border border-slate-200 bg-white/[0.92] p-4 shadow-[0_10px_24px_rgba(15,23,42,0.08)]"}>
          <h1 className={"m-0 text-[28px]"}>DASH MOBILE</h1>
          <p className={"m-0 text-xs text-slate-600"}>
            Pesquisador: <strong>{profile?.display_name || currentUser.email || "-"}</strong>
          </p>
          <p className={"m-0 text-xs text-slate-600"}>
            Tenants de interesse:{" "}
            <strong>
              {preferredTenantNames.length > 0 ? preferredTenantNames.join(", ") : "nenhum informado"}
            </strong>
          </p>
          <label className={"grid gap-1 text-xs text-slate-600"}>
            <span>Referencia para distancia</span>
            <select
              value={selectedDistanceReference}
              onChange={(event) => handleDistanceReferenceChange(event.target.value)}
              className={"rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-xs text-slate-900 outline-none transition focus:border-slate-500"}
            >
              <option value="WORK">Trabalho</option>
              <option value="HOME">Residencial</option>
            </select>
          </label>
          <div className={"flex flex-wrap gap-2"}>
            <Link href="/profile-mobile" className={"inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 no-underline"}>
              Meu perfil
            </Link>
            <button
              type="button"
              onClick={() => setShowOnlyPreferredTenants((previous) => !previous)}
              className={"cursor-pointer rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900"}
            >
              {showOnlyPreferredTenants ? "Mostrar todos os tenants" : "Somente tenants de interesse"}
            </button>
            <button
              type="button"
              onClick={() => refresh()}
              className={"cursor-pointer rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900"}
            >
              Atualizar
            </button>
            <button
              type="button"
              onClick={async () => {
                await signOut();
                router.replace("/mobile");
              }}
              className={"cursor-pointer rounded-lg border border-slate-900 bg-slate-900 px-3 py-2 text-xs text-white"}
            >
              Sair
            </button>
          </div>
        </header>

        {loading ? (
          <p className={"m-0 rounded-lg border border-blue-200 bg-blue-50 p-2 text-xs text-blue-800"}>
            Atualizando pesquisas...
          </p>
        ) : null}
        {error ? (
          <p className={"m-0 rounded-lg border border-red-200 bg-red-50 p-2 text-xs text-red-800"}>{error}</p>
        ) : null}
        {feedback ? (
          <p className={"m-0 rounded-lg border border-emerald-200 bg-emerald-50 p-2 text-xs text-emerald-800"}>
            {feedback}
          </p>
        ) : null}

        <section className={"grid gap-2 rounded-xl border border-slate-200 bg-white/[0.9] p-3"}>
          <h2 className={"m-0 text-lg"}>Pesquisas abertas</h2>
          {visibleEvents.length === 0 ? (
            <div className={"rounded-lg border border-dashed border-slate-300 p-2.5 text-xs text-slate-600"}>
              {showOnlyPreferredTenants && preferredTenantIds.length > 0
                ? "Nenhuma pesquisa aberta para os tenants de interesse."
                : "Nenhuma pesquisa aberta no momento."}
            </div>
          ) : (
            <div className={"flex flex-col gap-2"}>
              {visibleEvents.map((eventItem) => {
                const subscription = subscriptionsByEvent[String(eventItem.id)] || null;
                const isAlreadySubscribed = subscription?.status === "SUBSCRIBED";
                const isFull =
                  Number(eventItem?.subscriptions_count || 0) >=
                  Number(eventItem?.max_subscriptions || 20);
                const isActionLoading = String(subscribingEventId) === String(eventItem.id);
                const isDisabled = isAlreadySubscribed || isFull || isActionLoading;
                const isPreferredTenant = preferredTenantSet.has(String(eventItem?.tenant_id || ""));

                return (
                  <article key={eventItem.id} className={"grid gap-1.5 rounded-lg border border-slate-200 bg-white p-3"}>
                    <div className={"flex items-center justify-between gap-2"}>
                      <strong>{eventItem.name || "Pesquisa"}</strong>
                      <span className={"rounded-full border border-slate-300 px-2 py-0.5 text-[11px]"}>
                        {eventItem.status || "OPEN"}
                      </span>
                    </div>
                    <small>Data: {eventItem.date || "-"}</small>
                    <small>Tenant: {tenantNameById.get(String(eventItem.tenant_id || "")) || eventItem.tenant_id || "-"}</small>
                    <small>Cluster: {eventItem.cluster_name || "-"}</small>
                    <small>Concorrente: {eventItem.competitor_name || "-"}</small>
                    <small>Nivel: {eventItem.competition_level || "-"}</small>
                    <small>Distancia: {formatDistanceKm(distanceKmByEventId[String(eventItem.id)] || 0)}</small>
                    <small>Base de distancia: {distanceBaseLabel}</small>
                    <small>
                      Prioridade: <strong>{isPreferredTenant ? "TENANT DE INTERESSE" : "GERAL"}</strong>
                    </small>
                    <small>{slotsLabel(eventItem)}</small>
                    <small>
                      Minha situacao:{" "}
                      <strong>
                        {isAlreadySubscribed
                          ? "INSCRITO"
                          : subscription?.status === "REJECTED"
                            ? "NAO APROVADO"
                            : "DISPONIVEL"}
                      </strong>
                    </small>
                    <button
                      type="button"
                      disabled={isDisabled}
                      onClick={() => handleSubscribe(eventItem.id)}
                      className={"cursor-pointer rounded-lg border border-slate-900 bg-slate-900 px-3 py-2 text-xs text-white disabled:cursor-not-allowed disabled:opacity-60"}
                    >
                      {isAlreadySubscribed
                        ? "Ja inscrito"
                        : isActionLoading
                          ? "Processando..."
                          : isFull
                            ? "Lista cheia"
                            : "Inscrever"}
                    </button>
                  </article>
                );
              })}
            </div>
          )}
        </section>
          </div>
        </main>
      )}
    </MobileStandaloneGuard>
  );
}
