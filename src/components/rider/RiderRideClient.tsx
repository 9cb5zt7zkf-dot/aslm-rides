"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Phone, X } from "lucide-react";
import { RideMap } from "@/components/shared/RideMap";
import { Button } from "@/components/ui/Button";
import { StarRating } from "@/components/shared/StarRating";
import { NotConfiguredNotice } from "@/components/shared/NotConfiguredNotice";
import { useRide } from "@/lib/hooks/useRide";
import { useDriverLocation } from "@/lib/hooks/useDriverLocation";
import { useCounterpartProfile, useDriverVehicle } from "@/lib/hooks/useCounterpart";
import { getRoute, type RouteResult } from "@/lib/mapbox";
import { cancelRide, submitRating } from "@/lib/rides";
import { formatAed } from "@/lib/fare";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { initials } from "@/lib/utils";

const STATUS_COPY: Record<string, string> = {
  requested: "Finding your driver…",
  accepted: "Your driver is on the way",
  arriving: "Your driver has arrived",
  in_progress: "On the way to your destination",
  completed: "Ride complete",
  cancelled: "Ride cancelled",
};

export function RiderRideClient({ rideId }: { rideId: string }) {
  const router = useRouter();
  const { ride, loading } = useRide(rideId);
  const driverStatus = useDriverLocation(ride?.driver_id ?? null);
  const driverProfile = useCounterpartProfile(ride?.driver_id ?? null);
  const driverVehicle = useDriverVehicle(ride?.driver_id ?? null);

  const [route, setRoute] = useState<RouteResult | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [stars, setStars] = useState(0);
  const [ratingSubmitted, setRatingSubmitted] = useState(false);

  useEffect(() => {
    if (!ride) return;
    if (ride.status === "accepted" && driverStatus?.lat && driverStatus.lng) {
      getRoute({ lat: driverStatus.lat, lng: driverStatus.lng }, { lat: ride.pickup_lat, lng: ride.pickup_lng }).then(
        setRoute
      );
    } else if (ride.status === "in_progress") {
      getRoute({ lat: ride.pickup_lat, lng: ride.pickup_lng }, { lat: ride.dropoff_lat, lng: ride.dropoff_lng }).then(
        setRoute
      );
    }
  }, [ride, driverStatus]);

  if (!isSupabaseConfigured()) {
    return <NotConfiguredNotice what="Live ride tracking needs a live Supabase project." />;
  }

  if (loading || !ride) {
    return (
      <div className="flex h-full min-h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-gold" />
      </div>
    );
  }

  async function handleCancel() {
    setCancelling(true);
    await cancelRide(ride!.id, "rider", "Cancelled by rider");
    setCancelling(false);
  }

  async function handleRate() {
    if (stars === 0) return;
    await submitRating(ride!.id, "rider", stars);
    setRatingSubmitted(true);
  }

  const markers = [
    { id: "pickup", position: { lat: ride.pickup_lat, lng: ride.pickup_lng }, color: "#22c55e" },
    { id: "dropoff", position: { lat: ride.dropoff_lat, lng: ride.dropoff_lng }, color: "#f2b73e" },
    ...(driverStatus?.lat && driverStatus.lng
      ? [{ id: "driver", position: { lat: driverStatus.lat, lng: driverStatus.lng }, color: "#3b82f6" }]
      : []),
  ];

  if (ride.status === "completed") {
    return (
      <div className="app-shell items-center justify-center px-8 py-12 text-center">
        {ratingSubmitted ? (
          <>
            <h1 className="font-heading text-2xl font-semibold text-ink-fg">Thanks for riding with ASLM</h1>
            <p className="mt-2 text-[14px] text-ink-fg-muted">We hope to see you again soon.</p>
            <Button className="mt-8" onClick={() => router.replace("/rider/home")}>
              Done
            </Button>
          </>
        ) : (
          <>
            <h1 className="font-heading text-2xl font-semibold text-ink-fg">Ride complete</h1>
            <p className="mt-2 text-[14px] text-ink-fg-muted">
              Total fare: {formatAed(ride.final_fare_aed ?? ride.estimated_fare_aed ?? 0)}
            </p>
            <p className="mt-8 text-[14px] text-ink-fg-muted">How was your trip?</p>
            <div className="mt-3">
              <StarRating value={stars} onChange={setStars} />
            </div>
            <Button className="mt-8" onClick={handleRate} disabled={stars === 0}>
              Submit rating
            </Button>
          </>
        )}
      </div>
    );
  }

  if (ride.status === "cancelled") {
    return (
      <div className="app-shell items-center justify-center px-8 py-12 text-center">
        <h1 className="font-heading text-2xl font-semibold text-ink-fg">Ride cancelled</h1>
        <p className="mt-2 text-[14px] text-ink-fg-muted">
          {ride.cancelled_by === "driver" ? "Your driver cancelled this ride." : "You cancelled this ride."}
        </p>
        <Button className="mt-8" onClick={() => router.replace("/rider/home")}>
          Book another ride
        </Button>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-screen flex-col">
      <div className="relative h-72 shrink-0">
        <RideMap className="h-full w-full" markers={markers} route={route?.geometry} />
      </div>

      <div className="flex-1 px-5 py-5">
        <h1 className="font-heading text-[19px] font-semibold text-ink-fg">{STATUS_COPY[ride.status]}</h1>

        {ride.driver_id && driverProfile ? (
          <div className="mt-4 flex items-center gap-3 rounded-2xl border border-ink-border bg-ink-card p-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-ink-muted font-heading text-[14px] font-semibold text-gold">
              {initials(driverProfile.full_name)}
            </div>
            <div className="flex-1">
              <div className="font-heading text-[15px] font-medium text-ink-fg">{driverProfile.full_name ?? "Driver"}</div>
              {driverVehicle ? (
                <div className="text-[12.5px] text-ink-fg-muted">
                  {driverVehicle.color} {driverVehicle.make} {driverVehicle.model} · {driverVehicle.plate_number}
                </div>
              ) : null}
            </div>
            {driverProfile.phone ? (
              <a
                href={`tel:${driverProfile.phone}`}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-ink-muted text-gold"
              >
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

      {ride.status === "requested" ? (
        <div className="bottom-sheet px-5 py-5">
          <Button variant="danger" onClick={handleCancel} loading={cancelling}>
            <X className="h-4 w-4" />
            Cancel request
          </Button>
        </div>
      ) : null}
    </div>
  );
}
