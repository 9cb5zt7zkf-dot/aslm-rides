"use client";

import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { estimateFare } from "@/lib/fare";
import type { Ride, VehicleClass, LngLat, Role } from "@/types/ride";

export type ActionResult<T = void> = { ok: true; data: T } | { ok: false; error: string };

function fail(error: string): ActionResult<never> {
  return { ok: false, error };
}

export async function createRide(params: {
  riderId: string;
  pickup: LngLat & { address: string };
  dropoff: LngLat & { address: string };
  vehicleClass: VehicleClass;
  distanceKm: number;
  durationMin: number;
}): Promise<ActionResult<Ride>> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return fail("Backend not configured.");

  const estimatedFare = estimateFare(params.vehicleClass, params.distanceKm, params.durationMin);

  const { data, error } = await supabase
    .from("rides")
    .insert({
      rider_id: params.riderId,
      status: "requested",
      vehicle_class: params.vehicleClass,
      pickup_address: params.pickup.address,
      pickup_lat: params.pickup.lat,
      pickup_lng: params.pickup.lng,
      dropoff_address: params.dropoff.address,
      dropoff_lat: params.dropoff.lat,
      dropoff_lng: params.dropoff.lng,
      distance_km: params.distanceKm,
      duration_min: params.durationMin,
      estimated_fare_aed: estimatedFare,
    })
    .select()
    .single();

  if (error) return fail(error.message);
  return { ok: true, data: data as Ride };
}

// Atomic, race-safe claim: the UPDATE only affects a row if it is still
// `requested` with no driver assigned. If another driver claimed it a
// moment earlier, this update matches zero rows and we report that
// honestly instead of pretending the claim succeeded.
export async function claimRide(rideId: string, driverId: string): Promise<ActionResult<Ride>> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return fail("Backend not configured.");

  const { data, error } = await supabase
    .from("rides")
    .update({ driver_id: driverId, status: "accepted", accepted_at: new Date().toISOString() })
    .eq("id", rideId)
    .eq("status", "requested")
    .is("driver_id", null)
    .select()
    .maybeSingle();

  if (error) return fail(error.message);
  if (!data) return fail("This ride was already accepted by another driver.");
  return { ok: true, data: data as Ride };
}

const STATUS_TIMESTAMP_FIELD: Partial<Record<Ride["status"], string>> = {
  arriving: "arrived_at",
  in_progress: "started_at",
  completed: "completed_at",
};

export async function updateRideStatus(
  rideId: string,
  status: Ride["status"],
  extra?: { final_fare_aed?: number }
): Promise<ActionResult<Ride>> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return fail("Backend not configured.");

  const timestampField = STATUS_TIMESTAMP_FIELD[status];
  const patch: Record<string, unknown> = { status, ...extra };
  if (timestampField) patch[timestampField] = new Date().toISOString();

  const { data, error } = await supabase.from("rides").update(patch).eq("id", rideId).select().single();
  if (error) return fail(error.message);
  return { ok: true, data: data as Ride };
}

export async function cancelRide(rideId: string, cancelledBy: Role, reason?: string): Promise<ActionResult<Ride>> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return fail("Backend not configured.");

  const { data, error } = await supabase
    .from("rides")
    .update({
      status: "cancelled",
      cancelled_by: cancelledBy,
      cancel_reason: reason ?? null,
      cancelled_at: new Date().toISOString(),
    })
    .eq("id", rideId)
    .select()
    .single();

  if (error) return fail(error.message);
  return { ok: true, data: data as Ride };
}

export async function submitRating(
  rideId: string,
  ratedBy: Role,
  stars: number,
  comment?: string
): Promise<ActionResult<void>> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return fail("Backend not configured.");

  const { error } = await supabase
    .from("ratings")
    .upsert({ ride_id: rideId, rated_by: ratedBy, stars, comment: comment ?? null }, { onConflict: "ride_id,rated_by" });

  if (error) return fail(error.message);
  return { ok: true, data: undefined };
}

export async function setDriverOnline(driverId: string, isOnline: boolean, position?: LngLat): Promise<ActionResult<void>> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return fail("Backend not configured.");

  const { error } = await supabase.from("driver_status").upsert({
    driver_id: driverId,
    is_online: isOnline,
    lat: position?.lat ?? null,
    lng: position?.lng ?? null,
    updated_at: new Date().toISOString(),
  });

  if (error) return fail(error.message);
  return { ok: true, data: undefined };
}

export async function updateDriverLocation(driverId: string, position: LngLat, heading?: number): Promise<ActionResult<void>> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return fail("Backend not configured.");

  const { error } = await supabase
    .from("driver_status")
    .update({ lat: position.lat, lng: position.lng, heading: heading ?? null, updated_at: new Date().toISOString() })
    .eq("driver_id", driverId);

  if (error) return fail(error.message);
  return { ok: true, data: undefined };
}
