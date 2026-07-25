"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, MapPin, Navigation, Loader2 } from "lucide-react";
import { RideMap } from "@/components/shared/RideMap";
import { Button } from "@/components/ui/Button";
import { NotConfiguredNotice } from "@/components/shared/NotConfiguredNotice";
import { useProfile } from "@/lib/hooks/useProfile";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { searchAddress, getRoute, type PlaceSuggestion, type RouteResult } from "@/lib/mapbox";
import { VEHICLE_CLASSES, estimateFare, formatAed } from "@/lib/fare";
import { createRide } from "@/lib/rides";
import { formatKm, formatMinutes } from "@/lib/utils";
import type { LngLat, VehicleClass, Ride } from "@/types/ride";

const DUBAI_CENTER: LngLat = { lng: 55.2708, lat: 25.2048 };

type Point = LngLat & { address: string };

export function RiderHomeClient() {
  const router = useRouter();
  const { loading: profileLoading, profile, userId } = useProfile();

  const [pickup, setPickup] = useState<Point | null>(null);
  const [dropoff, setDropoff] = useState<Point | null>(null);
  const [dropoffQuery, setDropoffQuery] = useState("");
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [route, setRoute] = useState<RouteResult | null>(null);
  const [vehicleClass, setVehicleClass] = useState<VehicleClass>("comfort");
  const [requesting, setRequesting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeRide, setActiveRide] = useState<Ride | null | undefined>(undefined);

  // Locate the rider on load and use it as the default pickup point.
  useEffect(() => {
    if (!navigator.geolocation) {
      setPickup({ ...DUBAI_CENTER, address: "Current location" });
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => setPickup({ lat: pos.coords.latitude, lng: pos.coords.longitude, address: "Current location" }),
      () => setPickup({ ...DUBAI_CENTER, address: "Current location" }),
      { timeout: 6000 }
    );
  }, []);

  // Redirect straight to the tracking screen if the rider already has a
  // ride in progress, so this screen never shows a duplicate request form.
  useEffect(() => {
    if (!userId) return;
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;

    supabase
      .from("rides")
      .select("*")
      .eq("rider_id", userId)
      .in("status", ["requested", "accepted", "arriving", "in_progress"])
      .order("requested_at", { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(({ data }) => setActiveRide((data as Ride) ?? null));
  }, [userId]);

  useEffect(() => {
    if (activeRide) router.replace(`/rider/ride/${activeRide.id}`);
  }, [activeRide, router]);

  useEffect(() => {
    const handle = setTimeout(async () => {
      if (dropoffQuery.trim().length < 3) {
        setSuggestions([]);
        return;
      }
      const results = await searchAddress(dropoffQuery, pickup ?? DUBAI_CENTER);
      setSuggestions(results);
    }, 300);
    return () => clearTimeout(handle);
  }, [dropoffQuery, pickup]);

  useEffect(() => {
    if (!pickup || !dropoff) {
      setRoute(null);
      return;
    }
    getRoute(pickup, dropoff).then(setRoute);
  }, [pickup, dropoff]);

  if (!isSupabaseConfigured()) {
    return <NotConfiguredNotice what="Requesting a ride needs a live Supabase project." />;
  }

  if (profileLoading || activeRide === undefined) {
    return (
      <div className="flex h-full min-h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-gold" />
      </div>
    );
  }

  async function handleSelectSuggestion(s: PlaceSuggestion) {
    setDropoff({ lat: s.lat, lng: s.lng, address: s.label });
    setDropoffQuery(s.label);
    setSuggestions([]);
  }

  async function handleRequest() {
    if (!userId || !pickup || !dropoff || !route) return;
    setRequesting(true);
    setError(null);

    const result = await createRide({
      riderId: userId,
      pickup,
      dropoff,
      vehicleClass,
      distanceKm: route.distanceKm,
      durationMin: route.durationMin,
    });

    setRequesting(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    router.push(`/rider/ride/${result.data.id}`);
  }

  return (
    <div className="flex h-full min-h-screen flex-col">
      <div className="relative h-64 shrink-0">
        <RideMap
          className="h-full w-full"
          center={pickup ?? DUBAI_CENTER}
          route={route?.geometry}
          markers={[
            ...(pickup ? [{ id: "pickup", position: pickup, color: "#22c55e" }] : []),
            ...(dropoff ? [{ id: "dropoff", position: dropoff, color: "#f2b73e" }] : []),
          ]}
        />
      </div>

      <div className="flex-1 space-y-5 px-5 py-5">
        <div>
          <p className="mb-2 flex items-center gap-2 text-[13px] text-ink-fg-muted">
            <MapPin className="h-4 w-4 text-success" />
            {pickup?.address ?? "Locating you…"}
          </p>
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-fg-muted" />
            <input
              value={dropoffQuery}
              onChange={(e) => setDropoffQuery(e.target.value)}
              placeholder="Where to?"
              className="w-full rounded-xl border border-ink-border bg-ink-card py-3.5 pl-11 pr-4 text-[15px] text-ink-fg outline-none focus:border-gold"
            />
          </div>
          {suggestions.length > 0 ? (
            <div className="mt-2 overflow-hidden rounded-xl border border-ink-border bg-ink-card">
              {suggestions.map((s) => (
                <button
                  key={s.id}
                  onClick={() => handleSelectSuggestion(s)}
                  className="flex w-full items-center gap-3 border-b border-ink-border px-4 py-3 text-left text-[14px] text-ink-fg last:border-0 hover:bg-ink-muted"
                >
                  <Navigation className="h-4 w-4 shrink-0 text-ink-fg-muted" />
                  {s.label}
                </button>
              ))}
            </div>
          ) : null}
        </div>

        {dropoff && route ? (
          <div>
            <h2 className="mb-3 font-heading text-[15px] font-medium text-ink-fg">Choose a ride</h2>
            <div className="space-y-2.5">
              {(Object.keys(VEHICLE_CLASSES) as VehicleClass[]).map((key) => {
                const rate = VEHICLE_CLASSES[key];
                const fare = estimateFare(key, route.distanceKm, route.durationMin);
                const selected = vehicleClass === key;
                return (
                  <button
                    key={key}
                    onClick={() => setVehicleClass(key)}
                    className={`flex w-full items-center justify-between rounded-2xl border px-4 py-3.5 text-left transition-colors ${
                      selected ? "border-gold bg-ink-muted" : "border-ink-border bg-ink-card"
                    }`}
                  >
                    <div>
                      <div className="font-heading text-[15px] font-medium text-ink-fg">{rate.label}</div>
                      <div className="text-[12.5px] text-ink-fg-muted">{rate.description}</div>
                    </div>
                    <div className="font-heading text-[16px] font-semibold text-gold">{formatAed(fare)}</div>
                  </button>
                );
              })}
            </div>
            <p className="mt-3 text-center text-[12.5px] text-ink-fg-muted">
              {formatKm(route.distanceKm)} · {formatMinutes(route.durationMin)} to destination
            </p>
          </div>
        ) : null}

        {error ? <p className="text-center text-[13px] text-danger">{error}</p> : null}
      </div>

      {dropoff && route ? (
        <div className="bottom-sheet px-5 py-5">
          <Button onClick={handleRequest} loading={requesting} disabled={!profile}>
            Request {VEHICLE_CLASSES[vehicleClass].label} · {formatAed(estimateFare(vehicleClass, route.distanceKm, route.durationMin))}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
