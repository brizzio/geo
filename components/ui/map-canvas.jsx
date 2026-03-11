"use client";

import { useEffect, useRef } from "react";
import { useMapState } from "../../features/map/state/map-state";
import {
  selectBranchStores,
  selectConcurrentStores,
  selectHeadquarters,
  selectHeadquarterStores,
  selectSearchItems
} from "../../features/map/state/selectors";

const SAO_PAULO_CENTER = [-23.55052, -46.633308];
const DEFAULT_ZOOM = 11;

function toLatLng(item) {
  const raw = item?.geo?.latlon;
  if (Array.isArray(raw) && raw.length >= 2) {
    const lat = Number.parseFloat(raw[0]);
    const lon = Number.parseFloat(raw[1]);
    if (Number.isFinite(lat) && Number.isFinite(lon)) {
      return [lat, lon];
    }
  }
  return null;
}

function popupText(item, fallbackCategory) {
  const title = item?.name || item?.display_name || "Sem nome";
  const category = item?.category || fallbackCategory || "item";
  return `<strong>${title}</strong><br/><small>${category}</small>`;
}

function drawGroup(layerGroup, items, color, fallbackCategory, markerColorSelector) {
  layerGroup.clearLayers();
  items.forEach((item) => {
    const latlng = toLatLng(item);
    if (!latlng) {
      return;
    }
    const markerColor = markerColorSelector?.(item) || color;
    const marker = window.L.circleMarker(latlng, {
      radius: 8,
      color: markerColor,
      weight: 2,
      fillColor: markerColor,
      fillOpacity: 0.75
    });
    marker.bindPopup(popupText(item, fallbackCategory));
    marker.addTo(layerGroup);
  });
}

export default function MapCanvas() {
  const { state } = useMapState();
  const searchItems = selectSearchItems(state);
  const headquarters = selectHeadquarters(state);
  const headquarterStores = selectHeadquarterStores(state);
  const branchStores = selectBranchStores(state);
  const concurrentStores = selectConcurrentStores(state);
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const groupsRef = useRef(null);

  useEffect(() => {
    let cancelled = false;

    async function setupMap() {
      if (mapRef.current || !mapContainerRef.current) {
        return;
      }

      const leafletModule = await import("leaflet");
      const L = leafletModule.default ?? leafletModule;
      if (cancelled || mapRef.current || !mapContainerRef.current) {
        return;
      }

      window.L = window.L || L;
      const map = L.map(mapContainerRef.current, {
        zoomControl: true,
        center: SAO_PAULO_CENTER,
        zoom: DEFAULT_ZOOM
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      }).addTo(map);

      const groups = {
        searchItems: L.layerGroup().addTo(map),
        headquarters: L.layerGroup().addTo(map),
        headquarterStores: L.layerGroup().addTo(map),
        branchStores: L.layerGroup().addTo(map),
        concurrentStores: L.layerGroup().addTo(map)
      };

      mapRef.current = map;
      groupsRef.current = groups;
    }

    setupMap();

    return () => {
      cancelled = true;
      if (mapRef.current) {
        mapRef.current.remove();
      }
      mapRef.current = null;
      groupsRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!groupsRef.current) {
      return;
    }

    drawGroup(groupsRef.current.searchItems, searchItems, "#2f6fed", "search-result");
    drawGroup(groupsRef.current.headquarters, headquarters, "#111111", "headquarter");
    drawGroup(
      groupsRef.current.headquarterStores,
      headquarterStores,
      "#bf2b2b",
      "headquarter-store",
      (item) => item?.geo?.activated_marker_color
    );
    drawGroup(
      groupsRef.current.branchStores,
      branchStores,
      "#f18f01",
      "branch-store",
      (item) => item?.geo?.activated_marker_color
    );
    drawGroup(
      groupsRef.current.concurrentStores,
      concurrentStores,
      "#5a3ec8",
      "concurrent-store",
      (item) => item?.geo?.activated_marker_color
    );
  }, [
    searchItems,
    headquarters,
    headquarterStores,
    branchStores,
    concurrentStores
  ]);

  return <div ref={mapContainerRef} style={{ width: "100%", height: "100%" }} />;
}
