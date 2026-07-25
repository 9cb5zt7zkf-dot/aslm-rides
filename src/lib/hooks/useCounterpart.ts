"use client";

import { useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { Profile, Vehicle } from "@/types/ride";

// Loads the other side's profile (+ vehicle, for a driver) once a ride
// has matched a driver_id. RLS permits this only while the two accounts
// share an active ride (see schema.sql "read counterpart on active ride").
export function useCounterpartProfile(userId: string | null) {
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    if (!userId) {
      setProfile(null);
      return;
    }
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;

    supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle()
      .then(({ data }: { data: Profile | null }) => setProfile(data ?? null));
  }, [userId]);

  return profile;
}

export function useDriverVehicle(driverId: string | null) {
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);

  useEffect(() => {
    if (!driverId) {
      setVehicle(null);
      return;
    }
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;

    supabase
      .from("vehicles")
      .select("*")
      .eq("driver_id", driverId)
      .eq("is_active", true)
      .maybeSingle()
      .then(({ data }: { data: Vehicle | null }) => setVehicle(data ?? null));
  }, [driverId]);

  return vehicle;
}
