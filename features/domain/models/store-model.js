import { buildId, normalizeText, nowIso, requireField } from "./model-utils";

export const STORE_KINDS = {
  OWN: "OWN",
  COMPETITOR: "COMPETITOR"
};

export const STORE_FORMATS = [
  {
    id: "CASH_AND_CARRY",
    name: "Atacarejo (Cash & Carry)",
    description: "Formato hibrido com preco de atacado e conveniencia de varejo.",
    examples: ["Atacadao", "Assai"]
  },
  {
    id: "PROXIMITY",
    name: "Lojas de Proximidade",
    description: "Unidades menores em bairros para compras de reposicao.",
    examples: ["Minuto Pao de Acucar", "OXXO"]
  },
  {
    id: "CONVENIENCE",
    name: "Conveniencia",
    description: "Lojas pequenas, muitas vezes 24h, focadas em consumo imediato.",
    examples: ["AMPM", "Shell Select"]
  },
  {
    id: "SUPERMARKET",
    name: "Supermercados e Hipermercados",
    description: "Grandes superficies com alimentos e nao alimentares.",
    examples: ["Carrefour", "Extra"]
  },
  {
    id: "SPECIALTY",
    name: "Especialidade",
    description: "Foco profundo em uma categoria unica de produto.",
    examples: ["Petz", "Tok&Stok"]
  }
];

function normalizeStoreAddress(address = {}, fallback = {}) {
  return {
    street: normalizeText(address.street || fallback.street),
    street_number: normalizeText(address.street_number || fallback.street_number),
    neighbourhood: normalizeText(address.neighbourhood || fallback.neighbourhood),
    city: normalizeText(address.city || fallback.city),
    state: normalizeText(address.state || fallback.state),
    postcode: normalizeText(address.postcode || fallback.postcode),
    country: normalizeText(address.country || fallback.country) || "Brasil",
    display_name: normalizeText(address.display_name || fallback.display_name)
  };
}

function normalizeStoreGeo(geo = {}) {
  const lat = Number.parseFloat(geo?.latlon?.[0]);
  const lon = Number.parseFloat(geo?.latlon?.[1]);
  const hasCoords = Number.isFinite(lat) && Number.isFinite(lon);

  return {
    latlon: hasCoords ? [lat, lon] : null,
    source: normalizeText(geo.source) || null
  };
}

function normalizeStoreFacade(values = {}) {
  const input = values.facade && typeof values.facade === "object" ? values.facade : {};
  const legacyFacadeUrl = normalizeText(values.facade_url);

  const imageUrl = normalizeText(input.image_url || input.url) || legacyFacadeUrl || null;
  const displayUrl = normalizeText(input.display_url) || imageUrl || null;
  const thumbUrl = normalizeText(input.thumb_url) || null;
  const mediumUrl = normalizeText(input.medium_url) || null;
  const deleteUrl = normalizeText(input.delete_url) || null;
  const provider = normalizeText(input.provider) || (imageUrl ? "imgbb" : null);
  const providerId = normalizeText(input.id) || null;

  const hasAny = imageUrl || displayUrl || thumbUrl || mediumUrl || deleteUrl || provider || providerId;
  if (!hasAny) {
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

function normalizeCompetitorBannerLogo(values = {}) {
  const input =
    values.competitor_banner_logo && typeof values.competitor_banner_logo === "object"
      ? values.competitor_banner_logo
      : {};
  const legacyLogoUrl =
    normalizeText(values.competitor_banner_logo_url) || normalizeText(values.competitor_logo_url);

  const imageUrl = normalizeText(input.image_url || input.url) || legacyLogoUrl || null;
  const displayUrl = normalizeText(input.display_url) || imageUrl || null;
  const thumbUrl = normalizeText(input.thumb_url) || null;
  const mediumUrl = normalizeText(input.medium_url) || null;
  const deleteUrl = normalizeText(input.delete_url) || null;
  const provider = normalizeText(input.provider) || (imageUrl ? "imgbb" : null);
  const providerId = normalizeText(input.id) || null;

  const hasAny = imageUrl || displayUrl || thumbUrl || mediumUrl || deleteUrl || provider || providerId;
  if (!hasAny) {
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

export function createStoreModel(values = {}) {
  const tenantId = values.tenant_id || null;
  const networkId = values.network_id || null;
  const rawBannerId = values.banner_id || null;
  const name = normalizeText(values.name);
  const kind = values.kind === STORE_KINDS.COMPETITOR ? STORE_KINDS.COMPETITOR : STORE_KINDS.OWN;
  const facade = normalizeStoreFacade(values);
  const competitorBannerLogo = normalizeCompetitorBannerLogo(values);
  const internalCode = normalizeText(values.internal_code) || normalizeText(values.code);
  const competitorBannerName = normalizeText(
    values.competitor_banner_name || values.banner_name || values.banner || values.brand
  );
  const bannerId = kind === STORE_KINDS.OWN ? rawBannerId : null;

  const address = normalizeStoreAddress(values.address || {}, {
    street: values.address_street,
    street_number: values.address_street_number,
    neighbourhood: values.address_neighbourhood,
    city: values.address_city,
    state: values.address_state,
    postcode: values.address_postcode,
    country: values.address_country,
    display_name: values.address_display_name
  });

  const geo = normalizeStoreGeo(values.geo || {});

  requireField(tenantId, "Tenant e obrigatorio para loja.");
  requireField(networkId, "Rede e obrigatoria para loja.");
  if (kind === STORE_KINDS.OWN) {
    requireField(bannerId, "Bandeira e obrigatoria para loja.");
  }
  if (kind === STORE_KINDS.COMPETITOR) {
    requireField(competitorBannerName, "Bandeira concorrente e obrigatoria para loja concorrente.");
  }
  requireField(name, "Nome da loja e obrigatorio.");

  return {
    id: values.id || buildId("store"),
    tenant_id: String(tenantId),
    network_id: String(networkId),
    banner_id: bannerId ? String(bannerId) : null,
    kind,
    competitor_banner_name: competitorBannerName,
    competitor_banner_logo: competitorBannerLogo,
    competitor_banner_logo_url:
      competitorBannerLogo?.image_url || normalizeText(values.competitor_banner_logo_url) || null,
    internal_code: internalCode,
    short_name: normalizeText(values.short_name),
    store_number: kind === STORE_KINDS.OWN ? normalizeText(values.store_number) : null,
    code: internalCode,
    name,
    address,
    geo,
    address_city: address.city,
    address_state: address.state,
    facade,
    facade_url: facade?.image_url || normalizeText(values.facade_url),
    created_at: values.created_at || nowIso(),
    updated_at: nowIso()
  };
}
