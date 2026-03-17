"use client";

import { useState } from "react";
import { useEffect, useRef } from "react";
import CompetitorStoreMarker from "./competitor-store-marker";
import OwnStoreMarker from "./own-store-marker";
import { createClusterMarkerIcon, escapeHtml } from "../utils/map-utils";

const SAO_PAULO_CENTER = [-23.55052, -46.633308];
const DEFAULT_ZOOM = 11;

export default function GeolocalizationMapCanvas({
  ownStores = [],
  competitorStores = [],
  clusters = [],
  clusterCoverages = [],
  emptyState = {
    visible: false,
    title: "",
    description: ""
  },
  layerVisibility = {
    ownStores: true,
    competitorStores: true,
    clusters: true,
    coverage: true
  }
}) {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const groupsRef = useRef(null);
  const leafletRef = useRef(null);
  const [mapReady, setMapReady] = useState(false);

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
      leafletRef.current = L;

      const map = L.map(mapContainerRef.current, {
        zoomControl: true,
        center: SAO_PAULO_CENTER,
        zoom: DEFAULT_ZOOM
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      }).addTo(map);

      groupsRef.current = {
        ownStores: L.layerGroup().addTo(map),
        competitorStores: L.layerGroup().addTo(map),
        clusters: L.layerGroup().addTo(map),
        coverage: L.layerGroup().addTo(map)
      };
      mapRef.current = map;
      setMapReady(true);
    }

    setupMap();

    return () => {
      cancelled = true;
      if (mapRef.current) {
        mapRef.current.remove();
      }
      mapRef.current = null;
      groupsRef.current = null;
      leafletRef.current = null;
      setMapReady(false);
    };
  }, []);

  useEffect(() => {
    if (!mapRef.current || !groupsRef.current) {
      return;
    }

    const leaflet = leafletRef.current;
    if (!leaflet) {
      return;
    }

    const bounds = [];
    groupsRef.current.ownStores.clearLayers();
    groupsRef.current.competitorStores.clearLayers();
    groupsRef.current.clusters.clearLayers();
    groupsRef.current.coverage.clearLayers();

    if (layerVisibility?.ownStores) {
      ownStores.forEach((store) => {
        const marker = OwnStoreMarker({
          L: leaflet,
          layer: groupsRef.current.ownStores,
          store,
          logoUrl: store?.marker_logo_url || ""
        });
        if (marker?.getLatLng) {
          bounds.push(marker.getLatLng());
        }
      });
    }

    if (layerVisibility?.competitorStores) {
      competitorStores.forEach((store) => {
        const marker = CompetitorStoreMarker({
          L: leaflet,
          layer: groupsRef.current.competitorStores,
          store,
          logoUrl: store?.marker_logo_url || ""
        });
        if (marker?.getLatLng) {
          bounds.push(marker.getLatLng());
        }
      });
    }

    if (layerVisibility?.coverage) {
      clusterCoverages.forEach((cluster) => {
        const polygon = Array.isArray(cluster?.coverage_polygon) ? cluster.coverage_polygon : [];
        if (polygon.length >= 3) {
          const layer = leaflet.polygon(polygon, {
            color: "#166534",
            weight: 2,
            fillColor: "#86efac",
            fillOpacity: 0.16
          });
          layer.addTo(groupsRef.current.coverage);
          const layerBounds = layer.getBounds();
          if (layerBounds?.isValid?.()) {
            bounds.push(layerBounds.getSouthWest());
            bounds.push(layerBounds.getNorthEast());
          }
          return;
        }

        const lat = Number(cluster?.lat);
        const lon = Number(cluster?.lon);
        const radius = Number(cluster?.coverage_radius_meters || 0);
        if (!Number.isFinite(lat) || !Number.isFinite(lon) || !Number.isFinite(radius) || radius <= 0) {
          return;
        }
        const layer = leaflet.circle([lat, lon], {
          radius,
          color: "#166534",
          weight: 2,
          fillColor: "#86efac",
          fillOpacity: 0.14
        });
        layer.addTo(groupsRef.current.coverage);
        const layerBounds = layer.getBounds();
        if (layerBounds?.isValid?.()) {
          bounds.push(layerBounds.getSouthWest());
          bounds.push(layerBounds.getNorthEast());
        }
      });
    }

    if (layerVisibility?.clusters) {
      clusters.forEach((cluster) => {
        const lat = Number(cluster?.lat);
        const lon = Number(cluster?.lon);
        if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
          return;
        }
        const marker = leaflet.marker([lat, lon], {
          icon: createClusterMarkerIcon(leaflet, cluster?.name || "")
        });
        const popupHtml =
          `<strong>${escapeHtml(cluster?.name || "Cluster")}</strong><br/>` +
          `<small>Lojas: ${Number(cluster?.own_count || 0)} | Concorrentes: ${Number(cluster?.competitor_count || 0)}</small>`;
        marker.bindPopup(popupHtml);
        marker.addTo(groupsRef.current.clusters);
        bounds.push(marker.getLatLng());
      });
    }

    if (bounds.length === 0) {
      mapRef.current.setView(SAO_PAULO_CENTER, DEFAULT_ZOOM);
      return;
    }
    const latLngBounds = leaflet.latLngBounds(bounds);
    mapRef.current.fitBounds(latLngBounds.pad(0.16));
  }, [ownStores, competitorStores, clusters, clusterCoverages, layerVisibility, mapReady]);

  return (
    <div className={"relative h-full w-full"}>
      <div ref={mapContainerRef} className={"h-full w-full"} />
      {emptyState?.visible ? (
        <section className={"pointer-events-none absolute left-1/2 top-1/2 z-[1100] w-[min(92vw,520px)] -translate-x-1/2 -translate-y-1/2 rounded-xl border border-slate-200 bg-white/96 px-4 py-3 text-center shadow-[0_12px_30px_rgba(15,23,42,0.18)] backdrop-blur-sm"}>
          <strong className={"block text-sm text-slate-900"}>{String(emptyState?.title || "Sem dados")}</strong>
          <p className={"mt-1 text-xs text-slate-700"}>{String(emptyState?.description || "")}</p>
        </section>
      ) : null}
    </div>
  );
}
