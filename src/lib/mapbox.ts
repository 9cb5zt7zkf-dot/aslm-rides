import type { LngLat } from "@/types/ride";
import { getMapboxToken } from "@/lib/supabase/config";

export type PlaceSuggestion = {
  id: string;
  label: string;
  lng: number;
  lat: number;
};

export type RouteResult = {
  distanceKm: number;
  durationMin: number;
  geometry: GeoJSON.LineString;
};

// Forward geocoding via Mapbox — used for the pickup/drop-off address
// search boxes. `proximity` biases results toward the rider's current
// area (Dubai/UAE) for more relevant matches.
export async function searchAddress(query: string, proximity?: LngLat): Promise<PlaceSuggestion[]> {
  const token = getMapboxToken();
  if (!token || query.trim().length < 3) return [];

  const params = new URLSearchParams({
    access_token: token,
    autocomplete: "true",
    limit: "5",
    country: "ae",
  });
  if (proximity) params.set("proximity", `${proximity.lng},${proximity.lat}`);

  const res = await fetch(
    `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?${params.toString()}`
  );
  if (!res.ok) return [];

  const data = await res.json();
  type Feature = { id: string; place_name: string; center: [number, number] };
  return (data.features ?? []).map((f: Feature) => ({
    id: f.id,
    label: f.place_name,
    lng: f.center[0],
    lat: f.center[1],
  }));
}

// Driving route + distance/duration between two points, used for the
// fare estimate and for drawing the route line on the map.
export async function getRoute(origin: LngLat, destination: LngLat): Promise<RouteResult | null> {
  const token = getMapboxToken();
  if (!token) return null;

  const coords = `${origin.lng},${origin.lat};${destination.lng},${destination.lat}`;
  const params = new URLSearchParams({
    access_token: token,
    geometries: "geojson",
    overview: "full",
  });

  const res = await fetch(`https://api.mapbox.com/directions/v5/mapbox/driving/${coords}?${params.toString()}`);
  if (!res.ok) return null;

  const data = await res.json();
  const route = data.routes?.[0];
  if (!route) return null;

  return {
    distanceKm: route.distance / 1000,
    durationMin: route.duration / 60,
    geometry: route.geometry,
  };
}
