"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useFirebaseAuth } from "../features/auth/state/firebase-auth-context";
import { useDomainActions } from "../features/domain/hooks/use-domain-actions";
import { useDomainState } from "../features/domain/state/domain-state";
import {
  selectClusterById,
  selectPriceResearchById,
  selectResearchSchedulesByService,
  selectResearchTasksByService
} from "../features/domain/state/selectors";

function toBrDate(ymd) {
  const raw = String(ymd || "");
  const match = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) {
    return raw || "-";
  }
  return `${match[3]}/${match[2]}/${match[1]}`;
}

function parseSortableDate(value) {
  const raw = String(value || "");
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    return Date.parse(`${raw}T00:00:00Z`) || 0;
  }

  const br = raw.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (br) {
    return Date.parse(`${br[3]}-${br[2]}-${br[1]}T00:00:00Z`) || 0;
  }

  return 0;
}

function isInYearMonth(ymd, year, month) {
  const match = String(ymd || "").match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) {
    return false;
  }
  return Number(match[1]) === Number(year) && Number(match[2]) === Number(month);
}

function statusLabel(status) {
  const value = String(status || "").toUpperCase();
  if (value === "PENDING") {
    return "PENDENTE";
  }
  if (value === "IN_PROGRESS") {
    return "EM ANDAMENTO";
  }
  if (value === "DONE") {
    return "CONCLUIDO";
  }
  if (value === "CANCELLED") {
    return "CANCELADO";
  }
  if (value === "COLLECTED") {
    return "COLETADO";
  }
  if (value === "NOT_FOUND") {
    return "NAO ENCONTRADO";
  }
  return value || "PENDENTE";
}

export default function ResearchTaskPageApp({ researchId }) {
  const { runResearchSchedulerForServiceMonth, publishResearchEventsForServiceMonth } = useDomainActions();
  const { currentUser, profile } = useFirebaseAuth();
  const { state, hydrationDone } = useDomainState();
  const [schedulerSummary, setSchedulerSummary] = useState(null);
  const [schedulerError, setSchedulerError] = useState("");
  const [schedulerLoading, setSchedulerLoading] = useState(false);
  const [publishLoading, setPublishLoading] = useState(false);
  const [publishSummary, setPublishSummary] = useState(null);
  const [publishError, setPublishError] = useState("");
  const [competitorFilter, setCompetitorFilter] = useState("ALL");
  const [levelFilter, setLevelFilter] = useState("ALL");
  const schedulerRunRef = useRef("");

  const referenceDate = useMemo(() => new Date(), []);
  const currentYear = referenceDate.getFullYear();
  const currentMonth = referenceDate.getMonth() + 1;

  const research = useMemo(() => selectPriceResearchById(state, researchId), [state, researchId]);
  const cluster = useMemo(
    () => (research ? selectClusterById(state, research.cluster_id) : null),
    [state, research]
  );
  const schedules = useMemo(
    () => selectResearchSchedulesByService(state, researchId),
    [state, researchId]
  );
  const tasks = useMemo(
    () => selectResearchTasksByService(state, researchId),
    [state, researchId]
  );
  const monthSchedules = useMemo(
    () => schedules.filter((item) => isInYearMonth(item.date, currentYear, currentMonth)),
    [schedules, currentYear, currentMonth]
  );
  const monthScheduleIds = useMemo(
    () => new Set(monthSchedules.map((item) => String(item.id || ""))),
    [monthSchedules]
  );
  const monthTasks = useMemo(
    () =>
      tasks.filter((item) => monthScheduleIds.has(String(item.research_schedule_id || ""))),
    [tasks, monthScheduleIds]
  );

  const scheduleById = useMemo(
    () => new Map(monthSchedules.map((item) => [String(item.id), item])),
    [monthSchedules]
  );
  const storeById = useMemo(
    () => new Map((state?.stores || []).map((store) => [String(store.id), store])),
    [state]
  );
  const levelNameById = useMemo(
    () =>
      new Map((cluster?.levels || []).map((level) => [String(level.id), String(level.name || level.id)])),
    [cluster]
  );

  const orderedTasks = useMemo(() => {
    return [...monthTasks].sort((a, b) => {
      const scheduleA = scheduleById.get(String(a.research_schedule_id || ""));
      const scheduleB = scheduleById.get(String(b.research_schedule_id || ""));
      const dateA = parseSortableDate(scheduleA?.date || a?.date);
      const dateB = parseSortableDate(scheduleB?.date || b?.date);
      if (dateA !== dateB) {
        return dateA - dateB;
      }
      return String(a.place_id || "").localeCompare(String(b.place_id || ""));
    });
  }, [monthTasks, scheduleById]);

  const competitorOptions = useMemo(() => {
    const map = new Map();
    orderedTasks.forEach((task) => {
      const placeId = String(task?.place_id || "");
      if (!placeId || map.has(placeId)) {
        return;
      }
      const store = storeById.get(placeId);
      map.set(placeId, store?.name || placeId);
    });
    return [...map.entries()].map(([id, label]) => ({ id, label }));
  }, [orderedTasks, storeById]);

  const levelOptions = useMemo(() => {
    const map = new Map();
    orderedTasks.forEach((task) => {
      const levelId = String(task?.level_id || "");
      if (!levelId || map.has(levelId)) {
        return;
      }
      map.set(levelId, levelNameById.get(levelId) || levelId);
    });
    return [...map.entries()].map(([id, label]) => ({ id, label }));
  }, [orderedTasks, levelNameById]);

  const filteredTasks = useMemo(() => {
    return orderedTasks.filter((task) => {
      const byCompetitor =
        competitorFilter === "ALL" || String(task?.place_id || "") === String(competitorFilter);
      const byLevel = levelFilter === "ALL" || String(task?.level_id || "") === String(levelFilter);
      return byCompetitor && byLevel;
    });
  }, [orderedTasks, competitorFilter, levelFilter]);

  const handlePublishToMobile = useCallback(async () => {
    if (!research?.id) {
      return;
    }

    setPublishLoading(true);
    setPublishError("");
    setPublishSummary(null);

    try {
      const result = await publishResearchEventsForServiceMonth(research.id, referenceDate, {
        uid: currentUser?.uid || null,
        email: currentUser?.email || null,
        username: profile?.username || null
      });
      setPublishSummary(result);
    } catch (error) {
      setPublishError(error?.message || "Falha ao publicar agenda para o mobile.");
    } finally {
      setPublishLoading(false);
    }
  }, [
    publishResearchEventsForServiceMonth,
    research?.id,
    referenceDate,
    currentUser?.uid,
    currentUser?.email,
    profile?.username
  ]);

  useEffect(() => {
    const runKey = `${researchId}-${currentYear}-${currentMonth}`;
    if (!hydrationDone || !researchId || schedulerRunRef.current === runKey) {
      return;
    }

    schedulerRunRef.current = runKey;
    setSchedulerError("");
    setSchedulerLoading(true);

    try {
      const result = runResearchSchedulerForServiceMonth(researchId, referenceDate, {
        uid: currentUser?.uid || null,
        email: currentUser?.email || null,
        username: profile?.username || null
      });
      setSchedulerSummary(result);
    } catch (error) {
      setSchedulerError(error?.message || "Falha ao sincronizar agenda do mes.");
    } finally {
      setSchedulerLoading(false);
    }
  }, [
    hydrationDone,
    researchId,
    currentYear,
    currentMonth,
    referenceDate,
    currentUser?.uid,
    currentUser?.email,
    profile?.username,
    runResearchSchedulerForServiceMonth
  ]);

  useEffect(() => {
    if (competitorFilter !== "ALL" && !competitorOptions.some((item) => item.id === competitorFilter)) {
      setCompetitorFilter("ALL");
    }
  }, [competitorFilter, competitorOptions]);

  useEffect(() => {
    if (levelFilter !== "ALL" && !levelOptions.some((item) => item.id === levelFilter)) {
      setLevelFilter("ALL");
    }
  }, [levelFilter, levelOptions]);

  if (!hydrationDone) {
    return (
      <main className={"min-h-screen p-6 text-slate-900 bg-[radial-gradient(circle_at_12%_10%,rgba(255,208,82,0.18),transparent_32%),radial-gradient(circle_at_85%_90%,rgba(37,99,235,0.16),transparent_40%),linear-gradient(180deg,#f7f7f8_0%,#f0f2f5_100%)]"}>
        <div className={"mx-auto grid max-w-[1440px] gap-4"}>
          <section className={"grid gap-2.5 rounded-xl border border-slate-900/10 bg-white/90 p-[14px]"}>
            <h2 className={"m-0 text-lg"}>Carregando tarefas de pesquisa...</h2>
          </section>
        </div>
      </main>
    );
  }

  if (!research) {
    return (
      <main className={"min-h-screen p-6 text-slate-900 bg-[radial-gradient(circle_at_12%_10%,rgba(255,208,82,0.18),transparent_32%),radial-gradient(circle_at_85%_90%,rgba(37,99,235,0.16),transparent_40%),linear-gradient(180deg,#f7f7f8_0%,#f0f2f5_100%)]"}>
        <div className={"mx-auto grid max-w-[1440px] gap-4"}>
          <section className={"grid gap-2.5 rounded-xl border border-slate-900/10 bg-white/90 p-[14px]"}>
            <h2 className={"m-0 text-lg"}>Servico nao encontrado</h2>
            <p className={"m-0 text-xs opacity-70"}>Verifique se o servico ainda existe.</p>
            <div className={"flex flex-wrap gap-2"}>
              <Link href="/dashboard" className={"inline-flex items-center justify-center rounded-lg border border-slate-900 bg-slate-900 px-3 py-2.5 text-[13px] text-white no-underline"}>
                Voltar ao dashboard
              </Link>
            </div>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className={"min-h-screen p-6 text-slate-900 bg-[radial-gradient(circle_at_12%_10%,rgba(255,208,82,0.18),transparent_32%),radial-gradient(circle_at_85%_90%,rgba(37,99,235,0.16),transparent_40%),linear-gradient(180deg,#f7f7f8_0%,#f0f2f5_100%)]"}>
      <div className={"mx-auto grid max-w-[1440px] gap-4"}>
        <header className={"flex items-center justify-between gap-4 rounded-[14px] bg-white/[0.85] px-5 py-[18px] shadow-[0_10px_20px_rgba(15,23,42,0.08)]"}>
          <div>
            <h1 className={"m-0 text-[30px] tracking-[0.5px]"}>TAREFAS DE PESQUISA</h1>
            <p className={"mb-0 mt-1 text-sm [opacity:0.85]"}>
              Servico: <strong>{research.name || "-"}</strong>
            </p>
          </div>
          <div className={"flex flex-wrap items-center gap-2"}>
            <button
              type="button"
              className={"inline-flex cursor-pointer items-center justify-center rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-[13px] text-slate-900"}
              disabled={publishLoading || orderedTasks.length === 0}
              onClick={handlePublishToMobile}
            >
              {publishLoading ? "Publicando..." : "Publicar agenda mobile"}
            </button>
            <Link href={`/researches/${research.id}/list`} className={"inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-[13px] text-slate-900 no-underline"}>
              Ver lista
            </Link>
            <Link href={`/researches/${research.id}/edit`} className={"inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-[13px] text-slate-900 no-underline"}>
              Editar servico
            </Link>
            <Link href="/dashboard" className={"inline-flex items-center justify-center rounded-lg border border-slate-900 bg-slate-900 px-3 py-2.5 text-[13px] text-white no-underline"}>
              Dashboard
            </Link>
          </div>
        </header>

        {schedulerLoading ? (
          <p className={"m-0 rounded-lg border border-blue-200 bg-blue-50 p-2 text-xs text-blue-800"}>
            Sincronizando agenda de {String(currentMonth).padStart(2, "0")}/{currentYear}...
          </p>
        ) : null}
        {schedulerSummary ? (
          <p className={"m-0 rounded-lg border border-green-200 bg-green-50 p-2 text-xs text-green-800"}>
            Agenda {String(currentMonth).padStart(2, "0")}/{currentYear}: {schedulerSummary.total} evento(s),{" "}
            {schedulerSummary.existing} existente(s), {schedulerSummary.created} criado(s).
          </p>
        ) : null}
        {schedulerError ? (
          <p className={"m-0 rounded-lg border border-red-200 bg-red-50 p-2 text-xs text-red-800"}>
            {schedulerError}
          </p>
        ) : null}
        {publishSummary ? (
          <p className={"m-0 rounded-lg border border-emerald-200 bg-emerald-50 p-2 text-xs text-emerald-800"}>
            Publicacao mobile {String(publishSummary.month).padStart(2, "0")}/{publishSummary.year}:{" "}
            {publishSummary.published} evento(s) publicado(s), {publishSummary.failed} falha(s).
          </p>
        ) : null}
        {publishError ? (
          <p className={"m-0 rounded-lg border border-red-200 bg-red-50 p-2 text-xs text-red-800"}>
            {publishError}
          </p>
        ) : null}

        {orderedTasks.length === 0 ? (
          <section className={"grid gap-2.5 rounded-xl border border-slate-900/10 bg-white/90 p-[14px]"}>
            <h2 className={"m-0 text-lg"}>Nenhuma tarefa gerada</h2>
            <p className={"m-0 text-xs opacity-70"}>
              Nao existem eventos para {String(currentMonth).padStart(2, "0")}/{currentYear}.
            </p>
          </section>
        ) : (
          <section className={"grid gap-2.5 rounded-xl border border-slate-900/10 bg-white/90 p-[14px]"}>
            <h2 className={"m-0 text-lg"}>Agenda de Eventos</h2>
            <div className={"grid gap-2 [grid-template-columns:repeat(auto-fit,minmax(260px,1fr))]"}>
              <label className={"grid gap-1 text-xs [&>select]:w-full [&>select]:rounded-md [&>select]:border [&>select]:border-slate-300 [&>select]:bg-white [&>select]:p-2 [&>select]:text-[13px]"}>
                <span>Filtrar por concorrente</span>
                <select
                  value={competitorFilter}
                  onChange={(event) => setCompetitorFilter(event.target.value)}
                >
                  <option value="ALL">Todos</option>
                  {competitorOptions.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className={"grid gap-1 text-xs [&>select]:w-full [&>select]:rounded-md [&>select]:border [&>select]:border-slate-300 [&>select]:bg-white [&>select]:p-2 [&>select]:text-[13px]"}>
                <span>Filtrar por nivel</span>
                <select
                  value={levelFilter}
                  onChange={(event) => setLevelFilter(event.target.value)}
                >
                  <option value="ALL">Todos</option>
                  {levelOptions.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <p className={"m-0 text-xs opacity-70"}>
              Mostrando {filteredTasks.length} de {orderedTasks.length} evento(s).
            </p>
            <div className={"flex w-full flex-col gap-2"}>
              {filteredTasks.length === 0 ? (
                <div className={"rounded-lg border border-dashed border-slate-300 p-2.5 text-xs opacity-75"}>
                  Nenhum evento encontrado para os filtros selecionados.
                </div>
              ) : (
                filteredTasks.map((task) => {
                const schedule = scheduleById.get(String(task.research_schedule_id || ""));
                const store = storeById.get(String(task.place_id || ""));
                const eventStatus = statusLabel(schedule?.status || task?.status);
                return (
                  <article key={task.id} className={"w-full grid gap-1.5 rounded-lg border border-slate-200 bg-white p-2.5"}>
                    <div className={"flex items-center justify-between gap-2"}>
                      <strong>{toBrDate(schedule?.date || task.date)}</strong>
                      <span className={"rounded-full border border-slate-300 px-2 py-0.5 text-[11px]"}>
                        {eventStatus}
                      </span>
                    </div>
                    <small>Cluster: {cluster?.name || "-"}</small>
                    <small>Loja concorrente: {store?.name || task.place_id || "-"}</small>
                    <small>
                      Nivel de concorrencia:{" "}
                      {levelNameById.get(String(task?.level_id || "")) || task?.level_id || "-"}
                    </small>
                    <div className={"flex flex-wrap gap-2"}>
                      <Link
                        href={`/researches/${research.id}/list?task=${encodeURIComponent(task.id)}`}
                        className={"inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-[13px] text-slate-900 no-underline"}
                      >
                        Ver lista
                      </Link>
                    </div>
                  </article>
                );
                })
              )}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
