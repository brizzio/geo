import { buildId, normalizeText, nowIso, requireField } from "./model-utils";

export const DEFAULT_CLUSTER_LEVELS = [
  { id: "level_primario", code: "PRIMARIO", name: "PRIMARIO", sort_order: 10, is_system: true },
  { id: "level_secundario", code: "SECUNDARIO", name: "SECUNDARIO", sort_order: 20, is_system: true },
  { id: "level_terciario", code: "TERCIARIO", name: "TERCIARIO", sort_order: 30, is_system: true },
  { id: "level_estudo", code: "ESTUDO", name: "ESTUDO", sort_order: 40, is_system: true }
];

function normalizeCode(value) {
  const raw = normalizeText(value);
  if (!raw) {
    return null;
  }
  return raw
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "_")
    .toUpperCase();
}

export function createClusterLevelModel(values = {}) {
  const name = normalizeText(values.name);
  const code = normalizeCode(values.code || values.name);
  const sortOrder = Number.isFinite(Number(values.sort_order))
    ? Number(values.sort_order)
    : 100;

  requireField(name, "Nome do nivel e obrigatorio.");
  requireField(code, "Codigo do nivel e obrigatorio.");

  return {
    id: values.id || buildId("cluster_level"),
    code,
    name,
    sort_order: sortOrder,
    is_system: Boolean(values.is_system),
    created_at: values.created_at || nowIso(),
    updated_at: nowIso()
  };
}

export function createDefaultClusterLevelsForCluster() {
  return DEFAULT_CLUSTER_LEVELS.map((level) =>
    createClusterLevelModel({
      ...level
    })
  );
}
