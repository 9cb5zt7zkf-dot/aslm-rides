"use client";

import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import type { LngLat } from "@/types/ride";
import { getMapboxToken, isMapboxConfigured } from "@/lib/supabase/config";

export type MapMarker = {
  id: string;
  position: LngLat;
  color: string;
  label?: string;
};

export function RideMap({
  markers,
  route,
  center,
  zoom = 12,
  className,
}: {
  markers: MapMarker[];
  route?: GeoJSON.LineString | null;
  center?: LngLat;
  zoom?: number;
  className?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markerRefs = useRef<Map<string, mapboxgl.Marker>>(new Map());

  useEffect(() => {
    if (!isMapboxConfigured() || !containerRef.current || mapRef.current) return;

    mapboxgl.accessToken = getMapboxToken();
    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: "mapbox://styles/mapbox/dark-v11",
      center: center ? [center.lng, center.lat] : [55.2708, 25.2048], // Dubai fallback
      zoom,
    });
    map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), "bottom-right");
    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const currentIds = new Set(markers.map((m) => m.id));
    for (const [id, marker] of markerRefs.current.entries()) {
      if (!currentIds.has(id)) {
        marker.remove();
        markerRefs.current.delete(id);
      }
    }

    for (const m of markers) {
      const existing = markerRefs.current.get(m.id);
      if (existing) {
        existing.setLngLat([m.position.lng, m.position.lat]);
        continue;
      }
      const el = document.createElement("div");
      el.style.width = "14px";
      el.style.height = "14px";
      el.style.borderRadius = "50%";
      el.style.background = m.color;
      el.style.border = "2px solid white";
      el.style.boxShadow = "0 0 0 2px rgba(0,0,0,0.4)";
      const marker = new mapboxgl.Marker({ element: el }).setLngLat([m.position.lng, m.position.lat]).addTo(map);
      markerRefs.current.set(m.id, marker);
    }

    if (markers.length > 0) {
      const bounds = new mapboxgl.LngLatBounds();
      markers.forEach((m) => bounds.extend([m.position.lng, m.position.lat]));
      map.fitBounds(bounds, { padding: 80, maxZoom: 15, duration: 500 });
    }
  }, [markers]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const applyRoute = () => {
      const source = map.getSource("route") as mapboxgl.GeoJSONSource | undefined;
      const data: GeoJSON.Feature<GeoJSON.LineString> = {
        type: "Feature",
        properties: {},
        geometry: route ?? { type: "LineString", coordinates: [] },
      };

      if (source) {
        source.setData(data);
        return;
      }

      map.addSource("route", { type: "geojson", data });
      map.addLayer({
        id: "route-line",
        type: "line",
        source: "route",
        layout: { "line-join": "round", "line-cap": "round" },
        paint: { "line-color": "#f2b73e", "line-width": 4, "line-opacity": 0.85 },
      });
    };

    if (map.isStyleLoaded()) applyRoute();
    else map.once("load", applyRoute);
  }, [route]);

  if (!isMapboxConfigured()) {
    return (
      <div className={`flex items-center justify-center bg-ink-muted text-center text-sm text-ink-fg-muted ${className ?? ""}`}>
        Map unavailable — add NEXT_PUBLIC_MAPBOX_TOKEN to enable live maps.
      </div>
    );
  }

  return <div ref={containerRef} className={className} />;
}
