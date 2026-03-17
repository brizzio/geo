export const ALL_FILTER_VALUE = "__ALL__";

function parseCoordinateValue(value) {
  if (value === null || value === undefined || value === "") {
    return null;
  }
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }
  const normalized = String(value).trim().replace(",", ".");
  const numeric = Number.parseFloat(normalized);
  return Number.isFinite(numeric) ? numeric : null;
}

export function normalizeLatLng(value) {
  if (typeof value === "string") {
    const matches = String(value).match(/-?\d+(?:[.,]\d+)?/g);
    if (Array.isArray(matches) && matches.length >= 2) {
      const lat = parseCoordinateValue(matches[0]);
      const lon = parseCoordinateValue(matches[1]);
      if (Number.isFinite(lat) && Number.isFinite(lon)) {
        return [lat, lon];
      }
    }
  }

  if (Array.isArray(value) && value.length >= 2) {
    const lat = parseCoordinateValue(value[0]);
    const lon = parseCoordinateValue(value[1]);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
      return null;
    }
    return [lat, lon];
  }

  if (value && typeof value === "object") {
    const lat = parseCoordinateValue(value.lat ?? value.latitude);
    const lon = parseCoordinateValue(value.lon ?? value.lng ?? value.longitude);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
      return null;
    }
    return [lat, lon];
  }

  return null;
}

export function getStoreLatLng(store) {
  return (
    normalizeLatLng(store?.geo?.latlon) ||
    normalizeLatLng(store?.geo) ||
    normalizeLatLng([store?.lat, store?.lon ?? store?.lng]) ||
    normalizeLatLng([store?.geo_lat, store?.geo_lon ?? store?.geo_lng]) ||
    normalizeLatLng([store?.address_lat, store?.address_lon]) ||
    null
  );
}

export function resolveBannerLogo(banner) {
  return (
    banner?.logo?.thumb_url ||
    banner?.logo?.display_url ||
    banner?.logo?.image_url ||
    banner?.logo_url ||
    null
  );
}

export function resolveOwnStoreLogo(store, bannerById = new Map()) {
  const banner = bannerById.get(String(store?.banner_id || "")) || null;
  return resolveBannerLogo(banner);
}

export function resolveCompetitorStoreLogo(store, bannerById = new Map()) {
  return (
    store?.competitor_banner_logo?.thumb_url ||
    store?.competitor_banner_logo?.display_url ||
    store?.competitor_banner_logo?.image_url ||
    store?.competitor_banner_logo_url ||
    resolveOwnStoreLogo(store, bannerById)
  );
}

export function resolveStoreFacade(store) {
  return (
    store?.facade?.thumb_url ||
    store?.facade?.display_url ||
    store?.facade?.image_url ||
    store?.facade_url ||
    null
  );
}

export function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function fallbackLetter(text = "", fallback = "M") {
  const raw = String(text || "").trim();
  if (!raw) {
    return fallback;
  }
  const first = raw[0];
  return first ? first.toUpperCase() : fallback;
}

export function createLogoMarkerIcon(L, { logoUrl = "", label = "", borderColor = "#0f172a" } = {}) {
  const safeLabel = escapeHtml(fallbackLetter(label, "M"));
  const safeLogoUrl = escapeHtml(logoUrl);
  const inner =
    safeLogoUrl
      ? `<img src="${safeLogoUrl}" alt="" style="width:26px;height:26px;object-fit:contain;border-radius:999px;background:#fff;" />`
      : `<span style="font-size:11px;font-weight:700;color:#0f172a;">${safeLabel}</span>`;
  const html = `<div style="width:34px;height:34px;border-radius:999px;border:2px solid ${borderColor};background:#fff;display:grid;place-items:center;box-shadow:0 6px 12px rgba(15,23,42,0.2);">${inner}</div>`;
  return L.divIcon({
    html,
    className: "",
    iconSize: [34, 34],
    iconAnchor: [17, 17],
    popupAnchor: [0, -15]
  });
}

export function createClusterMarkerIcon(L, clusterName = "") {
  const safeLabel = escapeHtml(fallbackLetter(clusterName, "C"));
  const html = `<div style="width:34px;height:34px;border-radius:10px;border:2px solid #0b5d37;background:#dcfce7;display:grid;place-items:center;box-shadow:0 6px 12px rgba(15,23,42,0.2);"><span style="font-size:12px;font-weight:700;color:#166534;">${safeLabel}</span></div>`;
  return L.divIcon({
    html,
    className: "",
    iconSize: [34, 34],
    iconAnchor: [17, 17],
    popupAnchor: [0, -15]
  });
}

function distanceMeters(from, to) {
  const [lat1, lon1] = from;
  const [lat2, lon2] = to;
  const earthRadiusMeters = 6371000;
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadiusMeters * c;
}

function uniquePoints(points = []) {
  const map = new Map();
  points.forEach((point) => {
    const normalized = normalizeLatLng(point);
    if (!normalized) {
      return;
    }
    const key = `${normalized[0].toFixed(7)}|${normalized[1].toFixed(7)}`;
    map.set(key, normalized);
  });
  return [...map.values()];
}

function cross(o, a, b) {
  const ox = Number(o[1]);
  const oy = Number(o[0]);
  const ax = Number(a[1]);
  const ay = Number(a[0]);
  const bx = Number(b[1]);
  const by = Number(b[0]);
  return (ax - ox) * (by - oy) - (ay - oy) * (bx - ox);
}

export function buildConvexHull(points = []) {
  const list = uniquePoints(points);
  if (list.length <= 2) {
    return list;
  }

  const sorted = [...list].sort((a, b) => Number(a[1]) - Number(b[1]) || Number(a[0]) - Number(b[0]));
  const lower = [];
  sorted.forEach((point) => {
    while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], point) <= 0) {
      lower.pop();
    }
    lower.push(point);
  });

  const upper = [];
  for (let index = sorted.length - 1; index >= 0; index -= 1) {
    const point = sorted[index];
    while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], point) <= 0) {
      upper.pop();
    }
    upper.push(point);
  }

  lower.pop();
  upper.pop();
  return [...lower, ...upper];
}

export function computeCentroid(points = []) {
  const list = uniquePoints(points);
  if (list.length === 0) {
    return null;
  }
  const [sumLat, sumLon] = list.reduce(
    (acc, point) => [acc[0] + Number(point[0]), acc[1] + Number(point[1])],
    [0, 0]
  );
  return [sumLat / list.length, sumLon / list.length];
}

function destinationPoint(from, distanceInMeters, bearingInDegrees) {
  const lat = Number(from?.[0]);
  const lon = Number(from?.[1]);
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    return null;
  }

  const earthRadiusMeters = 6371000;
  const toRad = (deg) => (deg * Math.PI) / 180;
  const toDeg = (rad) => (rad * 180) / Math.PI;
  const angularDistance = Number(distanceInMeters) / earthRadiusMeters;
  const bearing = toRad(Number(bearingInDegrees));

  const lat1 = toRad(lat);
  const lon1 = toRad(lon);
  const lat2 = Math.asin(
    Math.sin(lat1) * Math.cos(angularDistance) +
      Math.cos(lat1) * Math.sin(angularDistance) * Math.cos(bearing)
  );
  const lon2 =
    lon1 +
    Math.atan2(
      Math.sin(bearing) * Math.sin(angularDistance) * Math.cos(lat1),
      Math.cos(angularDistance) - Math.sin(lat1) * Math.sin(lat2)
    );
  const normalizedLon = ((toDeg(lon2) + 540) % 360) - 180;

  return [toDeg(lat2), normalizedLon];
}

function expandPointsWithBuffer(points = [], bufferMeters = 500) {
  const validBuffer = Number.isFinite(Number(bufferMeters)) && Number(bufferMeters) > 0
    ? Number(bufferMeters)
    : 500;
  const directions = [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330];
  const expanded = [];

  points.forEach((point) => {
    directions.forEach((bearing) => {
      const bufferedPoint = destinationPoint(point, validBuffer, bearing);
      if (bufferedPoint) {
        expanded.push(bufferedPoint);
      }
    });
  });

  return uniquePoints(expanded);
}

export function buildClusterCoverage(points = [], minimumBufferMeters = 500) {
  const list = uniquePoints(points);
  if (list.length === 0) {
    return null;
  }

  const centroid = computeCentroid(list);
  if (!centroid) {
    return null;
  }

  const bufferMeters =
    Number.isFinite(Number(minimumBufferMeters)) && Number(minimumBufferMeters) > 0
      ? Number(minimumBufferMeters)
      : 500;
  const expandedPoints = expandPointsWithBuffer(list, bufferMeters);
  const hull = buildConvexHull(expandedPoints);
  if (hull.length >= 3) {
    return {
      type: "polygon",
      center: centroid,
      polygon: hull,
      radius_meters: 0,
      buffer_meters: bufferMeters,
      point_count: list.length
    };
  }

  const maxDistance = list.reduce(
    (currentMax, point) => Math.max(currentMax, distanceMeters(centroid, point)),
    0
  );
  return {
    type: "circle",
    center: centroid,
    polygon: [],
    radius_meters: Math.max(bufferMeters, maxDistance + bufferMeters),
    buffer_meters: bufferMeters,
    point_count: list.length
  };
}
