function sanitizeStreetNumberForQuery(value) {
  const normalized = (value || "").toString().trim();
  if (!normalized) {
    return "";
  }

  if (/^s\s*\/?\s*n$/i.test(normalized) || /^sem\s+numero$/i.test(normalized)) {
    return "";
  }

  return normalized;
}

function normalizeText(value) {
  return (value || "").toString().trim().replace(/\s+/g, " ");
}

function normalizeStreetForQuery(street = "") {
  const normalized = normalizeText(street);
  if (!normalized) {
    return "";
  }

  let next = ` ${normalized} `;
  const replacements = [
    [/\bst\.?\b/gi, "setor"],
    [/\bset\.?\b/gi, "setor"],
    [/\bqd\.?\b/gi, "quadra"],
    [/\bcj\.?\b/gi, "conjunto"],
    [/\bbl\.?\b/gi, "bloco"],
    [/\blt\.?\b/gi, "lote"]
  ];

  for (const [pattern, replacement] of replacements) {
    next = next.replace(pattern, ` ${replacement} `);
  }

  return normalizeText(next);
}

function normalizeFreeAddressQuery(query = "") {
  return normalizeText(query)
    .replace(/\s*,\s*/g, ", ")
    .replace(/,+/g, ",")
    .replace(/,\s*$/g, "");
}

function buildAddressQueryFromParts(parts = []) {
  const filtered = parts.map((item) => normalizeText(item)).filter(Boolean);
  if (!filtered.length) {
    return "";
  }
  return filtered.join(", ");
}

function unique(values = []) {
  const seen = new Set();
  const output = [];
  for (const value of values) {
    const key = normalizeText(value).toLowerCase();
    if (!key || seen.has(key)) {
      continue;
    }
    seen.add(key);
    output.push(normalizeText(value));
  }
  return output;
}

const CLIENT_RETRYABLE_STATUSES = new Set([429, 500, 502, 503, 504]);
const CLIENT_MAX_ATTEMPTS = 2;
const CLIENT_RETRY_BACKOFF_MS = 220;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function applyAddressAbbreviationExpansions(value = "") {
  let next = ` ${value} `;
  const replacements = [
    [/\bst\.?\b/gi, "setor"],
    [/\bset\.?\b/gi, "setor"],
    [/\bqd\.?\b/gi, "quadra"],
    [/\bcj\.?\b/gi, "conjunto"],
    [/\bbl\.?\b/gi, "bloco"],
    [/\blt\.?\b/gi, "lote"],
    [/\bdf\b/gi, "distrito federal"]
  ];

  for (const [pattern, replacement] of replacements) {
    next = next.replace(pattern, ` ${replacement} `);
  }

  return normalizeText(next);
}

function cleanupCommaSpacing(value = "") {
  return normalizeText(value).replace(/\s*,\s*/g, ", ").replace(/,+/g, ",").replace(/,\s*$/g, "");
}

function removeLotHints(value = "") {
  return cleanupCommaSpacing(
    value
      .replace(/\blote\s+[a-z0-9-]+\b/gi, " ")
      .replace(/\blt\.?\s*[a-z0-9-]+\b/gi, " ")
      .replace(/,+/g, ",")
  );
}

function buildFreeQueryVariants(query = "", countrycodes = "") {
  const base = normalizeFreeAddressQuery(query);
  if (!base) {
    return [];
  }

  const variants = [
    base,
    applyAddressAbbreviationExpansions(base),
    cleanupCommaSpacing(base.replace(/,/g, " ")),
    removeLotHints(base),
    removeLotHints(applyAddressAbbreviationExpansions(base))
  ];

  const hasBrazilHint = /\bbrasil\b/i.test(base) || /\bbrazil\b/i.test(base);
  if (!hasBrazilHint && countrycodes.toLowerCase() === "br") {
    variants.push(`${base}, Brasil`);
  }

  return unique(variants);
}

function buildAddressQueries(address = {}) {
  const streetNumber = sanitizeStreetNumberForQuery(address.street_number);
  const street = normalizeText(address.street);
  const streetNormalized = normalizeStreetForQuery(street);
  const neighbourhood = normalizeText(address.neighbourhood);
  const city = normalizeText(address.city);
  const state = normalizeText(address.state);
  const country = normalizeText(address.country || "Brasil");
  const streetCandidates = unique([street, streetNormalized]);
  const queries = [];

  if (!streetCandidates.length && !city && !state) {
    throw new Error("Informe ao menos cidade/estado/endereco para consultar.");
  }

  for (const streetValue of streetCandidates) {
    queries.push(
      buildAddressQueryFromParts([streetNumber, streetValue, neighbourhood, city, state, country]),
      buildAddressQueryFromParts([streetValue, neighbourhood, city, state, country]),
      buildAddressQueryFromParts([streetNumber, streetValue, city, state, country]),
      buildAddressQueryFromParts([streetValue, city, state, country])
    );
  }

  queries.push(
    buildAddressQueryFromParts([neighbourhood, city, state, country]),
    buildAddressQueryFromParts([city, state, country])
  );

  return unique(queries);
}

function pickFirstAddressField(address, keys = []) {
  for (const key of keys) {
    const value = address?.[key];
    if (value) {
      return value;
    }
  }
  return null;
}

export function parseNominatimAddress(result = {}) {
  const address = result?.address || {};
  const lat = Number.parseFloat(result?.lat);
  const lon = Number.parseFloat(result?.lon);

  return {
    address: {
      street: pickFirstAddressField(address, [
        "road",
        "pedestrian",
        "residential",
        "footway",
        "path",
        "industrial",
        "commercial"
      ]),
      street_number: pickFirstAddressField(address, ["house_number"]),
      neighbourhood: pickFirstAddressField(address, [
        "suburb",
        "neighbourhood",
        "quarter",
        "city_district"
      ]),
      city: pickFirstAddressField(address, ["city", "town", "village", "municipality", "county"]),
      state: pickFirstAddressField(address, ["state"]),
      postcode: pickFirstAddressField(address, ["postcode"]),
      country: pickFirstAddressField(address, ["country"]) || "Brasil",
      display_name: result?.display_name || null
    },
    geo: {
      latlon: Number.isFinite(lat) && Number.isFinite(lon) ? [lat, lon] : null,
      source: "nominatim"
    },
    raw: result
  };
}

async function requestNominatim(query = "", countrycodes = "") {
  const params = new URLSearchParams();
  params.set("q", query);
  if (countrycodes) {
    params.set("countrycodes", countrycodes);
  }
  let lastError = null;

  for (let attempt = 1; attempt <= CLIENT_MAX_ATTEMPTS; attempt += 1) {
    try {
      const response = await fetch(`/api/nominatim/search?${params.toString()}`, { method: "GET" });
      if (!response.ok) {
        const details = await response.json().catch(() => ({}));
        const message = details.error || `Falha na consulta de endereco (${response.status})`;
        const error = new Error(message);
        error.status = response.status;
        throw error;
      }

      const items = await response.json();
      return Array.isArray(items) ? items : [];
    } catch (error) {
      lastError = error;
      const status = Number(error?.status);
      const canRetry = CLIENT_RETRYABLE_STATUSES.has(status);
      if (canRetry && attempt < CLIENT_MAX_ATTEMPTS) {
        await sleep(CLIENT_RETRY_BACKOFF_MS * attempt);
        continue;
      }
      throw error;
    }
  }

  throw lastError || new Error("Falha na consulta de endereco.");
}

export async function geocodeAddressCandidatesByQuery(query = "", countrycodes = "") {
  const normalizedQuery = normalizeText(query);
  if (!normalizedQuery) {
    throw new Error("Informe um endereco para consultar.");
  }

  const variants = buildFreeQueryVariants(normalizedQuery, countrycodes);
  let items = [];

  for (const variant of variants) {
    items = await requestNominatim(variant, countrycodes);
    if (Array.isArray(items) && items.length > 0) {
      break;
    }
  }

  if (!Array.isArray(items) || items.length === 0) {
    throw new Error(
      "Endereco nao encontrado. Tente incluir bairro/cidade/UF ou remover abreviacoes."
    );
  }

  return items.map((item) => parseNominatimAddress(item));
}

export async function geocodeAddressCandidatesByInput(address = {}, countrycodes = "") {
  const queries = buildAddressQueries(address);
  let items = [];

  for (const query of queries) {
    items = await requestNominatim(query, countrycodes);
    if (Array.isArray(items) && items.length > 0) {
      break;
    }
  }

  if (!Array.isArray(items) || items.length === 0) {
    throw new Error(
      "Endereco nao encontrado. Tente incluir bairro/cidade/UF ou remover abreviacoes."
    );
  }

  return items.map((item) => parseNominatimAddress(item));
}

export async function geocodeByAddressInput(address = {}, countrycodes = "") {
  const items = await geocodeAddressCandidatesByInput(address, countrycodes);
  return items[0];
}
