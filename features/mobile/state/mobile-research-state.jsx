"use client";

import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  where
} from "firebase/firestore";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useFirebaseAuth } from "../../auth/state/firebase-auth-context";
import { db, hasFirebaseConfig } from "../../../lib/firebase-client";

const MobileResearchStateContext = createContext(null);

const RESEARCHERS_COLLECTION = "researchers";
const RESEARCH_EVENTS_COLLECTION = "research_events";
const RESEARCH_SUBSCRIPTIONS_COLLECTION = "research_subscriptions";
const RESEARCH_SUBSCRIBERS_SUBCOLLECTION = "subscribers";
const USERS_COLLECTION = "users";
const ACCOUNTS_COLLECTION = "accounts";
const STORES_COLLECTION = "stores";
const DISTANCE_REFERENCE_WORK = "WORK";
const DISTANCE_REFERENCE_HOME = "HOME";

const EMPTY_PROFILE = {
  name: "",
  rg: "",
  cpf: "",
  home_address: "",
  work_address: "",
  preferred_tenants: [],
  home_geo_lat: null,
  home_geo_lon: null,
  home_geo_display_name: "",
  work_geo_lat: null,
  work_geo_lon: null,
  work_geo_display_name: "",
  present_lat: null,
  present_lon: null,
  present_display_name: "",
  distance_reference: DISTANCE_REFERENCE_WORK
};

function normalizeText(value) {
  return String(value || "").trim();
}

function normalizeTenantIds(value) {
  const source = Array.isArray(value) ? value : [];
  return [...new Set(source.map((item) => normalizeText(item)).filter(Boolean))];
}

function normalizeCoordinate(value) {
  if (value === null || value === undefined || value === "") {
    return null;
  }
  const parsed = Number(String(value).replace(",", "."));
  return Number.isFinite(parsed) ? parsed : null;
}

function normalizeDistanceReference(value) {
  const normalized = normalizeText(value).toUpperCase();
  return normalized === DISTANCE_REFERENCE_HOME
    ? DISTANCE_REFERENCE_HOME
    : DISTANCE_REFERENCE_WORK;
}

function normalizeResearcherProfileFromFirestore(data = {}, authProfile = {}, currentUser = null) {
  return {
    name: normalizeText(data?.name || authProfile?.display_name || currentUser?.displayName || ""),
    rg: normalizeText(data?.rg || ""),
    cpf: normalizeText(data?.cpf || ""),
    home_address: normalizeText(data?.home_address || ""),
    work_address: normalizeText(data?.work_address || ""),
    preferred_tenants: normalizeTenantIds(
      data?.preferred_tenants || authProfile?.preferred_tenants || authProfile?.tenant_ids || []
    ),
    home_geo_lat: normalizeCoordinate(data?.home_geo_lat),
    home_geo_lon: normalizeCoordinate(data?.home_geo_lon),
    home_geo_display_name: normalizeText(data?.home_geo_display_name || ""),
    work_geo_lat: normalizeCoordinate(data?.work_geo_lat),
    work_geo_lon: normalizeCoordinate(data?.work_geo_lon),
    work_geo_display_name: normalizeText(data?.work_geo_display_name || ""),
    present_lat: normalizeCoordinate(data?.present_lat),
    present_lon: normalizeCoordinate(data?.present_lon),
    present_display_name: normalizeText(data?.present_display_name || ""),
    distance_reference: normalizeDistanceReference(
      data?.distance_reference || authProfile?.distance_reference
    )
  };
}

function normalizeOpenEventFromFirestore(docSnap, storeGeoById = new Map()) {
  const data = docSnap.data() || {};
  const placeId = normalizeText(data?.place_id || "");
  const fallbackGeo = storeGeoById.get(placeId) || null;
  const placeGeoLat =
    normalizeCoordinate(data?.place_geo_lat) ??
    normalizeCoordinate(fallbackGeo?.lat);
  const placeGeoLon =
    normalizeCoordinate(data?.place_geo_lon) ??
    normalizeCoordinate(fallbackGeo?.lon);

  return {
    id: String(docSnap.id),
    tenant_id: normalizeText(data?.tenant_id || ""),
    name: normalizeText(data?.name || data?.service_name || "Pesquisa"),
    date: normalizeText(data?.date || ""),
    cluster_name: normalizeText(data?.cluster_name || ""),
    competitor_name: normalizeText(data?.competitor_name || ""),
    competition_level: normalizeText(data?.competition_level || ""),
    place_id: placeId,
    place_geo_lat: placeGeoLat,
    place_geo_lon: placeGeoLon,
    status: normalizeText(data?.status || "OPEN").toUpperCase(),
    subscriptions_count: Number(data?.subscriptions_count || 0),
    max_subscriptions: Number(data?.max_subscriptions || 20)
  };
}

function mapSubscriptionsByEvent(subscriptions = []) {
  const map = {};
  subscriptions.forEach((entry) => {
    const eventId = normalizeText(entry?.event_id || "");
    if (!eventId) {
      return;
    }
    map[eventId] = {
      status: normalizeText(entry?.status || "SUBSCRIBED").toUpperCase(),
      reason: normalizeText(entry?.reason || "")
    };
  });
  return map;
}

export function MobileResearchProvider({ children }) {
  const { currentUser, profile, loading: authLoading } = useFirebaseAuth();
  const [researcherProfile, setResearcherProfile] = useState(EMPTY_PROFILE);
  const [tenantOptions, setTenantOptions] = useState([]);
  const [events, setEvents] = useState([]);
  const [subscriptionsByEvent, setSubscriptionsByEvent] = useState({});
  const [loading, setLoading] = useState(false);
  const [hydrationDone, setHydrationDone] = useState(false);
  const [error, setError] = useState("");
  const [subscribingEventId, setSubscribingEventId] = useState("");

  const isResearcher = useMemo(
    () => normalizeText(profile?.type).toLowerCase() === "researcher",
    [profile?.type]
  );

  const refresh = useCallback(
    async (options = {}) => {
      if (!hasFirebaseConfig || !db) {
        throw new Error("Firebase nao configurado.");
      }
      if (!currentUser?.uid) {
        return;
      }
      if (!isResearcher) {
        return;
      }

      const silent = Boolean(options?.silent);
      if (!silent) {
        setLoading(true);
      }
      setError("");

      try {
        const uid = String(currentUser.uid);
        const researcherRef = doc(db, RESEARCHERS_COLLECTION, uid);
        const researcherSnapshotPromise = getDoc(researcherRef);
        const eventsQuery = query(
          collection(db, RESEARCH_EVENTS_COLLECTION),
          where("status", "==", "OPEN"),
          limit(300)
        );
        const accountsQuery = query(collection(db, ACCOUNTS_COLLECTION), limit(500));
        const storesQuery = query(collection(db, STORES_COLLECTION), limit(1200));
        const researcherUsersQuery = query(
          collection(db, USERS_COLLECTION),
          where("type", "==", "researcher"),
          limit(500)
        );
        const subscriptionsQuery = query(
          collection(db, RESEARCH_SUBSCRIPTIONS_COLLECTION),
          where("uid", "==", uid),
          limit(300)
        );
        const [
          researcherSnapshot,
          eventsSnapshot,
          accountsSnapshot,
          storesSnapshot,
          researcherUsersSnapshot,
          subscriptionsSnapshot
        ] =
          await Promise.all([
          researcherSnapshotPromise,
          getDocs(eventsQuery),
          getDocs(accountsQuery),
          getDocs(storesQuery),
          getDocs(researcherUsersQuery),
          getDocs(subscriptionsQuery)
        ]);

        const profileFromFirestore = researcherSnapshot.exists() ? researcherSnapshot.data() : {};
        setResearcherProfile(
          normalizeResearcherProfileFromFirestore(profileFromFirestore, profile, currentUser)
        );

        const storeGeoById = new Map(
          storesSnapshot.docs.map((item) => {
            const data = item.data() || {};
            const lat = normalizeCoordinate(data?.geo?.latlon?.[0]);
            const lon = normalizeCoordinate(data?.geo?.latlon?.[1]);
            return [String(item.id), { lat, lon }];
          })
        );

        const nextEvents = eventsSnapshot.docs
          .map((item) => normalizeOpenEventFromFirestore(item, storeGeoById))
          .sort((a, b) => {
            const byDate = String(a.date || "").localeCompare(String(b.date || ""));
            if (byDate !== 0) {
              return byDate;
            }
            return String(a.name || "").localeCompare(String(b.name || ""));
          });
        setEvents(nextEvents);
        const blockedTenantIds = new Set();
        researcherUsersSnapshot.docs.forEach((item) => {
          const userData = item.data() || {};
          const researcherUid = normalizeText(item.id || "");
          if (researcherUid) {
            blockedTenantIds.add(`tenant_${researcherUid}`);
          }
          const defaultTenantId = normalizeText(userData?.default_tenant_id || "");
          if (defaultTenantId) {
            blockedTenantIds.add(defaultTenantId);
          }
          normalizeTenantIds(userData?.tenant_ids || []).forEach((tenantId) => {
            blockedTenantIds.add(tenantId);
          });
        });
        const nextTenantOptions = accountsSnapshot.docs
          .filter((item) => !blockedTenantIds.has(String(item.id || "")))
          .map((item) => {
            const data = item.data() || {};
            return {
              id: String(item.id),
              name: normalizeText(data?.name || data?.display_name || item.id)
            };
          })
          .sort((a, b) => String(a.name || "").localeCompare(String(b.name || "")));
        setTenantOptions(nextTenantOptions);
        setSubscriptionsByEvent(
          mapSubscriptionsByEvent(subscriptionsSnapshot.docs.map((item) => item.data() || {}))
        );
      } catch (refreshError) {
        setError(refreshError?.message || "Falha ao carregar dados mobile.");
      } finally {
        if (!silent) {
          setLoading(false);
        }
        setHydrationDone(true);
      }
    },
    [currentUser, isResearcher, profile]
  );

  const saveResearcherProfile = useCallback(
    async (values) => {
      if (!hasFirebaseConfig || !db) {
        throw new Error("Firebase nao configurado.");
      }
      if (!currentUser?.uid) {
        throw new Error("Usuario nao autenticado.");
      }

      const uid = String(currentUser.uid);
      const payload = {
        uid,
        name: normalizeText(values?.name || ""),
        rg: normalizeText(values?.rg || ""),
        cpf: normalizeText(values?.cpf || ""),
        home_address: normalizeText(values?.home_address || ""),
        work_address: normalizeText(values?.work_address || ""),
        preferred_tenants: normalizeTenantIds(values?.preferred_tenants || []),
        home_geo_lat: normalizeCoordinate(values?.home_geo_lat),
        home_geo_lon: normalizeCoordinate(values?.home_geo_lon),
        home_geo_display_name: normalizeText(values?.home_geo_display_name || ""),
        work_geo_lat: normalizeCoordinate(values?.work_geo_lat),
        work_geo_lon: normalizeCoordinate(values?.work_geo_lon),
        work_geo_display_name: normalizeText(values?.work_geo_display_name || ""),
        present_lat: normalizeCoordinate(values?.present_lat),
        present_lon: normalizeCoordinate(values?.present_lon),
        present_display_name: normalizeText(values?.present_display_name || ""),
        distance_reference: normalizeDistanceReference(
          values?.distance_reference || researcherProfile?.distance_reference
        ),
        email: normalizeText(currentUser.email || ""),
        updated_at: serverTimestamp(),
        created_at: serverTimestamp()
      };

      await setDoc(doc(db, RESEARCHERS_COLLECTION, uid), payload, { merge: true });
      await setDoc(
        doc(db, USERS_COLLECTION, uid),
        {
          uid,
          preferred_tenants: payload.preferred_tenants,
          home_geo_lat: payload.home_geo_lat,
          home_geo_lon: payload.home_geo_lon,
          work_geo_lat: payload.work_geo_lat,
          work_geo_lon: payload.work_geo_lon,
          present_lat: payload.present_lat,
          present_lon: payload.present_lon,
          present_display_name: payload.present_display_name,
          distance_reference: payload.distance_reference,
          updated_at: serverTimestamp()
        },
        { merge: true }
      );

      setResearcherProfile({
        name: payload.name,
        rg: payload.rg,
        cpf: payload.cpf,
        home_address: payload.home_address,
        work_address: payload.work_address,
        preferred_tenants: payload.preferred_tenants,
        home_geo_lat: payload.home_geo_lat,
        home_geo_lon: payload.home_geo_lon,
        home_geo_display_name: payload.home_geo_display_name,
        work_geo_lat: payload.work_geo_lat,
        work_geo_lon: payload.work_geo_lon,
        work_geo_display_name: payload.work_geo_display_name,
        present_lat: payload.present_lat,
        present_lon: payload.present_lon,
        present_display_name: payload.present_display_name,
        distance_reference: payload.distance_reference
      });
      return true;
    },
    [currentUser, researcherProfile?.distance_reference]
  );

  const updateDistanceReference = useCallback(
    async (referenceInput) => {
      if (!hasFirebaseConfig || !db) {
        throw new Error("Firebase nao configurado.");
      }
      if (!currentUser?.uid) {
        throw new Error("Usuario nao autenticado.");
      }
      if (!isResearcher) {
        throw new Error("Apenas researcher pode atualizar a referencia de distancia.");
      }

      const uid = String(currentUser.uid);
      const distanceReference = normalizeDistanceReference(referenceInput);
      await setDoc(
        doc(db, RESEARCHERS_COLLECTION, uid),
        {
          uid,
          distance_reference: distanceReference,
          updated_at: serverTimestamp()
        },
        { merge: true }
      );
      await setDoc(
        doc(db, USERS_COLLECTION, uid),
        {
          uid,
          distance_reference: distanceReference,
          updated_at: serverTimestamp()
        },
        { merge: true }
      );
      setResearcherProfile((previous) => ({
        ...(previous || EMPTY_PROFILE),
        distance_reference: distanceReference
      }));
      return distanceReference;
    },
    [currentUser, isResearcher]
  );

  const subscribeToEvent = useCallback(
    async (eventIdInput) => {
      if (!hasFirebaseConfig || !db) {
        throw new Error("Firebase nao configurado.");
      }
      if (!currentUser?.uid) {
        throw new Error("Usuario nao autenticado.");
      }
      if (!isResearcher) {
        throw new Error("Apenas researcher pode se inscrever.");
      }

      const eventId = normalizeText(eventIdInput || "");
      if (!eventId) {
        throw new Error("Evento invalido.");
      }

      setSubscribingEventId(eventId);
      setError("");

      try {
        const uid = String(currentUser.uid);
        const eventRef = doc(db, RESEARCH_EVENTS_COLLECTION, eventId);
        const subscriberRef = doc(collection(eventRef, RESEARCH_SUBSCRIBERS_SUBCOLLECTION), uid);
        const flatSubscriptionRef = doc(db, RESEARCH_SUBSCRIPTIONS_COLLECTION, `${eventId}_${uid}`);
        const result = await runTransaction(db, async (transaction) => {
          const eventSnapshot = await transaction.get(eventRef);
          if (!eventSnapshot.exists()) {
            const notFoundError = new Error("Evento nao encontrado.");
            notFoundError.code = "EVENT_NOT_FOUND";
            throw notFoundError;
          }

          const subscriberSnapshot = await transaction.get(subscriberRef);
          if (subscriberSnapshot.exists()) {
            return { status: "ALREADY_SUBSCRIBED" };
          }

          const eventData = eventSnapshot.data() || {};
          const eventStatus = normalizeText(eventData?.status || "OPEN").toUpperCase();
          if (eventStatus !== "OPEN") {
            const closedError = new Error("Evento fechado para inscricao.");
            closedError.code = "EVENT_CLOSED";
            throw closedError;
          }

          const maxSubscriptions = Number(eventData?.max_subscriptions || 20);
          const subscriptionsCount = Number(eventData?.subscriptions_count || 0);
          if (subscriptionsCount >= maxSubscriptions) {
            const fullError = new Error("Limite de inscritos atingido.");
            fullError.code = "EVENT_FULL";
            throw fullError;
          }

          const subscriptionPayload = {
            uid,
            event_id: eventId,
            status: "SUBSCRIBED",
            reason: "",
            researcher_name: normalizeText(researcherProfile?.name || currentUser.displayName || ""),
            created_at: serverTimestamp(),
            updated_at: serverTimestamp()
          };

          transaction.set(subscriberRef, subscriptionPayload, { merge: true });
          transaction.set(flatSubscriptionRef, subscriptionPayload, { merge: true });
          transaction.update(eventRef, {
            subscriptions_count: subscriptionsCount + 1,
            updated_at: serverTimestamp()
          });

          return { status: "SUBSCRIBED" };
        });

        setSubscriptionsByEvent((previous) => ({
          ...previous,
          [eventId]: {
            status: "SUBSCRIBED",
            reason: ""
          }
        }));

        setEvents((previous) =>
          previous.map((eventItem) =>
            String(eventItem.id) === eventId
              ? {
                  ...eventItem,
                  subscriptions_count: Number(eventItem.subscriptions_count || 0) + (result.status === "SUBSCRIBED" ? 1 : 0)
                }
              : eventItem
          )
        );

        return result;
      } finally {
        setSubscribingEventId("");
      }
    },
    [currentUser, isResearcher, researcherProfile?.name]
  );

  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (!currentUser || !isResearcher) {
      setResearcherProfile(EMPTY_PROFILE);
      setTenantOptions([]);
      setEvents([]);
      setSubscriptionsByEvent({});
      setLoading(false);
      setError("");
      setHydrationDone(true);
      setSubscribingEventId("");
      return;
    }

    refresh();
  }, [authLoading, currentUser, isResearcher, refresh]);

  const value = useMemo(
    () => ({
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
      saveResearcherProfile,
      subscribeToEvent,
      updateDistanceReference
    }),
    [
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
      saveResearcherProfile,
      subscribeToEvent,
      updateDistanceReference
    ]
  );

  return (
    <MobileResearchStateContext.Provider value={value}>{children}</MobileResearchStateContext.Provider>
  );
}

export function useMobileResearchState() {
  const context = useContext(MobileResearchStateContext);
  if (!context) {
    throw new Error("useMobileResearchState must be used inside MobileResearchProvider");
  }
  return context;
}
