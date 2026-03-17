import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { db, hasFirebaseConfig } from "../../../lib/firebase-client";

const RESEARCH_EVENTS_COLLECTION = "research_events";

function normalizeDateReference(referenceDateInput = null) {
  const date =
    referenceDateInput instanceof Date
      ? referenceDateInput
      : referenceDateInput
        ? new Date(referenceDateInput)
        : new Date();
  return Number.isNaN(date.getTime()) ? new Date() : date;
}

function isDateInYearMonth(dateYmd, year, month) {
  const match = String(dateYmd || "").match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) {
    return false;
  }
  return Number(match[1]) === Number(year) && Number(match[2]) === Number(month);
}

function buildEventId({ researchServiceId, date, placeId, levelId }) {
  const raw = [
    String(researchServiceId || ""),
    String(date || ""),
    String(placeId || ""),
    String(levelId || "")
  ]
    .join("_")
    .replace(/[^a-zA-Z0-9_-]/g, "_");
  return `evt_${raw}`;
}

function normalizeActor(actorInput = null) {
  if (typeof actorInput === "string" && actorInput.trim()) {
    return actorInput.trim();
  }

  const actor = actorInput && typeof actorInput === "object" ? actorInput : {};
  const fromEmail = String(actor.email || "").trim();
  if (fromEmail) {
    return fromEmail;
  }
  const fromUsername = String(actor.username || "").trim();
  if (fromUsername) {
    return fromUsername;
  }
  const fromUid = String(actor.uid || actor.id || "").trim();
  if (fromUid) {
    return fromUid;
  }
  return "system";
}

function normalizeCoordinate(value) {
  if (value === null || value === undefined || value === "") {
    return null;
  }
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
}

export async function publishResearchEventsForMonth({
  research,
  cluster,
  schedules = [],
  tasks = [],
  stores = [],
  referenceDate = null,
  actor = null,
  maxSubscriptions = 20
}) {
  if (!hasFirebaseConfig || !db) {
    throw new Error("Firebase nao configurado. Defina NEXT_PUBLIC_FIREBASE_* no .env.local.");
  }
  if (!research || !cluster) {
    throw new Error("Servico e cluster sao obrigatorios para publicar eventos.");
  }

  const effectiveDate = normalizeDateReference(referenceDate);
  const year = effectiveDate.getFullYear();
  const month = effectiveDate.getMonth() + 1;
  const normalizedActor = normalizeActor(actor);
  const storeById = new Map((stores || []).map((store) => [String(store.id), store]));
  const levelNameById = new Map(
    (cluster?.levels || []).map((level) => [String(level.id), String(level.name || level.id)])
  );
  const taskByScheduleId = new Map(
    (tasks || []).map((task) => [String(task.research_schedule_id || ""), task])
  );
  const monthSchedules = (schedules || []).filter((item) => isDateInYearMonth(item?.date, year, month));

  let published = 0;
  const errors = [];

  for (const schedule of monthSchedules) {
    const scheduleId = String(schedule?.id || "");
    const placeId = String(schedule?.place_id || "");
    const levelId = String(schedule?.level_id || "");
    const date = String(schedule?.date || "");

    if (!scheduleId || !placeId || !levelId || !date) {
      errors.push({
        schedule_id: scheduleId || null,
        message: "Agenda invalida para publicacao."
      });
      continue;
    }

    const task = taskByScheduleId.get(scheduleId) || null;
    const store = storeById.get(placeId) || null;
    const placeGeoLat =
      normalizeCoordinate(task?.research_place_lat) ??
      normalizeCoordinate(store?.geo?.latlon?.[0]);
    const placeGeoLon =
      normalizeCoordinate(task?.research_place_lon) ??
      normalizeCoordinate(store?.geo?.latlon?.[1]);
    const eventId = buildEventId({
      researchServiceId: research.id,
      date,
      placeId,
      levelId
    });
    const eventRef = doc(db, RESEARCH_EVENTS_COLLECTION, eventId);

    try {
      const existingSnapshot = await getDoc(eventRef);
      const existing = existingSnapshot.exists() ? existingSnapshot.data() : null;
      const nextStatus =
        String(research?.status || "").toUpperCase() === "SUSPENDED" ? "CLOSED" : "OPEN";

      await setDoc(
        eventRef,
        {
          id: eventId,
          tenant_id: String(research.tenant_id || ""),
          research_service_id: String(research.id || ""),
          research_schedule_id: scheduleId,
          research_task_id: String(task?.id || schedule?.research_task_id || ""),
          service_name: String(research.name || "Pesquisa"),
          name: String(research.name || "Pesquisa"),
          date,
          due_date: String(schedule?.due_date || date),
          cluster_id: String(research.cluster_id || ""),
          cluster_name: String(cluster?.name || ""),
          place_id: placeId,
          place_geo_lat: placeGeoLat,
          place_geo_lon: placeGeoLon,
          competitor_name: String(store?.name || placeId),
          level_id: levelId,
          competition_level: String(levelNameById.get(levelId) || levelId),
          list_id: String(schedule?.list_id || ""),
          list_items_count: Number(schedule?.list_items_count || 0),
          value: Number.isFinite(Number(schedule?.value)) ? Number(schedule.value) : 200,
          max_subscriptions:
            Number.isFinite(Number(existing?.max_subscriptions))
              ? Number(existing.max_subscriptions)
              : Number(maxSubscriptions),
          subscriptions_count:
            Number.isFinite(Number(existing?.subscriptions_count))
              ? Number(existing.subscriptions_count)
              : 0,
          status: existing?.status && String(existing.status).toUpperCase() === "DONE"
            ? "DONE"
            : nextStatus,
          source: "web_scheduler",
          created_by: existing?.created_by || normalizedActor,
          updated_by: normalizedActor,
          created_at: existing?.created_at || serverTimestamp(),
          updated_at: serverTimestamp()
        },
        { merge: true }
      );

      published += 1;
    } catch (error) {
      errors.push({
        schedule_id: scheduleId,
        message: error?.message || "Falha ao publicar evento."
      });
    }
  }

  return {
    year,
    month,
    total: monthSchedules.length,
    published,
    failed: errors.length,
    errors
  };
}
