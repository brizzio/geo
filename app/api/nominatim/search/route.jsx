import { NextResponse } from "next/server";

const MIN_INTERVAL_MS = 1100;
const UPSTREAM_TIMEOUT_MS = 9000;
const MAX_UPSTREAM_ATTEMPTS = 2;
const RETRY_BACKOFF_MS = 450;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchWithTimeout(url, options = {}, timeoutMs = UPSTREAM_TIMEOUT_MS) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort("timeout"), timeoutMs);

  try {
    return await fetch(url, {
      ...options,
      signal: controller.signal
    });
  } finally {
    clearTimeout(timeoutId);
  }
}

function buildUpstreamErrorMessage(status, details = "") {
  const normalizedDetails = String(details || "").trim();
  if (normalizedDetails) {
    return `Nominatim error ${status}: ${normalizedDetails.slice(0, 140)}`;
  }
  return `Nominatim error ${status}`;
}

async function queryNominatimWithRetry(url) {
  let lastError = null;

  for (let attempt = 1; attempt <= MAX_UPSTREAM_ATTEMPTS; attempt += 1) {
    try {
      const response = await fetchWithTimeout(
        url,
        {
          headers: {
            "User-Agent": "geo-next/1.0 (+nominatim-proxy)",
            Accept: "application/json",
            "Accept-Language": "pt-BR,pt;q=0.9,en;q=0.8"
          },
          cache: "no-store"
        },
        UPSTREAM_TIMEOUT_MS
      );

      if (response.ok) {
        return response;
      }

      const shouldRetry = response.status === 429 || response.status >= 500;
      const details = await response.text().catch(() => "");
      const message = buildUpstreamErrorMessage(response.status, details);

      if (shouldRetry && attempt < MAX_UPSTREAM_ATTEMPTS) {
        await sleep(RETRY_BACKOFF_MS * attempt);
        continue;
      }

      const error = new Error(message);
      error.status = response.status;
      throw error;
    } catch (error) {
      lastError = error;
      if (attempt < MAX_UPSTREAM_ATTEMPTS) {
        await sleep(RETRY_BACKOFF_MS * attempt);
        continue;
      }
    }
  }

  throw lastError || new Error("Falha ao consultar servico de geocodificacao.");
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const q = (searchParams.get("q") || "").trim();
  const countryCodes = (searchParams.get("countrycodes") || "").trim();

  if (!q) {
    return NextResponse.json({ error: "Missing query param: q" }, { status: 400 });
  }

  if (!globalThis.__nominatimNextAllowedAt) {
    globalThis.__nominatimNextAllowedAt = 0;
  }

  const now = Date.now();
  const waitMs = Math.max(0, globalThis.__nominatimNextAllowedAt - now);
  if (waitMs > 0) {
    await sleep(waitMs);
  }
  globalThis.__nominatimNextAllowedAt = Date.now() + MIN_INTERVAL_MS;

  const nominatimUrl = new URL("https://nominatim.openstreetmap.org/search");
  nominatimUrl.searchParams.set("q", q);
  nominatimUrl.searchParams.set("format", "json");
  nominatimUrl.searchParams.set("addressdetails", "1");
  nominatimUrl.searchParams.set("limit", "8");
  if (process.env.NOMINATIM_EMAIL) {
    nominatimUrl.searchParams.set("email", process.env.NOMINATIM_EMAIL);
  }
  if (countryCodes) {
    nominatimUrl.searchParams.set("countrycodes", countryCodes);
  }

  try {
    const response = await queryNominatimWithRetry(nominatimUrl.toString());
    const data = await response.json();
    return NextResponse.json(Array.isArray(data) ? data : [], { status: 200 });
  } catch (error) {
    const errorMessage =
      error?.name === "AbortError"
        ? "Timeout ao consultar Nominatim."
        : error?.message || "Failed to call Nominatim";
    const status = Number.isFinite(Number(error?.status)) ? Number(error.status) : 502;

    return NextResponse.json(
      { error: errorMessage },
      { status: status >= 400 && status <= 599 ? status : 502 }
    );
  }
}
