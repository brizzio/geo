import PouchDB from "pouchdb-browser";

const localDb = new PouchDB("geo-mobile-pwa");

function nowIso() {
  return new Date().toISOString();
}

async function getDocOrNull(id) {
  try {
    return await localDb.get(id);
  } catch (error) {
    if (error?.status === 404) {
      return null;
    }
    throw error;
  }
}

async function upsertDoc(id, updater) {
  const existing = await getDocOrNull(id);
  const next = updater(existing);
  if (!next) {
    return null;
  }

  const payload = {
    ...next,
    _id: id,
    _rev: existing?._rev,
    updated_at: nowIso()
  };

  const result = await localDb.put(payload);
  return {
    ...payload,
    _rev: result.rev
  };
}

async function listByPrefix(prefix) {
  const response = await localDb.allDocs({
    include_docs: true,
    startkey: prefix,
    endkey: `${prefix}\ufff0`
  });
  return response.rows.map((row) => row.doc).filter(Boolean);
}

export async function saveLocalResearcherProfile(profile) {
  const uid = String(profile?.uid || "").trim();
  if (!uid) {
    throw new Error("uid obrigatorio para salvar perfil local");
  }

  const id = `researcher_profile:${uid}`;
  return upsertDoc(id, (existing) => ({
    ...existing,
    type: "researcher_profile",
    uid,
    name: String(profile?.name || "").trim(),
    rg: String(profile?.rg || "").trim(),
    cpf: String(profile?.cpf || "").trim(),
    home_address: String(profile?.home_address || "").trim(),
    work_address: String(profile?.work_address || "").trim(),
    created_at: existing?.created_at || nowIso()
  }));
}

export async function getLocalResearcherProfile(uid) {
  if (!uid) {
    return null;
  }
  return getDocOrNull(`researcher_profile:${String(uid)}`);
}

export async function cacheOpenResearchEvents(events = []) {
  const normalized = Array.isArray(events) ? events : [];
  for (const event of normalized) {
    const eventId = String(event?.id || "").trim();
    if (!eventId) {
      continue;
    }

    await upsertDoc(`open_event:${eventId}`, (existing) => ({
      ...existing,
      type: "open_event",
      event_id: eventId,
      name: event?.name || "Pesquisa",
      date: event?.date || "",
      cluster_name: event?.cluster_name || "",
      competitor_name: event?.competitor_name || "",
      competition_level: event?.competition_level || "",
      status: event?.status || "OPEN",
      subscriptions_count: Number(event?.subscriptions_count || 0),
      max_subscriptions: Number(event?.max_subscriptions || 20),
      created_at: existing?.created_at || nowIso()
    }));
  }
}

export async function listCachedOpenResearchEvents() {
  const docs = await listByPrefix("open_event:");
  return docs
    .map((doc) => ({
      id: doc.event_id,
      name: doc.name,
      date: doc.date,
      cluster_name: doc.cluster_name,
      competitor_name: doc.competitor_name,
      competition_level: doc.competition_level,
      status: doc.status,
      subscriptions_count: Number(doc.subscriptions_count || 0),
      max_subscriptions: Number(doc.max_subscriptions || 20)
    }))
    .sort((a, b) => {
      const dateA = String(a.date || "");
      const dateB = String(b.date || "");
      if (dateA !== dateB) {
        return dateA.localeCompare(dateB);
      }
      return String(a.name || "").localeCompare(String(b.name || ""));
    });
}

export async function queuePendingMutation(kind, payload) {
  const id = `mutation:${Date.now()}:${Math.random().toString(36).slice(2, 10)}`;
  await localDb.put({
    _id: id,
    type: "pending_mutation",
    kind,
    payload,
    retries: 0,
    last_error: "",
    created_at: nowIso(),
    updated_at: nowIso()
  });
  return id;
}

export async function listPendingMutations() {
  const docs = await listByPrefix("mutation:");
  return docs.sort((a, b) => String(a.created_at || "").localeCompare(String(b.created_at || "")));
}

export async function removePendingMutation(id) {
  const existing = await getDocOrNull(id);
  if (!existing) {
    return;
  }
  await localDb.remove(existing);
}

export async function bumpMutationRetry(id, errorMessage) {
  return upsertDoc(id, (existing) => {
    if (!existing) {
      return null;
    }
    return {
      ...existing,
      retries: Number(existing.retries || 0) + 1,
      last_error: String(errorMessage || "erro de sincronizacao")
    };
  });
}

export async function markLocalSubscription({ uid, eventId, status, reason = "" }) {
  const cleanUid = String(uid || "").trim();
  const cleanEventId = String(eventId || "").trim();
  if (!cleanUid || !cleanEventId) {
    throw new Error("uid e eventId sao obrigatorios");
  }

  const id = `subscription:${cleanUid}:${cleanEventId}`;
  return upsertDoc(id, (existing) => ({
    ...existing,
    type: "local_subscription",
    uid: cleanUid,
    event_id: cleanEventId,
    status: String(status || "PENDING_SYNC"),
    reason: String(reason || ""),
    created_at: existing?.created_at || nowIso()
  }));
}

export async function listLocalSubscriptions(uid) {
  if (!uid) {
    return [];
  }
  const docs = await listByPrefix(`subscription:${String(uid)}:`);
  return docs.map((doc) => ({
    event_id: String(doc.event_id || ""),
    status: String(doc.status || "PENDING_SYNC"),
    reason: String(doc.reason || "")
  }));
}
