"use client";

import { createContext, useContext, useEffect, useMemo, useReducer, useRef, useState } from "react";
import { collection, doc, getDocs, writeBatch } from "firebase/firestore";
import { DOMAIN_HYDRATE } from "./action-types";
import { domainInitialState } from "./initial-state";
import { domainReducer, normalizeDomainState } from "./reducer";
import { db, hasFirebaseConfig } from "../../../lib/firebase-client";

const STORAGE_KEY = "geo-domain-state-v1";
const FIRESTORE_COLLECTIONS = {
  tenants: "accounts",
  networks: "networks",
  retailBanners: "retail_banners",
  stores: "stores",
  clusterLevels: "cluster_levels",
  clusters: "clusters",
  priceResearches: "price_researches",
  products: "products",
  userGroups: "user_groups",
  researchSchedules: "research_schedules",
  researchTasks: "research_tasks",
  events: "events"
};
const LEGACY_TENANTS_COLLECTION = "tenants";
const SYNC_KEYS = Object.keys(FIRESTORE_COLLECTIONS);
const MAX_BATCH_WRITES = 450;
const DomainStateContext = createContext(null);

function stripTenantLogos(state) {
  return {
    ...state,
    tenants: Array.isArray(state?.tenants)
      ? state.tenants.map((tenant) => ({
          ...tenant,
          logo_base64: null
        }))
      : []
  };
}

function hasAnyCollectionData(state) {
  return SYNC_KEYS.some((key) => Array.isArray(state?.[key]) && state[key].length > 0);
}

function toEntityMap(items = []) {
  const map = new Map();
  items.forEach((item) => {
    const id = item?.id;
    if (id === null || id === undefined || id === "") {
      return;
    }
    map.set(String(id), item);
  });
  return map;
}

async function migrateLegacyTenantsToAccounts(items = []) {
  if (!db || !Array.isArray(items) || items.length === 0) {
    return;
  }

  for (let offset = 0; offset < items.length; offset += MAX_BATCH_WRITES) {
    const batch = writeBatch(db);
    const chunk = items.slice(offset, offset + MAX_BATCH_WRITES);

    chunk.forEach((item) => {
      const id = String(item?.id || "");
      if (!id) {
        return;
      }
      batch.set(doc(db, FIRESTORE_COLLECTIONS.tenants, id), item, { merge: true });
    });

    await batch.commit();
  }
}

async function readFirestoreState() {
  if (!db) {
    return null;
  }

  const entries = await Promise.all(
    SYNC_KEYS.map(async (key) => {
      const snapshot = await getDocs(collection(db, FIRESTORE_COLLECTIONS[key]));
      let items = snapshot.docs.map((entry) => {
        const payload = entry.data();
        return payload?.id ? payload : { id: entry.id, ...payload };
      });

      if (key === "tenants" && items.length === 0) {
        const legacySnapshot = await getDocs(collection(db, LEGACY_TENANTS_COLLECTION));
        const legacyItems = legacySnapshot.docs.map((entry) => {
          const payload = entry.data();
          return payload?.id ? payload : { id: entry.id, ...payload };
        });

        if (legacyItems.length > 0) {
          items = legacyItems;
          try {
            await migrateLegacyTenantsToAccounts(legacyItems);
          } catch (error) {
            console.error("Failed to migrate legacy tenants collection to accounts", error);
          }
        }
      }

      return [key, items];
    })
  );

  return Object.fromEntries(entries);
}

function createSyncOperations(previousState, nextState) {
  const operations = [];

  SYNC_KEYS.forEach((key) => {
    const collectionName = FIRESTORE_COLLECTIONS[key];
    const previousMap = toEntityMap(previousState?.[key] || []);
    const nextMap = toEntityMap(nextState?.[key] || []);

    nextMap.forEach((nextItem, id) => {
      const previousItem = previousMap.get(id);
      if (!previousItem || JSON.stringify(previousItem) !== JSON.stringify(nextItem)) {
        operations.push({
          kind: "set",
          collectionName,
          id,
          data: nextItem
        });
      }
    });

    previousMap.forEach((_previousItem, id) => {
      if (!nextMap.has(id)) {
        operations.push({
          kind: "delete",
          collectionName,
          id
        });
      }
    });
  });

  return operations;
}

async function syncFirestoreCollections(previousState, nextState) {
  if (!db) {
    return;
  }

  const operations = createSyncOperations(previousState, nextState);
  if (operations.length === 0) {
    return;
  }

  for (let offset = 0; offset < operations.length; offset += MAX_BATCH_WRITES) {
    const batch = writeBatch(db);
    const chunk = operations.slice(offset, offset + MAX_BATCH_WRITES);

    chunk.forEach((operation) => {
      const ref = doc(db, operation.collectionName, operation.id);
      if (operation.kind === "set") {
        batch.set(ref, operation.data);
      } else {
        batch.delete(ref);
      }
    });

    await batch.commit();
  }
}

function persistStateToLocalStorage(state) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(stripTenantLogos(state)));
    } catch (_fallbackError) {
      console.error("Failed to persist domain state", error);
    }
  }
}

export function DomainStateProvider({ children }) {
  const [state, dispatch] = useReducer(domainReducer, domainInitialState);
  const [hydrationDone, setHydrationDone] = useState(false);
  const skipFirstPersistRef = useRef(true);
  const firestoreSyncedStateRef = useRef(domainInitialState);
  const syncQueueRef = useRef(Promise.resolve());

  useEffect(() => {
    let cancelled = false;

    async function hydrateState() {
      let normalized = domainInitialState;
      let shouldBootstrapFirestore = false;
      let remoteLoaded = false;
      let remoteState = null;

      if (hasFirebaseConfig && db) {
        try {
          remoteState = await readFirestoreState();
          remoteLoaded = true;
        } catch (error) {
          console.error("Failed to read domain state from Firestore", error);
        }
      }

      const hasRemoteData = hasAnyCollectionData(remoteState);

      if (remoteLoaded && hasRemoteData) {
        normalized = normalizeDomainState(remoteState);
      } else {
        try {
          const raw = window.localStorage.getItem(STORAGE_KEY);
          if (raw) {
            const parsed = JSON.parse(raw);
            normalized = normalizeDomainState(parsed);

            // Persist once during hydration so old snapshots are upgraded in-place.
            if (JSON.stringify(parsed) !== JSON.stringify(normalized)) {
              persistStateToLocalStorage(normalized);
            }

            shouldBootstrapFirestore = Boolean(hasFirebaseConfig && db && remoteLoaded && !hasRemoteData);
          } else if (remoteLoaded) {
            normalized = normalizeDomainState(remoteState);
          }
        } catch (_error) {
          // ignore hydration issues
        }
      }

      if (cancelled) {
        return;
      }

      dispatch({ type: DOMAIN_HYDRATE, payload: normalized });
      firestoreSyncedStateRef.current = normalized;

      if (hasFirebaseConfig && db && shouldBootstrapFirestore) {
        try {
          await syncFirestoreCollections(domainInitialState, normalized);
          firestoreSyncedStateRef.current = normalized;
        } catch (error) {
          console.error("Failed to bootstrap Firestore with local domain state", error);
        }
      }

      setHydrationDone(true);
    }

    hydrateState();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!hydrationDone) {
      return;
    }

    if (skipFirstPersistRef.current) {
      skipFirstPersistRef.current = false;
      return;
    }

    persistStateToLocalStorage(state);

    if (!(hasFirebaseConfig && db)) {
      firestoreSyncedStateRef.current = state;
      return;
    }

    const nextState = state;
    syncQueueRef.current = syncQueueRef.current
      .catch(() => undefined)
      .then(async () => {
        const previousState = firestoreSyncedStateRef.current;
        await syncFirestoreCollections(previousState, nextState);
        firestoreSyncedStateRef.current = nextState;
      })
      .catch((error) => {
        console.error("Failed to sync domain state to Firestore", error);
      });
  }, [state, hydrationDone]);

  const value = useMemo(() => ({ state, dispatch, hydrationDone }), [state, dispatch, hydrationDone]);
  return <DomainStateContext.Provider value={value}>{children}</DomainStateContext.Provider>;
}

export function useDomainState() {
  const context = useContext(DomainStateContext);
  if (!context) {
    throw new Error("useDomainState must be used inside DomainStateProvider");
  }
  return context;
}
