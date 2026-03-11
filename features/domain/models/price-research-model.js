import { buildId, normalizeText, nowIso, requireField, uniqueStrings } from "./model-utils";

export function createPriceResearchProductModel(values = {}) {
  const name = normalizeText(values.name);
  const gtin = normalizeText(values.gtin);
  const category = normalizeText(values.category);

  requireField(name, "Nome do produto e obrigatorio.");

  return {
    id: values.id || buildId("research_item"),
    gtin,
    name,
    category
  };
}

export function createPriceResearchModel(values = {}) {
  const tenantId = values.tenant_id || null;
  const clusterId = values.cluster_id || null;
  const name = normalizeText(values.name);

  requireField(tenantId, "Tenant e obrigatorio para pesquisa.");
  requireField(clusterId, "Cluster e obrigatorio para pesquisa.");
  requireField(name, "Nome da pesquisa e obrigatorio.");
  requireField(values.start_date, "Data de inicio e obrigatoria.");
  requireField(values.end_date, "Data de fim e obrigatoria.");
  requireField(values.start_time, "Hora de inicio e obrigatoria.");
  requireField(values.end_time, "Hora de fim e obrigatoria.");

  const products = (values.products || []).map(createPriceResearchProductModel);
  if (products.length === 0) {
    throw new Error("Inclua ao menos 1 produto na pesquisa.");
  }

  return {
    id: values.id || buildId("research"),
    tenant_id: String(tenantId),
    cluster_id: String(clusterId),
    name,
    start_date: values.start_date,
    end_date: values.end_date,
    start_time: values.start_time,
    end_time: values.end_time,
    competitor_store_ids: uniqueStrings(values.competitor_store_ids || []),
    products,
    created_at: values.created_at || nowIso(),
    updated_at: nowIso()
  };
}
