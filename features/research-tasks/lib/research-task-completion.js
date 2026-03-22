"use client";

function normalizeText(value) {
  return String(value || "").trim();
}

function normalizeNumber(value, fallback = null) {
  if (value === null || value === undefined || value === "") {
    return fallback;
  }

  const parsed = Number(String(value).replace(",", "."));
  return Number.isFinite(parsed) ? parsed : fallback;
}

function normalizeDateTime(value) {
  if (!value) {
    return null;
  }

  if (typeof value?.toDate === "function") {
    const converted = value.toDate();
    return converted instanceof Date && !Number.isNaN(converted.getTime())
      ? converted.toISOString()
      : null;
  }

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value.toISOString();
  }

  if (typeof value === "number") {
    const converted = new Date(value);
    return Number.isNaN(converted.getTime()) ? null : converted.toISOString();
  }

  const raw = normalizeText(value);
  if (!raw) {
    return null;
  }

  const converted = new Date(raw);
  return Number.isNaN(converted.getTime()) ? null : converted.toISOString();
}

function normalizeBoolean(value) {
  return Boolean(value);
}

export function getResearchTaskCoverageKey(item = {}) {
  return normalizeText(item?.product_id || item?.item_id || item?.id || "");
}

export function hasCollectedPrice(item = {}) {
  return normalizeNumber(item?.first_price, null) !== null;
}

export function buildResearchTaskKey(source = {}) {
  return normalizeText(source?.research_task_id || source?.task_id || source?.event_id || source?.id || "");
}

export function normalizeExpectedProducts(items = []) {
  const seen = new Set();

  return (Array.isArray(items) ? items : [])
    .map((item) => {
      const coverageKey = getResearchTaskCoverageKey(item);
      if (!coverageKey || seen.has(coverageKey)) {
        return null;
      }

      seen.add(coverageKey);
      return {
        coverage_key: coverageKey,
        product_id: normalizeText(item?.product_id || ""),
        product_name: normalizeText(item?.product_name || "") || null,
        product_ean: normalizeText(item?.product_ean || "") || null
      };
    })
    .filter(Boolean);
}

export function normalizeResearchEvent(source = {}) {
  const payload = typeof source?.data === "function" ? source.data() || {} : source || {};
  const id = normalizeText(source?.id || payload?.id || "");

  return {
    id,
    tenant_id: normalizeText(payload?.tenant_id || ""),
    research_service_id: normalizeText(payload?.research_service_id || ""),
    research_schedule_id: normalizeText(payload?.research_schedule_id || ""),
    research_task_id: normalizeText(payload?.research_task_id || ""),
    level_id: normalizeText(payload?.level_id || ""),
    date: normalizeText(payload?.date || ""),
    due_date: normalizeText(payload?.due_date || ""),
    competitor_name: normalizeText(payload?.competitor_name || ""),
    competition_level: normalizeText(payload?.competition_level || ""),
    place_id: normalizeText(payload?.place_id || ""),
    status: normalizeText(payload?.status || "").toUpperCase(),
    subscriptions_count: normalizeNumber(payload?.subscriptions_count, 0),
    max_subscriptions: normalizeNumber(payload?.max_subscriptions, 20)
  };
}

export function normalizeDoneTaskRecord(source = {}) {
  const payload = typeof source?.data === "function" ? source.data() || {} : source || {};
  const id = normalizeText(source?.id || payload?.id || "");
  const collectionItems = Array.isArray(payload?.collection?.items)
    ? payload.collection.items
    : Array.isArray(payload?.items)
      ? payload.items
      : [];

  return {
    id,
    event_id: normalizeText(payload?.event_id || ""),
    tenant_id: normalizeText(payload?.tenant_id || ""),
    uid: normalizeText(payload?.uid || ""),
    researcher_name: normalizeText(payload?.researcher_name || ""),
    research_service_id: normalizeText(payload?.research_service_id || ""),
    research_schedule_id: normalizeText(payload?.research_schedule_id || ""),
    research_task_id: normalizeText(payload?.research_task_id || ""),
    status: normalizeText(payload?.status || "").toUpperCase(),
    accepted_at: normalizeDateTime(payload?.accepted_at),
    deadline_at: normalizeDateTime(payload?.deadline_at),
    started_at: normalizeDateTime(payload?.started_at),
    completed_at: normalizeDateTime(payload?.completed_at),
    meta: {
      event_name: normalizeText(payload?.meta?.event_name || ""),
      competitor_name: normalizeText(payload?.meta?.competitor_name || ""),
      competition_level: normalizeText(payload?.meta?.competition_level || ""),
      address_display_name: normalizeText(payload?.meta?.address_display_name || "")
    },
    facade_photo: payload?.facade_photo || null,
    items: collectionItems.map((item) => ({
      item_id: normalizeText(item?.item_id || item?.id || ""),
      product_id: normalizeText(item?.product_id || ""),
      product_name: normalizeText(item?.product_name || "") || null,
      product_ean: normalizeText(item?.product_ean || "") || null,
      first_price: normalizeNumber(item?.first_price, null),
      second_price: normalizeNumber(item?.second_price, null),
      second_price_quantity: normalizeNumber(item?.second_price_quantity, null),
      loyalty_price: normalizeNumber(item?.loyalty_price, null),
      is_promotion: normalizeBoolean(item?.is_promotion),
      department_name: normalizeText(item?.department_name || "") || null,
      shelf_tag_photo: item?.shelf_tag_photo || null,
      confirmed_at: normalizeDateTime(item?.confirmed_at)
    }))
  };
}

function resolveServiceProductIds(research, levelId) {
  const normalizedLevelId = normalizeText(levelId);
  const levelEntries = Array.isArray(research?.level_product_lists) ? research.level_product_lists : [];
  const exactLevelEntry = levelEntries.find(
    (entry) => normalizeText(entry?.level_id) === normalizedLevelId
  );

  if (exactLevelEntry && Array.isArray(exactLevelEntry.product_ids) && exactLevelEntry.product_ids.length > 0) {
    return exactLevelEntry.product_ids.map((item) => normalizeText(item)).filter(Boolean);
  }

  const defaultProductIds = Array.isArray(research?.default_product_ids)
    ? research.default_product_ids.map((item) => normalizeText(item)).filter(Boolean)
    : [];
  if (defaultProductIds.length > 0) {
    return defaultProductIds;
  }

  return [
    ...new Set(
      levelEntries.flatMap((entry) =>
        (entry?.product_ids || []).map((item) => normalizeText(item)).filter(Boolean)
      )
    )
  ];
}

export function resolveExpectedProductsForEvent(eventItem, taskById = new Map(), researchById = new Map()) {
  const task = taskById.get(normalizeText(eventItem?.research_task_id || ""));
  if (task?.research_list?.length) {
    return normalizeExpectedProducts(task.research_list);
  }

  const research = researchById.get(normalizeText(eventItem?.research_service_id || ""));
  if (!research) {
    return [];
  }

  return normalizeExpectedProducts(
    resolveServiceProductIds(research, eventItem?.level_id).map((productId) => ({
      product_id: productId
    }))
  );
}

function compareEventRows(a, b) {
  const byDate = String(a?.date || "").localeCompare(String(b?.date || ""));
  if (byDate !== 0) {
    return byDate;
  }

  return String(a?.competitor_name || "").localeCompare(String(b?.competitor_name || ""));
}

function compareCompletedRows(a, b) {
  const dateA = normalizeDateTime(a?.latest_completed_at) || "";
  const dateB = normalizeDateTime(b?.latest_completed_at) || "";
  const byCompletedAt = dateB.localeCompare(dateA);
  if (byCompletedAt !== 0) {
    return byCompletedAt;
  }

  return compareEventRows(a, b);
}

export function buildResearchTaskCoverage({ expectedProducts = [], doneRecords = [], eventItem = null }) {
  const normalizedExpectedProducts = normalizeExpectedProducts(expectedProducts);
  const summaryByKey = new Map(
    normalizedExpectedProducts.map((product) => [
      product.coverage_key,
      {
        ...product,
        has_price: false,
        submissions: []
      }
    ])
  );

  const researcherIds = new Set();
  const doneIds = new Set();

  (Array.isArray(doneRecords) ? doneRecords : []).forEach((doneRecord) => {
    if (doneRecord?.uid) {
      researcherIds.add(doneRecord.uid);
    }
    if (doneRecord?.id) {
      doneIds.add(doneRecord.id);
    }

    (doneRecord?.items || []).forEach((item, index) => {
      const coverageKey = getResearchTaskCoverageKey(item);
      const summary = summaryByKey.get(coverageKey);
      if (!summary) {
        return;
      }

      const hasPrice = hasCollectedPrice(item);
      summary.has_price = summary.has_price || hasPrice;
      summary.submissions.push({
        row_id: `${doneRecord.id || "done"}_${index}_${coverageKey}`,
        done_id: doneRecord.id || "",
        researcher_name: doneRecord.researcher_name || "-",
        uid: doneRecord.uid || "",
        completed_at: doneRecord.completed_at,
        product_id: item.product_id || summary.product_id || "",
        product_name: item.product_name || summary.product_name || summary.product_id || "-",
        product_ean: item.product_ean || summary.product_ean || "",
        first_price: item.first_price,
        second_price: item.second_price,
        second_price_quantity: item.second_price_quantity,
        loyalty_price: item.loyalty_price,
        is_promotion: item.is_promotion,
        department_name: item.department_name || "",
        shelf_tag_photo: item.shelf_tag_photo || null,
        has_shelf_tag_photo: Boolean(
          item?.shelf_tag_photo?.display_url || item?.shelf_tag_photo?.image_url
        ),
        has_price: hasPrice
      });
    });
  });

  const itemSummaries = normalizedExpectedProducts.map((product) => {
    const summary = summaryByKey.get(product.coverage_key);
    return {
      ...summary,
      submissions: [...(summary?.submissions || [])].sort((a, b) =>
        String(a?.researcher_name || "").localeCompare(String(b?.researcher_name || ""))
      )
    };
  });
  const coveredProducts = itemSummaries.filter((item) => item.has_price).length;
  const latestCompletedAt = [...(Array.isArray(doneRecords) ? doneRecords : [])]
    .map((item) => normalizeDateTime(item?.completed_at))
    .filter(Boolean)
    .sort()
    .at(-1) || null;

  return {
    event_id: normalizeText(eventItem?.id || ""),
    research_task_id: normalizeText(eventItem?.research_task_id || ""),
    total_products: itemSummaries.length,
    covered_products: coveredProducts,
    completion_ratio: itemSummaries.length > 0 ? coveredProducts / itemSummaries.length : 0,
    coverage_label: `${coveredProducts}/${itemSummaries.length}`,
    is_completed: itemSummaries.length > 0 && coveredProducts === itemSummaries.length,
    item_summaries: itemSummaries,
    result_rows: itemSummaries.flatMap((item) => item.submissions),
    done_count: doneIds.size,
    researcher_count: researcherIds.size,
    latest_completed_at: latestCompletedAt
  };
}

export function buildResearchTaskEntries({
  events = [],
  doneRecords = [],
  researches = [],
  researchTasks = []
}) {
  const researchById = new Map(
    (Array.isArray(researches) ? researches : []).map((research) => [normalizeText(research?.id), research])
  );
  const taskById = new Map(
    (Array.isArray(researchTasks) ? researchTasks : []).map((task) => [normalizeText(task?.id), task])
  );
  const doneRecordsByEventId = new Map();
  const doneRecordsByTaskKey = new Map();

  (Array.isArray(doneRecords) ? doneRecords : []).forEach((doneRecord) => {
    const eventId = normalizeText(doneRecord?.event_id || "");
    const taskKey = buildResearchTaskKey(doneRecord);

    if (eventId) {
      if (!doneRecordsByEventId.has(eventId)) {
        doneRecordsByEventId.set(eventId, []);
      }
      doneRecordsByEventId.get(eventId).push(doneRecord);
    }

    if (taskKey) {
      if (!doneRecordsByTaskKey.has(taskKey)) {
        doneRecordsByTaskKey.set(taskKey, []);
      }
      doneRecordsByTaskKey.get(taskKey).push(doneRecord);
    }
  });

  const entries = (Array.isArray(events) ? events : []).map((eventItem) => {
    const taskKey = buildResearchTaskKey(eventItem);
    const combinedDoneRecords = new Map();

    (doneRecordsByEventId.get(normalizeText(eventItem?.id || "")) || []).forEach((item) => {
      combinedDoneRecords.set(item.id, item);
    });
    (doneRecordsByTaskKey.get(taskKey) || []).forEach((item) => {
      combinedDoneRecords.set(item.id, item);
    });

    const expectedProducts = resolveExpectedProductsForEvent(eventItem, taskById, researchById);
    const coverage = buildResearchTaskCoverage({
      expectedProducts,
      doneRecords: [...combinedDoneRecords.values()],
      eventItem
    });

    return {
      ...eventItem,
      expected_products: expectedProducts,
      ...coverage
    };
  });

  const openEntries = entries
    .filter((item) => item.status === "OPEN" && !item.is_completed)
    .sort(compareEventRows);
  const completedEntries = entries.filter((item) => item.is_completed).sort(compareCompletedRows);
  const openEntriesByResearchId = {};
  const completedEntriesByResearchId = {};

  openEntries.forEach((item) => {
    const researchId = normalizeText(item?.research_service_id || "");
    if (!researchId) {
      return;
    }
    if (!openEntriesByResearchId[researchId]) {
      openEntriesByResearchId[researchId] = [];
    }
    openEntriesByResearchId[researchId].push(item);
  });

  completedEntries.forEach((item) => {
    const researchId = normalizeText(item?.research_service_id || "");
    if (!researchId) {
      return;
    }
    if (!completedEntriesByResearchId[researchId]) {
      completedEntriesByResearchId[researchId] = [];
    }
    completedEntriesByResearchId[researchId].push(item);
  });

  return {
    entries,
    openEntries,
    completedEntries,
    openEntriesByResearchId,
    completedEntriesByResearchId
  };
}
