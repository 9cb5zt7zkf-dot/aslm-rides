"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Phone, X } from "lucide-react";
import { RideMap } from "@/components/shared/RideMap";
import { Button } from "@/components/ui/Button";
import { NotConfiguredNotice } from "@/components/shared/NotConfiguredNotice";
import { useRide } from "@/lib/hooks/useRide";
import { useCounterpartProfile } from "@/lib/hooks/useCounterpart";
import { getRoute, type RouteResult } from "@/lib/mapbox";
import { updateRideStatus, cancelRide } from "@/lib/rides";
import { formatAed } from "@/lib/fare";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { initials } from "@/lib/utils";
import type { Ride } from "@/types/ride";

const NEXT_STEP: Partial<Record<Ride["status"], { status: Ride["status"]; label: string }>> = {
  accepted: { status: "arriving", label: "I've arrived" },
  arriving: { status: "in_progress", label: "Start trip" },
  in_progress: { status: "completed", label: "Complete trip" },
};

export function DriverRideClient({ rideId }: { rideId: string }) {
  const router = useRouter();
  const { ride, loading } = useRide(rideId);
  const riderProfile = useCounterpartProfile(ride?.rider_id ?? null);
  const [route, setRoute] = useState<RouteResult | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!ride) return;
    if (ride.status === "in_progress") {
      getRoute({ lat: ride.pickup_lat, lng: ride.pickup_lng }, { lat: ride.dropoff_lat, lng: ride.dropoff_lng }).then(
        setRoute
      );
    } else {
      setRoute(null);
    }
  }, [ride]);

  if (!isSupabaseConfigured()) {
    return <NotConfiguredNotice what="The active ride screen needs a live Supabase project." />;
  }

  if (loading || !ride) {
    return (
      <div className="flex h-full min-h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-gold" />
      </div>
    );
  }

  const nextStep = NEXT_STEP[ride.status];

  async function handleAdvance() {
    if (!nextStep) return;
    setBusy(true);
    const extra = nextStep.status === "completed" ? { final_fare_aed: ride!.estimated_fare_aed ?? undefined } : undefined;
    const result = await updateRideStatus(ride!.id, nextStep.status, extra);
    setBusy(false);
    if (result.ok && nextStep.status === "completed") router.replace("/driver/home");
  }

  async function handleCancel() {
    setBusy(true);
    await cancelRide(ride!.id, "driver", "Cancelled by driver");
    setBusy(false);
    router.replace("/driver/home");
  }

  const markers = [
    { id: "pickup", position: { lat: ride.pickup_lat, lng: ride.pickup_lng }, color: "#22c55e" },
    { id: "dropoff", position: { lat: ride.dropoff_lat, lng: ride.dropoff_lng }, color: "#f2b73e" },
  ];

  return (
    <div className="flex h-full min-h-screen flex-col">
      <div className="relative h-64 shrink-0">
        <RideMap className="h-full w-full" markers={markers} route={route?.geometry} />
      </div>

      <div className="flex-1 px-5 py-5">
        {riderProfile ? (
          <div className="flex items-center gap-3 rounded-2xl border border-ink-border bg-ink-card p-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-ink-muted font-heading text-[14px] font-semibold text-gold">
              {initials(riderProfile.full_name)}
            </div>
            <div className="flex-1">
              <div className="font-heading text-[15px] font-medium text-ink-fg">{riderProfile.full_name ?? "Rider"}</div>
              <div className="text-[12.5px] text-ink-fg-muted capitalize">{ride.status.replace("_", " ")}</div>
            </div>
            {riderProfile.phone ? (
              <a href={`tel:${riderProfile.phone}`} className="flex h-10 w-10 items-center justify-center rounded-full bg-ink-muted text-gold">
                <Phone className="h-4 w-4" />
              </a>
            ) : null}
          </div>
        ) : null}

        <div className="mt-5 space-y-2 rounded-2xl border border-ink-border bg-ink-card p-4 text-[13.5px]">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-success" />
            <span className="text-ink-fg-muted">{ride.pickup_address}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-gold" />
            <span className="text-ink-fg-muted">{ride.dropoff_address}</span>
          </div>
        </div>

        <p className="mt-4 text-center font-heading text-[17px] font-semibold text-gold">
          {formatAed(ride.estimated_fare_aed ?? 0)}
        </p>
      </div>

      <div className="bottom-sheet space-y-3 px-5 py-5">
        {nextStep ? (
          <Button onClick={handleAdvance} loading={busy}>
            {nextStep.label}
          </Button>
        ) : null}
        {ride.status !== "in_progress" ? (
          <Button variant="danger" onClick={handleCancel} loading={busy}>
            <X className="h-4 w-4" />
            Cancel ride
          </Button>
        ) : null}
      </div>
    </div>
  );
}
