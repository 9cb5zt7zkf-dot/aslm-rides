"use client";

import { useEffect, useState } from "react";
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { Ride } from "@/types/ride";

// Live feed of open ("requested") rides — every online driver sees the
// same list and the first to accept claims it (see claimRide's atomic
// conditional UPDATE in lib/rides.ts). This broadcast-and-race pattern is
// the documented MVP dispatch strategy — see README for the tradeoffs
// versus sequential nearest-driver offers.
export function useOpenRideRequests(enabled: boolean) {
  const [rides, setRides] = useState<Ride[]>([]);

  useEffect(() => {
    if (!enabled) {
      setRides([]);
      return;
    }

    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;

    let active = true;

    supabase
      .from("rides")
      .select("*")
      .eq("status", "requested")
      .order("requested_at", { ascending: true })
      .then(({ data }: { data: Ride[] | null }) => {
        if (active) setRides(data ?? []);
      });

    const channel = supabase
      .channel("open-ride-requests")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "rides" },
        (payload: RealtimePostgresChangesPayload<Ride>) => {
          if (!active) return;
          const row = (payload.new ?? payload.old) as Ride;

          setRides((prev) => {
            if ((payload.new as Ride | null)?.status === "requested" && payload.eventType === "INSERT") {
              return [...prev, payload.new as Ride];
            }
            // Any update/delete removes it from the open list — either it
            // was claimed by someone, cancelled, or no longer relevant.
            return prev.filter((r) => r.id !== row.id);
          });
        }
      )
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, [enabled]);

  return rides;
}
