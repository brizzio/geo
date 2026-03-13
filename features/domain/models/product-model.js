import { buildId, normalizeText, nowIso, requireField } from "./model-utils";

function normalizeProductImage(values = {}) {
  const rawImage = values?.image && typeof values.image === "object" ? values.image : {};
  const legacyImageUrl =
    normalizeText(values.image_url) ||
    (typeof values.image === "string" ? normalizeText(values.image) : null);

  const imageUrl = normalizeText(rawImage.image_url || rawImage.url) || legacyImageUrl || null;
  const displayUrl = normalizeText(rawImage.display_url) || imageUrl || null;
  const thumbUrl = normalizeText(rawImage.thumb_url) || null;
  const mediumUrl = normalizeText(rawImage.medium_url) || null;
  const deleteUrl = normalizeText(rawImage.delete_url) || null;
  const provider = normalizeText(rawImage.provider) || (imageUrl ? "imgbb" : null);
  const providerId = normalizeText(rawImage.id) || null;

  const hasAnyValue =
    imageUrl || displayUrl || thumbUrl || mediumUrl || deleteUrl || provider || providerId;

  if (!hasAnyValue) {
    return null;
  }

  return {
    provider,
    id: providerId,
    image_url: imageUrl,
    display_url: displayUrl,
    thumb_url: thumbUrl,
    medium_url: mediumUrl,
    delete_url: deleteUrl
  };
}

function normalizeNonNegativeNumber(value, label) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const normalized = String(value).trim().replace(",", ".");
  if (!normalized) {
    return null;
  }

  const parsed = Number.parseFloat(normalized);
  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new Error(`${label} invalido.`);
  }

  return parsed;
}

export function createProductModel(values = {}) {
  const tenantId = values.tenant_id || null;
  const name = normalizeText(values.name);
  const image = normalizeProductImage(values);

  requireField(tenantId, "Tenant e obrigatorio para produto.");
  requireField(name, "Nome do produto e obrigatorio.");

  return {
    id: values.id || buildId("product"),
    tenant_id: String(tenantId),
    internal_reference: normalizeText(values.internal_reference),
    ean: normalizeText(values.ean),
    name,
    description: normalizeText(values.description),
    code_plu: normalizeText(values.code_plu),
    image,
    image_url: image?.image_url || normalizeText(values.image_url) || null,
    brand: normalizeText(values.brand),
    line: normalizeText(values.line),
    industry_name: normalizeText(values.industry_name),
    presentation: normalizeText(values.presentation),
    weight: normalizeNonNegativeNumber(values.weight, "Peso"),
    weight_unit: normalizeText(values.weight_unit),
    volume: normalizeNonNegativeNumber(values.volume, "Volume"),
    volume_unit: normalizeText(values.volume_unit),
    category: normalizeText(values.category),
    created_at: values.created_at || nowIso(),
    updated_at: nowIso()
  };
}
