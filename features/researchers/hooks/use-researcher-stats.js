"use client";

import { useEffect, useMemo, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db, hasFirebaseConfig } from "../../../lib/firebase-client";

const USERS_COLLECTION = "users";
const SESSIONS_COLLECTION = "sessions";

function normalizeText(value) {
  if (value === null || value === undefined) {
    return "";
  }
  return String(value).trim().toLowerCase();
}

function isRegisteredResearcher(user = {}) {
  const status = normalizeText(user?.status);
  const role = normalizeText(user?.role);
  const type = normalizeText(user?.type);
  return status === "registered" && (role === "researcher" || type === "researcher");
}

function isSessionOpen(session = {}) {
  if (!session?.active) {
    return false;
  }

  const expiresAt = String(session?.timestamps?.expiresAt || "").trim();
  if (!expiresAt) {
    return false;
  }

  const expiresAtTimestamp = Date.parse(expiresAt);
  if (!Number.isFinite(expiresAtTimestamp)) {
    return false;
  }

  return expiresAtTimestamp > Date.now();
}

export function useResearcherStats() {
  const [users, setUsers] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const stats = useMemo(() => {
    const registeredResearchers = users.filter(isRegisteredResearcher);
    const registeredResearcherIds = new Set(
      registeredResearchers
        .map((user) => String(user?.uid || user?.user_id || user?.id || "").trim())
        .filter(Boolean)
    );
    const activeResearcherIds = new Set(
      sessions
        .filter(isSessionOpen)
        .map((sessionItem) => String(sessionItem?.userId || "").trim())
        .filter((userId) => registeredResearcherIds.has(userId))
    );

    return {
      total: registeredResearchers.length,
      active: activeResearcherIds.size
    };
  }, [users, sessions]);

  useEffect(() => {
    if (!hasFirebaseConfig || !db) {
      setUsers([]);
      setSessions([]);
      setLoading(false);
      setError("");
      return () => undefined;
    }

    let usersReady = false;
    let sessionsReady = false;

    function syncLoading() {
      if (usersReady && sessionsReady) {
        setLoading(false);
      }
    }

    const unsubscribeUsers = onSnapshot(
      collection(db, USERS_COLLECTION),
      (snapshot) => {
        usersReady = true;
        setUsers(
          (snapshot?.docs || []).map((docItem) => ({
            id: String(docItem.id || ""),
            ...(docItem.data() || {})
          }))
        );
        setError("");
        syncLoading();
      },
      (snapshotError) => {
        usersReady = true;
        setUsers([]);
        setError(snapshotError?.message || "Falha ao carregar pesquisadores.");
        syncLoading();
      }
    );

    const unsubscribeSessions = onSnapshot(
      collection(db, SESSIONS_COLLECTION),
      (snapshot) => {
        sessionsReady = true;
        setSessions(
          (snapshot?.docs || []).map((docItem) => ({
            id: String(docItem.id || ""),
            ...(docItem.data() || {})
          }))
        );
        setError("");
        syncLoading();
      },
      (snapshotError) => {
        sessionsReady = true;
        setSessions([]);
        setError(snapshotError?.message || "Falha ao carregar sessoes.");
        syncLoading();
      }
    );

    return () => {
      unsubscribeUsers();
      unsubscribeSessions();
    };
  }, []);

  return {
    total: stats.total,
    active: stats.active,
    loading,
    error
  };
}
