import { buildId, normalizeText, nowIso, requireField } from "./model-utils";

export const RETAIL_BANNER_NETWORK_TYPES = [
  {
    id: "DOS",
    name: "Redes Proprias",
    description: "Gestao centralizada onde a empresa e dona de todas as unidades.",
    examples: ["Lojas Americanas", "Zara"]
  },
  {
    id: "FRANCHISED_NETWORK",
    name: "Franquias",
    description: "Expansao via parceiros que operam a marca sob regras do franqueador.",
    examples: ["McDonald's", "Boticario"]
  },
  {
    id: "COOPERATIVE_ASSOCIATION",
    name: "Associativismo",
    description: "Empresas independentes que se unem para ganhar escala em compras e logistica.",
    examples: ["Redes de farmacias associadas"]
  }
];

export const RETAIL_BANNER_NETWORK_CHANNELS = [
  {
    id: "PHYSICAL",
    name: "Fisico",
    description: "Pontos de venda presenciais e geolocalizados.",
    examples: ["Lojas de rua", "Shopping centers"]
  },
  {
    id: "DIGITAL",
    name: "Digital",
    description: "Vendas realizadas via plataformas online, apps e redes sociais.",
    examples: ["Site proprio", "Social commerce"]
  },
  {
    id: "OMNICHANNEL",
    name: "Omnichannel",
    description: "Integracao total com estoque e jornada unificados entre on e offline.",
    examples: ["Compra online com retirada na loja", "Prateleira infinita"]
  }
];

function hasEnumValue(options = [], value) {
  return options.some((item) => String(item.id) === String(value));
}

function normalizeLogo(values = {}) {
  const legacyUrl = normalizeText(values.logo_url);
  const input = values.logo && typeof values.logo === "object" ? values.logo : {};

  const imageUrl = normalizeText(input.image_url || input.url) || legacyUrl || null;
  const displayUrl =
    normalizeText(input.display_url) || imageUrl || null;
  const thumbUrl = normalizeText(input.thumb_url) || null;
  const mediumUrl = normalizeText(input.medium_url) || null;
  const deleteUrl = normalizeText(input.delete_url) || null;
  const providerId = normalizeText(input.id || values.logo_id) || null;
  const provider = normalizeText(input.provider) || (imageUrl ? "imgbb" : null);

  const hasAny =
    imageUrl || displayUrl || thumbUrl || mediumUrl || deleteUrl || providerId || provider;

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

export function createRetailBannerModel(values = {}) {
  const tenantId = values.tenant_id || null;
  const networkId = values.network_id || null;
  const name = normalizeText(values.name);
  const fallbackType = RETAIL_BANNER_NETWORK_TYPES[0]?.id || null;
  const fallbackChannel = RETAIL_BANNER_NETWORK_CHANNELS[0]?.id || null;
  const networkType = normalizeText(values.network_type) || fallbackType;
  const networkChannel = normalizeText(values.network_channel) || fallbackChannel;

  requireField(tenantId, "Tenant e obrigatorio para bandeira.");
  requireField(networkId, "Rede e obrigatoria para bandeira.");
  requireField(name, "Nome da bandeira e obrigatorio.");
  requireField(networkType, "Tipo de rede da bandeira e obrigatorio.");
  requireField(networkChannel, "Canal da bandeira e obrigatorio.");

  if (!hasEnumValue(RETAIL_BANNER_NETWORK_TYPES, networkType)) {
    throw new Error("Tipo de rede da bandeira invalido.");
  }

  if (!hasEnumValue(RETAIL_BANNER_NETWORK_CHANNELS, networkChannel)) {
    throw new Error("Canal da bandeira invalido.");
  }

  const logo = normalizeLogo(values);

  return {
    id: values.id || buildId("banner"),
    tenant_id: String(tenantId),
    network_id: String(networkId),
    code: normalizeText(values.code),
    name,
    network_type: networkType,
    network_channel: networkChannel,
    description: normalizeText(values.description),
    logo,
    logo_url: logo?.image_url || normalizeText(values.logo_url),
    created_at: values.created_at || nowIso(),
    updated_at: nowIso()
  };
}
