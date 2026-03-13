import { buildId, normalizeText, nowIso, requireField, uniqueStrings } from "./model-utils";

export const RESEARCH_SERVICE_STATUSES = {
  ACTIVE: "ACTIVE",
  SUSPENDED: "SUSPENDED"
};

export const RESEARCH_SERVICE_WEEKDAYS = [
  { id: "MONDAY", name: "Segunda-feira" },
  { id: "TUESDAY", name: "Terca-feira" },
  { id: "WEDNESDAY", name: "Quarta-feira" },
  { id: "THURSDAY", name: "Quinta-feira" },
  { id: "FRIDAY", name: "Sexta-feira" },
  { id: "SATURDAY", name: "Sabado" },
  { id: "SUNDAY", name: "Domingo" }
];

const VALID_WEEKDAYS = new Set(RESEARCH_SERVICE_WEEKDAYS.map((item) => item.id));

function toPositiveIntegerOrNull(value) {
  if (value === null || value === undefined || value === "") {
    return null;
  }
  const parsed = Number.parseInt(String(value), 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error("Prazo de duracao deve ser um numero inteiro maior que zero.");
  }
  return parsed;
}

function normalizeWeekday(value) {
  const raw = String(value || "").trim().toUpperCase();
  if (!raw) {
    return null;
  }
  return VALID_WEEKDAYS.has(raw) ? raw : null;
}

function normalizeRecurrenceWeekdays(values = {}) {
  const input = values?.recurrence?.weekdays || values?.recurrence_weekdays || [];
  const normalized = uniqueStrings(input.map(normalizeWeekday).filter(Boolean));
  return normalized.filter((item) => VALID_WEEKDAYS.has(item));
}

function normalizeLevelProductList(item = {}) {
  const levelId = normalizeText(item.level_id || item.levelId);
  if (!levelId) {
    return null;
  }

  const productIds = uniqueStrings(item.product_ids || item.products || [])
    .map((value) => String(value || "").trim())
    .filter(Boolean);

  return {
    level_id: String(levelId),
    product_ids: productIds
  };
}

function extractLegacyProductIds(values = {}) {
  const legacyItems = Array.isArray(values.products) ? values.products : [];
  return uniqueStrings(
    legacyItems
      .map((item) => item?.product_id || item?.productId || null)
      .filter(Boolean)
  );
}

function buildLevelProductLists({
  levelIds = [],
  sameForAllLevels = true,
  defaultProductIds = [],
  sourceLevelLists = []
}) {
  const normalizedLevelIds = uniqueStrings(levelIds).map((item) => String(item));
  if (normalizedLevelIds.length === 0) {
    throw new Error("Servico de pesquisa deve conter niveis de concorrencia.");
  }

  const sourceMap = new Map(
    sourceLevelLists
      .map(normalizeLevelProductList)
      .filter(Boolean)
      .map((entry) => [String(entry.level_id), entry])
  );

  if (sameForAllLevels) {
    if (defaultProductIds.length === 0) {
      throw new Error("Informe ao menos 1 produto para o servico.");
    }

    return normalizedLevelIds.map((levelId) => ({
      level_id: levelId,
      product_ids: uniqueStrings(defaultProductIds)
    }));
  }

  const lists = normalizedLevelIds.map((levelId) => ({
    level_id: levelId,
    product_ids: uniqueStrings(sourceMap.get(levelId)?.product_ids || [])
  }));

  const hasEmptyLevel = lists.some((entry) => entry.product_ids.length === 0);
  if (hasEmptyLevel) {
    throw new Error(
      "Quando a lista por nivel estiver individualizada, cada nivel deve possuir ao menos 1 produto."
    );
  }

  return lists;
}

export function createPriceResearchModel(values = {}) {
  const tenantId = values.tenant_id || null;
  const clusterId = values.cluster_id || null;
  const name = normalizeText(values.name);
  const status =
    String(values.status || RESEARCH_SERVICE_STATUSES.ACTIVE).toUpperCase() ===
    RESEARCH_SERVICE_STATUSES.SUSPENDED
      ? RESEARCH_SERVICE_STATUSES.SUSPENDED
      : RESEARCH_SERVICE_STATUSES.ACTIVE;
  const startDate = normalizeText(values.start_date);
  const isDurationIndefinite = Boolean(values.is_duration_indefinite);
  const durationDays = isDurationIndefinite ? null : toPositiveIntegerOrNull(values.duration_days);
  const recurrenceWeekdays = normalizeRecurrenceWeekdays(values);
  const recurrenceEnabled = Boolean(values.recurrence_enabled) || recurrenceWeekdays.length > 0;
  const sameForAllLevels =
    values.same_product_list_for_all_levels === undefined
      ? true
      : Boolean(values.same_product_list_for_all_levels);

  requireField(tenantId, "Tenant e obrigatorio para servico de pesquisa.");
  requireField(clusterId, "Cluster e obrigatorio para servico de pesquisa.");
  requireField(name, "Nome do servico e obrigatorio.");
  requireField(startDate, "Data de inicio e obrigatoria.");

  if (!isDurationIndefinite) {
    requireField(durationDays, "Prazo de duracao e obrigatorio quando o servico nao for indeterminado.");
  }
  if (recurrenceEnabled && recurrenceWeekdays.length === 0) {
    throw new Error("Selecione ao menos 1 dia da semana para recorrencia.");
  }

  const levelIds = uniqueStrings(values.level_ids || values.cluster_level_ids || [])
    .map((value) => String(value || "").trim())
    .filter(Boolean);

  const defaultProductIds = uniqueStrings([
    ...(values.default_product_ids || []),
    ...(values.product_ids || []),
    ...extractLegacyProductIds(values)
  ])
    .map((value) => String(value || "").trim())
    .filter(Boolean);

  const levelProductLists = buildLevelProductLists({
    levelIds,
    sameForAllLevels: sameForAllLevels,
    defaultProductIds,
    sourceLevelLists: values.level_product_lists || []
  });

  const normalizedDefaultProductIds = sameForAllLevels
    ? uniqueStrings(defaultProductIds)
    : uniqueStrings(levelProductLists.flatMap((item) => item.product_ids));

  return {
    id: values.id || buildId("research_service"),
    tenant_id: String(tenantId),
    cluster_id: String(clusterId),
    name,
    status,
    start_date: startDate,
    duration_days: durationDays,
    is_duration_indefinite: isDurationIndefinite,
    recurrence_enabled: recurrenceEnabled,
    recurrence_weekdays: recurrenceEnabled ? recurrenceWeekdays : [],
    same_product_list_for_all_levels: sameForAllLevels,
    default_product_ids: normalizedDefaultProductIds,
    level_product_lists: levelProductLists,
    created_at: values.created_at || nowIso(),
    updated_at: nowIso()
  };
}
