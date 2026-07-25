"use client";

import { useEffect, useState } from "react";
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { DriverStatus } from "@/types/ride";

// Live position of a specific driver — used by the rider's tracking
// screen once a driver is assigned to their ride. RLS only allows this
// read while the driver is on the rider's active ride (see schema.sql).
export function useDriverLocation(driverId: string | null) {
  const [status, setStatus] = useState<DriverStatus | null>(null);

  useEffect(() => {
    if (!driverId) {
      setStatus(null);
      return;
    }

    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;

    let active = true;

    supabase
      .from("driver_status")
      .select("*")
      .eq("driver_id", driverId)
      .maybeSingle()
      .then(({ data }: { data: DriverStatus | null }) => {
        if (active) setStatus(data ?? null);
      });

    const channel = supabase
      .channel(`driver-status-${driverId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "driver_status", filter: `driver_id=eq.${driverId}` },
        (payload: RealtimePostgresChangesPayload<DriverStatus>) => {
          if (active) setStatus(payload.new as DriverStatus);
        }
      )
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, [driverId]);

  return status;
}
