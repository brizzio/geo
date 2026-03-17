import {
  collection,
  doc,
  getDocs,
  limit,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  where
} from "firebase/firestore";
import { db, hasFirebaseConfig } from "./firebase";
import {
  bumpMutationRetry,
  cacheOpenResearchEvents,
  getLocalResearcherProfile,
  listCachedOpenResearchEvents,
  listPendingMutations,
  markLocalSubscription,
  removePendingMutation
} from "./local-db";

const RESEARCHERS_COLLECTION = "researchers";
const EVENTS_COLLECTION = "research_events";
const EVENT_SUBSCRIBERS_SUBCOLLECTION = "subscribers";
const FLAT_SUBSCRIPTIONS_COLLECTION = "research_subscriptions";

function toOpenEvent(snap) {
  const data = snap.data() || {};
  return {
    id: snap.id,
    name: String(data.name || data.service_name || "Pesquisa"),
    date: String(data.date || ""),
    cluster_name: String(data.cluster_name || data.cluster || ""),
    competitor_name: String(data.competitor_name || data.place_name || ""),
    competition_level: String(data.competition_level || data.level_name || ""),
    status: String(data.status || "OPEN").toUpperCase(),
    subscriptions_count: Number(data.subscriptions_count || 0),
    max_subscriptions: Number(data.max_subscriptions || 20)
  };
}

async function pushResearcherProfile(uid) {
  const localProfile = await getLocalResearcherProfile(uid);
  if (!localProfile || !db) {
    return false;
  }

  await setDoc(
    doc(db, RESEARCHERS_COLLECTION, String(uid)),
    {
      uid: String(uid),
      name: String(localProfile.name || ""),
      rg: String(localProfile.rg || ""),
      cpf: String(localProfile.cpf || ""),
      home_address: String(localProfile.home_address || ""),
      work_address: String(localProfile.work_address || ""),
      updated_at: serverTimestamp(),
      created_at: localProfile.created_at || serverTimestamp()
    },
    { merge: true }
  );

  return true;
}

export async function pullOpenEventsFromFirebase() {
  if (!hasFirebaseConfig || !db) {
    return listCachedOpenResearchEvents();
  }

  const q = query(collection(db, EVENTS_COLLECTION), where("status", "==", "OPEN"), limit(200));
  const snapshot = await getDocs(q);
  const events = snapshot.docs.map(toOpenEvent).sort((a, b) => {
    const dateCompare = String(a.date || "").localeCompare(String(b.date || ""));
    if (dateCompare !== 0) {
      return dateCompare;
    }
    return String(a.name || "").localeCompare(String(b.name || ""));
  });
  await cacheOpenResearchEvents(events);
  return events;
}

async function applySubscribeMutation(mutation) {
  if (!db) {
    throw new Error("firebase indisponivel");
  }

  const payload = mutation?.payload || {};
  const eventId = String(payload.event_id || "").trim();
  const uid = String(payload.uid || "").trim();

  if (!eventId || !uid) {
    throw new Error("mutacao invalida");
  }

  const eventRef = doc(db, EVENTS_COLLECTION, eventId);
  const subscriberRef = doc(collection(eventRef, EVENT_SUBSCRIBERS_SUBCOLLECTION), uid);
  const flatSubscriptionRef = doc(db, FLAT_SUBSCRIPTIONS_COLLECTION, `${eventId}_${uid}`);

  await runTransaction(db, async (transaction) => {
    const eventSnap = await transaction.get(eventRef);
    if (!eventSnap.exists()) {
      const error = new Error("evento nao encontrado");
      error.code = "EVENT_NOT_FOUND";
      throw error;
    }

    const subscriberSnap = await transaction.get(subscriberRef);
    if (subscriberSnap.exists()) {
      return;
    }

    const eventData = eventSnap.data() || {};
    const eventStatus = String(eventData.status || "OPEN").toUpperCase();
    if (eventStatus !== "OPEN") {
      const error = new Error("evento fechado para inscricao");
      error.code = "EVENT_CLOSED";
      throw error;
    }

    const maxSubscriptions = Number(eventData.max_subscriptions || 20);
    const currentSubscriptions = Number(eventData.subscriptions_count || 0);

    if (currentSubscriptions >= maxSubscriptions) {
      const error = new Error("limite de inscritos atingido");
      error.code = "EVENT_FULL";
      throw error;
    }

    const now = serverTimestamp();
    const subscriberPayload = {
      uid,
      event_id: eventId,
      status: "SUBSCRIBED",
      researcher_name: String(payload.researcher_name || ""),
      created_at: now,
      updated_at: now
    };

    transaction.set(subscriberRef, subscriberPayload, { merge: true });
    transaction.set(
      flatSubscriptionRef,
      {
        ...subscriberPayload,
        event_ref: eventId
      },
      { merge: true }
    );
    transaction.update(eventRef, {
      subscriptions_count: currentSubscriptions + 1,
      updated_at: now
    });
  });

  await markLocalSubscription({ uid, eventId, status: "SUBSCRIBED" });
}

async function flushPendingMutations(uid) {
  const mutations = await listPendingMutations();

  let processed = 0;
  let failed = 0;

  for (const mutation of mutations) {
    const targetUid = String(mutation?.payload?.uid || "");
    if (targetUid && String(targetUid) !== String(uid)) {
      continue;
    }

    try {
      if (mutation.kind === "SUBSCRIBE_EVENT") {
        await applySubscribeMutation(mutation);
      }
      await removePendingMutation(mutation._id);
      processed += 1;
    } catch (error) {
      const code = String(error?.code || "");
      const eventId = String(mutation?.payload?.event_id || "");
      if (code === "EVENT_FULL" || code === "EVENT_CLOSED" || code === "EVENT_NOT_FOUND") {
        await markLocalSubscription({
          uid,
          eventId,
          status: "REJECTED",
          reason: error?.message || "indisponivel"
        });
        await removePendingMutation(mutation._id);
        processed += 1;
      } else {
        await bumpMutationRetry(mutation._id, error?.message || "falha na sincronizacao");
        failed += 1;
      }
    }
  }

  return { processed, failed };
}

export async function syncAll(uid) {
  if (!uid) {
    return {
      profileSynced: false,
      eventsPulled: 0,
      processedMutations: 0,
      failedMutations: 0
    };
  }

  if (!hasFirebaseConfig || !db) {
    return {
      profileSynced: false,
      eventsPulled: 0,
      processedMutations: 0,
      failedMutations: 0
    };
  }

  const profileSynced = await pushResearcherProfile(uid);
  const events = await pullOpenEventsFromFirebase();
  const mutationResult = await flushPendingMutations(uid);

  return {
    profileSynced,
    eventsPulled: events.length,
    processedMutations: mutationResult.processed,
    failedMutations: mutationResult.failed
  };
}
