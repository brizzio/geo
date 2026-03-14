import { buildId, nowIso, uniqueStrings } from "./model-utils";

export const RESEARCH_SCHEDULE_STATUSES = {
  PENDING: "PENDING",
  IN_PROGRESS: "IN_PROGRESS",
  DONE: "DONE",
  CANCELLED: "CANCELLED"
};

export const RESEARCH_TASK_STATUSES = {
  PENDING: "pending",
  IN_PROGRESS: "in_progress",
  DONE: "done"
};

export const RESEARCH_ITEM_STATUSES = {
  PENDING: "pending",
  COLLECTED: "collected",
  NOT_FOUND: "not_found"
};

const INDEFINITE_HORIZON_DAYS = 90;
const WEEKDAY_BY_UTC_DAY = [
  "SUNDAY",
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY"
];

function parseYmd(value) {
  const raw = String(value || "").trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    return null;
  }
  const [year, month, day] = raw.split("-").map((item) => Number(item));
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }
  return date;
}

function toYmd(date) {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function toBrDate(ymd) {
  const [year, month, day] = String(ymd || "").split("-");
  if (!year || !month || !day) {
    return "";
  }
  return `${day}/${month}/${year}`;
}

function addDays(date, days) {
  const next = new Date(date.getTime());
  next.setUTCDate(next.getUTCDate() + Number(days || 0));
  return next;
}

function getResearchOccurrenceDates(research, options = {}) {
  const start = parseYmd(research?.start_date);
  if (!start) {
    return [];
  }

  const rangeStart = parseYmd(options?.range_start || null);
  const rangeEnd = parseYmd(options?.range_end || null);

  if (!research?.recurrence_enabled) {
    if (rangeStart && start < rangeStart) {
      return [];
    }
    if (rangeEnd && start > rangeEnd) {
      return [];
    }
    return [toYmd(start)];
  }

  const recurrenceWeekdays = new Set(
    (research?.recurrence_weekdays || []).map((item) => String(item || "").toUpperCase())
  );
  if (recurrenceWeekdays.size === 0) {
    return [toYmd(start)];
  }

  const rawDurationDays = Number.parseInt(research?.duration_days, 10);
  const durationDays =
    research?.is_duration_indefinite
      ? INDEFINITE_HORIZON_DAYS
      : Number.isFinite(rawDurationDays) && rawDurationDays > 0
        ? rawDurationDays
        : 1;
  const serviceEnd = addDays(start, durationDays - 1);
  const windowStart = rangeStart && rangeStart > start ? rangeStart : start;
  const windowEnd = rangeEnd && rangeEnd < serviceEnd ? rangeEnd : serviceEnd;
  if (windowEnd < windowStart) {
    return [];
  }

  const dates = [];
  for (let cursor = windowStart; cursor <= windowEnd; cursor = addDays(cursor, 1)) {
    const weekday = WEEKDAY_BY_UTC_DAY[cursor.getUTCDay()];
    if (recurrenceWeekdays.has(weekday)) {
      dates.push(toYmd(cursor));
    }
  }

  return dates.length > 0 ? dates : [toYmd(start)];
}

function mapLevelProductIds(research) {
  const map = new Map();
  (research?.level_product_lists || []).forEach((entry) => {
    const levelId = String(entry?.level_id || "");
    if (!levelId) {
      return;
    }

    const productIds = uniqueStrings((entry?.product_ids || []).map((id) => String(id || ""))).filter(
      Boolean
    );
    map.set(levelId, productIds);
  });
  return map;
}

function collectClusterCompetitorEntries(cluster) {
  const entries = [];
  (cluster?.competitor_groups || []).forEach((group) => {
    const levelId = String(group?.level_id || "");
    if (!levelId) {
      return;
    }

    uniqueStrings((group?.store_ids || []).map((item) => String(item || "")))
      .filter(Boolean)
      .forEach((storeId) => {
        entries.push({
          level_id: levelId,
          place_id: storeId
        });
      });
  });
  return entries;
}

function createResearchTaskItem({
  taskId,
  productId,
  product
}) {
  return {
    id: buildId("research_item"),
    research_task_id: taskId,
    product_id: productId,
    product_name: product?.name || null,
    product_ean: product?.ean || null,
    collected_time: null,
    collected_promotion_label: null,
    collected_stock: null,
    collected_brand: null,
    collected_department: null,
    collected_section: null,
    found: false,
    collected_currency: "BRL",
    collected_retail_unit_price: null,
    collected_wholesale_price: null,
    collected_wholesale_quantity: null,
    collected_promotion: false,
    collected_image: null,
    status: RESEARCH_ITEM_STATUSES.PENDING
  };
}

function createResearchTaskModel({
  tenantId,
  researchServiceId,
  scheduleId,
  clusterId,
  levelId,
  placeId,
  placeLat,
  placeLon,
  dateYmd,
  productIds,
  productsById
}) {
  const taskId = buildId("research_task");
  const researchList = productIds.map((productId) =>
    createResearchTaskItem({
      taskId,
      productId,
      product: productsById.get(String(productId)) || null
    })
  );

  return {
    id: taskId,
    tenant_id: tenantId,
    research_service_id: researchServiceId,
    research_schedule_id: scheduleId,
    cluster_id: clusterId,
    level_id: levelId,
    date: toBrDate(dateYmd),
    start_time: "",
    end_time: "",
    place_id: placeId,
    research_place_lat: placeLat,
    research_place_lon: placeLon,
    research_list: researchList,
    status: RESEARCH_TASK_STATUSES.PENDING,
    created_at: nowIso(),
    updated_at: nowIso()
  };
}

function createResearchScheduleModel({
  scheduleId,
  tenantId,
  researchServiceId,
  clusterId,
  levelId,
  placeId,
  dateYmd,
  listId,
  listItemsCount,
  taskId
}) {
  return {
    id: scheduleId || buildId("research_schedule"),
    tenant_id: tenantId,
    research_service_id: researchServiceId,
    cluster_id: clusterId,
    level_id: levelId,
    date: dateYmd,
    place_id: placeId,
    status: RESEARCH_SCHEDULE_STATUSES.PENDING,
    due_date: dateYmd,
    list_id: listId,
    list_items_count: listItemsCount,
    value: 200,
    research_task_id: taskId,
    created_at: nowIso(),
    updated_at: nowIso()
  };
}

export function normalizeResearchSchedule(item = {}) {
  return {
    ...item,
    id: String(item?.id || buildId("research_schedule")),
    tenant_id: item?.tenant_id ? String(item.tenant_id) : null,
    research_service_id: item?.research_service_id ? String(item.research_service_id) : null,
    cluster_id: item?.cluster_id ? String(item.cluster_id) : null,
    level_id: item?.level_id ? String(item.level_id) : null,
    date: String(item?.date || ""),
    place_id: item?.place_id ? String(item.place_id) : null,
    status: String(item?.status || RESEARCH_SCHEDULE_STATUSES.PENDING).toUpperCase(),
    due_date: String(item?.due_date || item?.date || ""),
    list_id: item?.list_id ? String(item.list_id) : null,
    list_items_count: Number.parseInt(item?.list_items_count, 10) || 0,
    value: Number.isFinite(Number(item?.value)) ? Number(item.value) : 200,
    research_task_id: item?.research_task_id ? String(item.research_task_id) : null,
    created_at: item?.created_at || nowIso(),
    updated_at: item?.updated_at || nowIso()
  };
}

export function normalizeResearchTask(item = {}) {
  const researchList = Array.isArray(item?.research_list)
    ? item.research_list.map((entry) => ({
        ...entry,
        id: String(entry?.id || buildId("research_item")),
        research_task_id: String(entry?.research_task_id || item?.id || ""),
        product_id: entry?.product_id ? String(entry.product_id) : null,
        product_name: entry?.product_name || null,
        product_ean: entry?.product_ean || null,
        found: Boolean(entry?.found),
        collected_currency: entry?.collected_currency || "BRL",
        status: entry?.status || RESEARCH_ITEM_STATUSES.PENDING
      }))
    : [];

  return {
    ...item,
    id: String(item?.id || buildId("research_task")),
    tenant_id: item?.tenant_id ? String(item.tenant_id) : null,
    research_service_id: item?.research_service_id ? String(item.research_service_id) : null,
    research_schedule_id: item?.research_schedule_id ? String(item.research_schedule_id) : null,
    cluster_id: item?.cluster_id ? String(item.cluster_id) : null,
    level_id: item?.level_id ? String(item.level_id) : null,
    date: String(item?.date || ""),
    place_id: item?.place_id ? String(item.place_id) : null,
    research_place_lat:
      item?.research_place_lat === null || item?.research_place_lat === undefined
        ? null
        : Number(item.research_place_lat),
    research_place_lon:
      item?.research_place_lon === null || item?.research_place_lon === undefined
        ? null
        : Number(item.research_place_lon),
    research_list: researchList,
    status: item?.status || RESEARCH_TASK_STATUSES.PENDING,
    created_at: item?.created_at || nowIso(),
    updated_at: item?.updated_at || nowIso()
  };
}

export function createResearchExecutionFromService({
  research,
  cluster,
  stores = [],
  products = [],
  options = {}
}) {
  if (!research || !cluster) {
    return {
      schedules: [],
      tasks: []
    };
  }

  const occurrences = getResearchOccurrenceDates(research, options);
  const competitorEntries = collectClusterCompetitorEntries(cluster);
  if (occurrences.length === 0 || competitorEntries.length === 0) {
    return {
      schedules: [],
      tasks: []
    };
  }

  const storesById = new Map(stores.map((store) => [String(store.id), store]));
  const productsById = new Map(products.map((product) => [String(product.id), product]));
  const productIdsByLevel = mapLevelProductIds(research);
  const fallbackProductIds = uniqueStrings((research?.default_product_ids || []).map((id) => String(id)));
  const schedules = [];
  const tasks = [];
  const visited = new Set();

  occurrences.forEach((dateYmd) => {
    competitorEntries.forEach((entry) => {
      const placeId = String(entry.place_id || "");
      const levelId = String(entry.level_id || "");
      if (!placeId || !levelId) {
        return;
      }

      const uniqueKey = `${dateYmd}|${placeId}|${levelId}`;
      if (visited.has(uniqueKey)) {
        return;
      }
      visited.add(uniqueKey);

      const productIds = uniqueStrings(productIdsByLevel.get(levelId) || fallbackProductIds).filter(Boolean);
      if (productIds.length === 0) {
        return;
      }

      const scheduleId = buildId("research_schedule");
      const store = storesById.get(placeId) || null;
      const placeLat = Number.isFinite(Number(store?.geo?.latlon?.[0])) ? Number(store.geo.latlon[0]) : null;
      const placeLon = Number.isFinite(Number(store?.geo?.latlon?.[1])) ? Number(store.geo.latlon[1]) : null;
      const task = createResearchTaskModel({
        tenantId: String(research.tenant_id),
        researchServiceId: String(research.id),
        scheduleId,
        clusterId: String(research.cluster_id),
        levelId,
        placeId,
        placeLat,
        placeLon,
        dateYmd,
        productIds,
        productsById
      });

      tasks.push(task);
      schedules.push(
        normalizeResearchSchedule(
          createResearchScheduleModel({
            scheduleId,
            tenantId: String(research.tenant_id),
            researchServiceId: String(research.id),
            clusterId: String(research.cluster_id),
            levelId,
            placeId,
            dateYmd,
            listId: `list_${research.id}_${levelId}`,
            listItemsCount: productIds.length,
            taskId: task.id
          })
        )
      );
    });
  });

  return {
    schedules,
    tasks: tasks.map((task) => normalizeResearchTask(task))
  };
}
