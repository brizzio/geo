export function formatLatlon(latlon) {
  const lat = Array.isArray(latlon) ? latlon[0] : null;
  const lon = Array.isArray(latlon) ? latlon[1] : null;
  if (typeof lat === "number" && Number.isFinite(lat) && typeof lon === "number" && Number.isFinite(lon)) {
    return `${lat.toFixed(6)}, ${lon.toFixed(6)}`;
  }
  return "";
}

export function parseLatlonText(input = "") {
  const text = String(input || "").trim();
  if (!text) {
    return null;
  }

  const matches = text.match(/[-+]?\d+(?:[.,]\d+)?/g) || [];
  if (matches.length < 2) {
    throw new Error("Informe latitude e longitude no formato: lat, lon");
  }

  const lat = Number.parseFloat(matches[0].replace(",", "."));
  const lon = Number.parseFloat(matches[1].replace(",", "."));

  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    throw new Error("Latitude/longitude invalidas.");
  }

  if (lat < -90 || lat > 90) {
    throw new Error("Latitude deve estar entre -90 e 90.");
  }
  if (lon < -180 || lon > 180) {
    throw new Error("Longitude deve estar entre -180 e 180.");
  }

  return [lat, lon];
}
