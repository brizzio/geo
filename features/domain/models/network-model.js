import { buildId, normalizeText, nowIso, requireField } from "./model-utils";

export const NETWORK_SECTORS = [
  {
    id: "RETAIL",
    name: "Varejo",
    description:
      "Venda direta de bens ou serviços ao consumidor final em pequenas quantidades.",
    examples: ["Supermercados", "Lojas de shopping", "E-commerce B2C"],
  },
  {
    id: "WHOLESALE_DISTRIBUTION",
    name: "Distribuição e Atacado",
    description:
      "Venda de grandes volumes para outras empresas (B2B), revendedores ou transformadores.",
    examples: ["Distribuidores de bebidas", "Atacado de insumos industriais"],
  },
];

export const NETWORK_SEGMENTS = [
  {
    id: "HARDLINES",
    name: "Bens Duráveis",
    description: "Produtos com longa vida útil e resistência física.",
    examples: ["Eletrônicos", "Materiais de Construção", "Móveis"],
  },
  {
    id: "SOFTLINES",
    name: "Moda e Têxteis",
    description: "Vestuário, calçados e itens de tecido em geral.",
    examples: ["Roupas", "Acessórios de Moda", "Cama e Mesa"],
  },
  {
    id: "FMCG_CPG",
    name: "Bens de Consumo Rápido",
    description: "Produtos de alta rotatividade e consumo frequente.",
    examples: ["Alimentos e Bebidas", "Higiene", "Limpeza"],
  },
  {
    id: "HEALTH_BEAUTY",
    name: "Saúde e Beleza",
    description: "Foco em bem-estar, medicamentos e cuidados pessoais.",
    examples: ["Farmácias", "Cosméticos", "Dermocosméticos"],
  },
  {
    id: "SPECIALTY_NICHE",
    name: "Nichos e Especialidades",
    description: "Categorias focadas em interesses específicos do consumidor.",
    examples: ["Pet Shop", "Artigos Esportivos", "Brinquedos"],
  },
];

function normalizeHeadquarterAddress(address = {}) {
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

function normalizeHeadquarterGeo(geo = {}) {
  const lat = Number.parseFloat(geo?.latlon?.[0]);
  const lon = Number.parseFloat(geo?.latlon?.[1]);
  const hasCoords = Number.isFinite(lat) && Number.isFinite(lon);

  return {
    latlon: hasCoords ? [lat, lon] : null,
    source: normalizeText(geo.source) || null
  };
}

function hasEnumValue(options = [], id) {
  return options.some((item) => String(item.id) === String(id));
}

export function createNetworkModel(values = {}) {
  const tenantId = values.tenant_id || null;
  const name = normalizeText(values.name);
  const fallbackSector = NETWORK_SECTORS[0]?.id || null;
  const fallbackSegment = NETWORK_SEGMENTS[0]?.id || null;
  const sector = normalizeText(values.sector) || fallbackSector;
  const segment = normalizeText(values.segment) || fallbackSegment;

  requireField(tenantId, "Tenant e obrigatorio para rede.");
  requireField(name, "Nome da rede e obrigatorio.");
  requireField(sector, "Setor da rede e obrigatorio.");
  requireField(segment, "Segmento da rede e obrigatorio.");

  if (!hasEnumValue(NETWORK_SECTORS, sector)) {
    throw new Error("Setor da rede invalido.");
  }
  if (!hasEnumValue(NETWORK_SEGMENTS, segment)) {
    throw new Error("Segmento da rede invalido.");
  }

  const headquarterAddress = normalizeHeadquarterAddress(values.headquarter?.address || {});
  const headquarterGeo = normalizeHeadquarterGeo(values.headquarter?.geo || {});

  return {
    id: values.id || buildId("network"),
    tenant_id: String(tenantId),
    name,
    sector,
    segment,
    description: normalizeText(values.description),
    headquarter: {
      address: headquarterAddress,
      geo: headquarterGeo
    },
    created_at: values.created_at || nowIso(),
    updated_at: nowIso()
  };
}
