"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, MapPin, Navigation } from "lucide-react";
import { RideMap } from "@/components/shared/RideMap";
import { NotConfiguredNotice } from "@/components/shared/NotConfiguredNotice";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { useProfile } from "@/lib/hooks/useProfile";
import { useOpenRideRequests } from "@/lib/hooks/useOpenRideRequests";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { setDriverOnline, updateDriverLocation, claimRide } from "@/lib/rides";
import { formatAed } from "@/lib/fare";
import { formatKm } from "@/lib/utils";
import type { Ride, LngLat } from "@/types/ride";

const DUBAI_CENTER: LngLat = { lng: 55.2708, lat: 25.2048 };

export function DriverHomeClient() {
  const router = useRouter();
  const { loading: profileLoading, userId } = useProfile();

  const [online, setOnline] = useState(false);
  const [position, setPosition] = useState<LngLat>(DUBAI_CENTER);
  const [activeRide, setActiveRide] = useState<Ride | null | undefined>(undefined);
  const [claimingId, setClaimingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const watchIdRef = useRef<number | null>(null);

  const openRequests = useOpenRideRequests(online && activeRide === null);

  useEffect(() => {
    if (!userId) return;
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;

    supabase
      .from("rides")
      .select("*")
      .eq("driver_id", userId)
      .in("status", ["accepted", "arriving", "in_progress"])
      .order("requested_at", { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(({ data }: { data: Ride | null }) => setActiveRide(data ?? null));
  }, [userId]);

  useEffect(() => {
    if (activeRide) router.replace(`/driver/ride/${activeRide.id}`);
  }, [activeRide, router]);

  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current);
    };
  }, []);

  if (!isSupabaseConfigured()) {
    return <NotConfiguredNotice what="Going online needs a live Supabase project." />;
  }

  if (profileLoading || activeRide === undefined) {
    return (
      <div className="flex h-full min-h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-gold" />
      </div>
    );
  }

  async function handleToggleOnline() {
    if (!userId) return;
    const next = !online;

    if (next && navigator.geolocation) {
      watchIdRef.current = navigator.geolocation.watchPosition(
        (pos) => {
          const p = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setPosition(p);
          updateDriverLocation(userId, p, pos.coords.heading ?? undefined);
        },
        () => {},
        { enableHighAccuracy: true, maximumAge: 5000 }
      );
    } else if (!next && watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }

    const result = await setDriverOnline(userId, next, position);
    if (result.ok) setOnline(next);
  }

  async function handleAccept(rideId: string) {
    if (!userId) return;
    setClaimingId(rideId);
    setError(null);
    const result = await claimRide(rideId, userId);
    setClaimingId(null);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    router.push(`/driver/ride/${result.data.id}`);
  }

  return (
    <div className="flex h-full min-h-screen flex-col">
      <div className="relative h-56 shrink-0">
        <RideMap className="h-full w-full" center={position} markers={[{ id: "me", position, color: "#3b82f6" }]} />
        <button
          onClick={handleToggleOnline}
          className={`absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full px-6 py-3 text-[14px] font-semibold shadow-gold transition-colors ${
            online ? "bg-danger text-white" : "bg-gradient-gold text-black"
          }`}
        >
          {online ? "Go offline" : "Go online"}
        </button>
      </div>

      <div className="flex-1 px-5 py-5">
        {!online ? (
          <p className="mt-10 text-center text-[14px] text-ink-fg-muted">
            You&rsquo;re offline. Go online to start receiving ride requests.
          </p>
        ) : openRequests.length === 0 ? (
          <div className="mt-10 flex flex-col items-center text-center">
            <Loader2 className="h-5 w-5 animate-spin text-gold" />
            <p className="mt-3 text-[14px] text-ink-fg-muted">Waiting for ride requests…</p>
          </div>
        ) : (
          <div className="space-y-3">
            <h2 className="font-heading text-[15px] font-medium text-ink-fg">Nearby requests</h2>
            {openRequests.map((ride) => (
              <div key={ride.id} className="rounded-2xl border border-ink-border bg-ink-card p-4">
                <div className="flex items-start gap-2 text-[13.5px] text-ink-fg">
                  <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-success" />
                  {ride.pickup_address}
                </div>
                <div className="mt-1.5 flex items-start gap-2 text-[13.5px] text-ink-fg-muted">
                  <Navigation className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  {ride.dropoff_address}
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-[12.5px] text-ink-fg-muted">
                    {ride.distance_km ? formatKm(ride.distance_km) : ""} · {ride.vehicle_class}
                  </span>
                  <span className="font-heading text-[15px] font-semibold text-gold">
                    {formatAed(ride.estimated_fare_aed ?? 0)}
                  </span>
                </div>
                <button
                  onClick={() => handleAccept(ride.id)}
                  disabled={claimingId === ride.id}
                  className="mt-3 w-full rounded-full bg-gradient-gold py-2.5 text-[14px] font-semibold text-black disabled:opacity-50"
                >
                  {claimingId === ride.id ? "Accepting…" : "Accept"}
                </button>
              </div>
            ))}
          </div>
        )}
        {error ? <p className="mt-3 text-center text-[13px] text-danger">{error}</p> : null}
      </div>
    </div>
  );
}
