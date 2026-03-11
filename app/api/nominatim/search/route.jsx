import { NextResponse } from "next/server";

const MIN_INTERVAL_MS = 1100;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
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
  if (countryCodes) {
    nominatimUrl.searchParams.set("countrycodes", countryCodes);
  }

  try {
    const response = await fetch(nominatimUrl.toString(), {
      headers: {
        "User-Agent": "geo-next/1.0 (local-dev)",
        Accept: "application/json",
        "Accept-Language": "pt-BR,pt;q=0.9,en;q=0.8"
      },
      cache: "no-store"
    });

    if (!response.ok) {
      const message = `Nominatim error ${response.status}`;
      return NextResponse.json({ error: message }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(Array.isArray(data) ? data : [], { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: error?.message || "Failed to call Nominatim" },
      { status: 502 }
    );
  }
}
