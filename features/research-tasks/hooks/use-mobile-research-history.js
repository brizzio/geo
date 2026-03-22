"use client";

import { collection, limit, onSnapshot, query, where } from "firebase/firestore";
import { useEffect, useState } from "react";
import { db, hasFirebaseConfig } from "../../../lib/firebase-client";
import { normalizeDoneTaskRecord } from "../lib/research-task-completion";

const RESEARCH_TASKS_DONE_COLLECTION = "research_tasks_done";

function normalizeText(value) {
  return String(value || "").trim();
}

function compareHistoryItems(a, b) {
  return String(b?.completed_at || "").localeCompare(String(a?.completed_at || ""));
}

export function useMobileResearchHistory(uid) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const normalizedUid = normalizeText(uid);

    if (!normalizedUid || !hasFirebaseConfig || !db) {
      setItems([]);
      setLoading(false);
      setError("");
      return undefined;
    }

    setLoading(true);
    setError("");

    const historyQuery = query(
      collection(db, RESEARCH_TASKS_DONE_COLLECTION),
      where("uid", "==", normalizedUid),
      limit(300)
    );

    const unsubscribe = onSnapshot(
      historyQuery,
      (snapshot) => {
        const nextItems = snapshot.docs
          .map(normalizeDoneTaskRecord)
          .sort(compareHistoryItems);

        setItems(nextItems);
        setLoading(false);
        setError("");
      },
      (snapshotError) => {
        setItems([]);
        setLoading(false);
        setError(snapshotError?.message || "Falha ao carregar historico de pesquisas.");
      }
    );

    return () => unsubscribe();
  }, [uid]);

  return {
    items,
    loading,
    error
  };
}
