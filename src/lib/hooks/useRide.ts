"use client";

import { useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { Ride } from "@/types/ride";

// Loads a single ride row and keeps it live via a Realtime subscription,
// so both the rider and driver screens reflect status/driver changes the
// instant they happen — no polling.
export function useRide(rideId: string) {
  const [ride, setRide] = useState<Ride | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setLoading(false);
      return;
    }

    let active = true;

    supabase
      .from("rides")
      .select("*")
      .eq("id", rideId)
      .maybeSingle()
      .then(({ data }: { data: Ride | null }) => {
        if (active) {
          setRide(data ?? null);
          setLoading(false);
        }
      });

    const channel = supabase
      .channel(`ride-${rideId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "rides", filter: `id=eq.${rideId}` },
        (payload) => {
          if (active) setRide(payload.new as Ride);
        }
      )
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, [rideId]);

  return { ride, loading };
}
