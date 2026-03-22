"use client";

import {
  collection,
  doc,
  limit,
  onSnapshot,
  query,
  serverTimestamp,
  where,
  writeBatch
} from "firebase/firestore";
import { useEffect, useMemo, useRef, useState } from "react";
import { db, hasFirebaseConfig } from "../../../lib/firebase-client";
import {
  buildResearchTaskEntries,
  normalizeDoneTaskRecord,
  normalizeResearchEvent
} from "../lib/research-task-completion";

const RESEARCH_EVENTS_COLLECTION = "research_events";
const RESEARCH_TASKS_DONE_COLLECTION = "research_tasks_done";

function normalizeText(value) {
  return String(value || "").trim();
}

export function useResearchTaskCompletion({
  tenantId,
  researches = [],
  researchTasks = []
}) {
  const [events, setEvents] = useState([]);
  const [doneRecords, setDoneRecords] = useState([]);
  const [eventsReady, setEventsReady] = useState(false);
  const [doneReady, setDoneReady] = useState(false);
  const [eventsError, setEventsError] = useState("");
  const [doneError, setDoneError] = useState("");
  const syncingEventIdsRef = useRef(new Set());

  useEffect(() => {
    const normalizedTenantId = normalizeText(tenantId);

    if (!normalizedTenantId || !hasFirebaseConfig || !db) {
      setEvents([]);
      setDoneRecords([]);
      setEventsReady(false);
      setDoneReady(false);
      setEventsError("");
      setDoneError("");
      syncingEventIdsRef.current.clear();
      return undefined;
    }

    setEventsReady(false);
    setDoneReady(false);
    setEventsError("");
    setDoneError("");
    syncingEventIdsRef.current.clear();

    const eventsQuery = query(
      collection(db, RESEARCH_EVENTS_COLLECTION),
      where("tenant_id", "==", normalizedTenantId),
      limit(600)
    );
    const doneQuery = query(
      collection(db, RESEARCH_TASKS_DONE_COLLECTION),
      where("tenant_id", "==", normalizedTenantId),
      limit(1200)
    );

    const unsubscribeEvents = onSnapshot(
      eventsQuery,
      (snapshot) => {
        setEvents(snapshot.docs.map(normalizeResearchEvent));
        setEventsReady(true);
        setEventsError("");
      },
      (error) => {
        setEvents([]);
        setEventsReady(true);
        setEventsError(error?.message || "Falha ao carregar eventos de pesquisa.");
      }
    );

    const unsubscribeDone = onSnapshot(
      doneQuery,
      (snapshot) => {
        setDoneRecords(snapshot.docs.map(normalizeDoneTaskRecord));
        setDoneReady(true);
        setDoneError("");
      },
      (error) => {
        setDoneRecords([]);
        setDoneReady(true);
        setDoneError(error?.message || "Falha ao carregar producao das tarefas.");
      }
    );

    return () => {
      unsubscribeEvents();
      unsubscribeDone();
    };
  }, [tenantId]);

  const progress = useMemo(
    () =>
      buildResearchTaskEntries({
        events,
        doneRecords,
        researches,
        researchTasks
      }),
    [events, doneRecords, researches, researchTasks]
  );

  useEffect(() => {
    if (!hasFirebaseConfig || !db || !eventsReady || !doneReady) {
      return;
    }

    const pendingEventIds = progress.completedEntries
      .filter((item) => item.status === "OPEN" && item.event_id && !syncingEventIdsRef.current.has(item.event_id))
      .map((item) => item.event_id);

    if (pendingEventIds.length === 0) {
      return;
    }

    pendingEventIds.forEach((eventId) => syncingEventIdsRef.current.add(eventId));

    const batch = writeBatch(db);
    pendingEventIds.forEach((eventId) => {
      batch.set(
        doc(db, RESEARCH_EVENTS_COLLECTION, eventId),
        {
          status: "DONE",
          completed_at: serverTimestamp(),
          updated_at: serverTimestamp(),
          completion_source: "research_tasks_done"
        },
        { merge: true }
      );
    });

    batch
      .commit()
      .catch((error) => {
        console.error("Failed to sync completed research events", error);
      })
      .finally(() => {
        pendingEventIds.forEach((eventId) => syncingEventIdsRef.current.delete(eventId));
      });
  }, [doneReady, eventsReady, progress.completedEntries]);

  const loading = !eventsReady || !doneReady;
  const error = [eventsError, doneError].filter(Boolean).join(" ");

  return {
    events,
    doneRecords,
    openEvents: progress.openEntries,
    openEventsByResearchId: progress.openEntriesByResearchId,
    completedTasks: progress.completedEntries,
    completedTasksByResearchId: progress.completedEntriesByResearchId,
    taskEntries: progress.entries,
    loading,
    error
  };
}
