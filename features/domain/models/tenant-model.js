import { buildId, normalizeText, nowIso, requireField } from "./model-utils";

export const TENANT_TYPES = {
  INDIVIDUAL: "PF",
  COMPANY: "PJ"
};

function normalizeAddress(address = {}) {
  return {
    street: normalizeText(address.street),
    street_number: normalizeText(address.street_number),
    neighbourhood: normalizeText(address.neighbourhood),
    city: normalizeText(address.city),
    state: normalizeText(address.state),
    postcode: normalizeText(address.postcode),
    country: normalizeText(address.country) || "Brasil",
    display_name: normalizeText(address.display_name)
  };
}

function normalizeGeo(geo = {}) {
  const lat = Number.parseFloat(geo?.latlon?.[0]);
  const lon = Number.parseFloat(geo?.latlon?.[1]);
  const hasCoords = Number.isFinite(lat) && Number.isFinite(lon);

  return {
    latlon: hasCoords ? [lat, lon] : null,
    source: normalizeText(geo.source) || null
  };
}

export function createTenantModel(values = {}) {
  const name = normalizeText(values.name);
  requireField(name, "Nome do tenant e obrigatorio.");

  const personType =
    values.person_type === TENANT_TYPES.INDIVIDUAL ? TENANT_TYPES.INDIVIDUAL : TENANT_TYPES.COMPANY;
  const document = normalizeText(values.document);

  return {
    id: values.id || buildId("tenant"),
    name,
    person_type: personType,
    document,
    logo_url: normalizeText(values.logo_url),
    logo_base64: typeof values.logo_base64 === "string" ? values.logo_base64 : null,
    address: normalizeAddress(values.address || {}),
    geo: normalizeGeo(values.geo || {}),
    created_at: values.created_at || nowIso(),
    updated_at: nowIso()
  };
}
