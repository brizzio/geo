"use client";

import { collection, limit, onSnapshot, query, where } from "firebase/firestore";
import { useEffect, useMemo, useState } from "react";
import { db, hasFirebaseConfig } from "../../../lib/firebase-client";

const RESEARCH_EVENTS_COLLECTION = "research_events";

function normalizeText(value) {
  return String(value || "").trim();
}

function normalizeNumber(value, fallback = 0) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

function normalizeEvent(docSnap) {
  const data = docSnap.data() || {};

  return {
    id: String(docSnap.id || ""),
    research_service_id: normalizeText(data?.research_service_id || ""),
    date: normalizeText(data?.date || ""),
    competitor_name: normalizeText(data?.competitor_name || ""),
    competition_level: normalizeText(data?.competition_level || ""),
    subscriptions_count: normalizeNumber(data?.subscriptions_count, 0),
    max_subscriptions: normalizeNumber(data?.max_subscriptions, 20),
    status: normalizeText(data?.status || "").toUpperCase()
  };
}

function compareEvents(a, b) {
  const byDate = String(a?.date || "").localeCompare(String(b?.date || ""));
  if (byDate !== 0) {
    return byDate;
  }

  return String(a?.competitor_name || "").localeCompare(String(b?.competitor_name || ""));
}

export function useOpenResearchEvents(tenantId) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const normalizedTenantId = normalizeText(tenantId);

    if (!normalizedTenantId || !hasFirebaseConfig || !db) {
      setEvents([]);
      setLoading(false);
      setError("");
      return undefined;
    }

    setLoading(true);
    setError("");

    const eventsQuery = query(
      collection(db, RESEARCH_EVENTS_COLLECTION),
      where("tenant_id", "==", normalizedTenantId),
      limit(500)
    );

    const unsubscribe = onSnapshot(
      eventsQuery,
      (snapshot) => {
        const nextEvents = snapshot.docs
          .map(normalizeEvent)
          .filter((item) => item.status === "OPEN" && item.research_service_id)
          .sort(compareEvents);

        setEvents(nextEvents);
        setLoading(false);
        setError("");
      },
      (snapshotError) => {
        setEvents([]);
        setLoading(false);
        setError(snapshotError?.message || "Falha ao carregar eventos abertos.");
      }
    );

    return () => unsubscribe();
  }, [tenantId]);

  const eventsByResearchId = useMemo(() => {
    const grouped = {};

    events.forEach((item) => {
      const researchId = String(item?.research_service_id || "");
      if (!researchId) {
        return;
      }

      if (!grouped[researchId]) {
        grouped[researchId] = [];
      }

      grouped[researchId].push(item);
    });

    return grouped;
  }, [events]);

  return {
    events,
    eventsByResearchId,
    loading,
    error
  };
}
