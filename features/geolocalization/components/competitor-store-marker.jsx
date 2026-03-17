"use client";

import {
  createLogoMarkerIcon,
  escapeHtml,
  getStoreLatLng
} from "../utils/map-utils";

export default function CompetitorStoreMarker({ L, layer, store, logoUrl }) {
  if (!L || !layer || !store) {
    return null;
  }

  const latlng = getStoreLatLng(store);
  if (!latlng) {
    return null;
  }

  const icon = createLogoMarkerIcon(L, {
    logoUrl,
    label: store?.competitor_banner_name || store?.name || "C",
    borderColor: "#b91c1c"
  });
  const marker = L.marker(latlng, { icon });
  const city = escapeHtml(store?.marker_city || store?.address?.city || store?.address_city || "-");
  const state = escapeHtml(store?.marker_state || store?.address?.state || store?.address_state || "-");
  const networkName = escapeHtml(store?.marker_network_name || "-");
  const bannerName = escapeHtml(
    store?.marker_banner_name || store?.competitor_banner_name || "-"
  );
  const safeFacade = escapeHtml(store?.marker_facade_url || "");
  const safeLogo = escapeHtml(logoUrl || "");
  const popupHtml =
    `<div style="min-width:210px;display:grid;gap:6px;">` +
    `<strong style="font-size:13px;color:#0f172a;">${escapeHtml(store?.name || "Concorrente")}</strong>` +
    `<small style="color:#334155;">Loja concorrente</small>` +
    (safeLogo
      ? `<img src="${safeLogo}" alt="" style="width:36px;height:36px;object-fit:contain;border-radius:999px;border:1px solid #e2e8f0;background:#fff;" />`
      : "") +
    (safeFacade
      ? `<img src="${safeFacade}" alt="" style="width:100%;height:72px;object-fit:cover;border-radius:8px;border:1px solid #e2e8f0;" />`
      : "") +
    `<small><strong>Rede:</strong> ${networkName}</small>` +
    `<small><strong>Bandeira:</strong> ${bannerName}</small>` +
    `<small><strong>Cidade:</strong> ${city} / ${state}</small>` +
    `</div>`;
  marker.bindPopup(popupHtml);
  marker.addTo(layer);
  return marker;
}
