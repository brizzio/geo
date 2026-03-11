import { buildId, normalizeText, nowIso, requireField, uniqueStrings } from "./model-utils";
import {
  createClusterLevelModel,
  createDefaultClusterLevelsForCluster
} from "./cluster-level-model";

function normalizeLevels(values = []) {
  const source = Array.isArray(values) && values.length > 0
    ? values
    : createDefaultClusterLevelsForCluster();

  const levels = source
    .map((item) => createClusterLevelModel(item))
    .sort((a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name));

  const usedCodes = new Set();
  const usedIds = new Set();

  levels.forEach((level) => {
    const codeKey = String(level.code).toUpperCase();
    const idKey = String(level.id);
    if (usedCodes.has(codeKey)) {
      throw new Error("Cluster possui niveis com codigo duplicado.");
    }
    if (usedIds.has(idKey)) {
      throw new Error("Cluster possui niveis com ID duplicado.");
    }
    usedCodes.add(codeKey);
    usedIds.add(idKey);
  });

  return levels;
}

function normalizeCompetitorGroups(groups = [], validLevelIds = new Set()) {
  return groups
    .map((group) => ({
      level_id: group?.level_id ? String(group.level_id) : null,
      store_ids: uniqueStrings(group?.store_ids || [])
    }))
    .filter(
      (group) =>
        group.level_id &&
        group.store_ids.length > 0 &&
        (validLevelIds.size === 0 || validLevelIds.has(String(group.level_id)))
    );
}

export function createClusterModel(values = {}) {
  const tenantId = values.tenant_id || null;
  const networkId = values.network_id || null;
  const bannerId = values.banner_id || null;
  const name = normalizeText(values.name);

  requireField(tenantId, "Tenant e obrigatorio para cluster.");
  requireField(networkId, "Rede e obrigatoria para cluster.");
  requireField(bannerId, "Bandeira e obrigatoria para cluster.");
  requireField(name, "Nome do cluster e obrigatorio.");
  const levels = normalizeLevels(values.levels || []);
  const validLevelIds = new Set(levels.map((level) => String(level.id)));

  return {
    id: values.id || buildId("cluster"),
    tenant_id: String(tenantId),
    network_id: String(networkId),
    banner_id: String(bannerId),
    name,
    description: normalizeText(values.description),
    own_store_ids: uniqueStrings(values.own_store_ids || []),
    levels,
    competitor_groups: normalizeCompetitorGroups(values.competitor_groups || [], validLevelIds),
    created_at: values.created_at || nowIso(),
    updated_at: nowIso()
  };
}
