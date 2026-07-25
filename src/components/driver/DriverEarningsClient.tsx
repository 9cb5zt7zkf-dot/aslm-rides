"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { useProfile } from "@/lib/hooks/useProfile";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { NotConfiguredNotice } from "@/components/shared/NotConfiguredNotice";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { formatAed } from "@/lib/fare";
import type { Ride } from "@/types/ride";

function startOfDay(): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

export function DriverEarningsClient() {
  const { userId } = useProfile();
  const [rides, setRides] = useState<Ride[] | null>(null);

  useEffect(() => {
    if (!userId) return;
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;

    supabase
      .from("rides")
      .select("*")
      .eq("driver_id", userId)
      .eq("status", "completed")
      .order("completed_at", { ascending: false })
      .then(({ data }) => setRides((data as Ride[]) ?? []));
  }, [userId]);

  if (!isSupabaseConfigured()) {
    return <NotConfiguredNotice what="Earnings need a live Supabase project." />;
  }

  if (rides === null) {
    return (
      <div className="flex h-full min-h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-gold" />
      </div>
    );
  }

  const todayRides = rides.filter((r) => (r.completed_at ?? "") >= startOfDay());
  const sum = (list: Ride[]) => list.reduce((acc, r) => acc + (r.final_fare_aed ?? r.estimated_fare_aed ?? 0), 0);

  return (
    <div className="px-5 py-6">
      <h1 className="font-heading text-2xl font-semibold text-ink-fg">Earnings</h1>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-ink-border bg-ink-card p-4">
          <div className="text-[12.5px] text-ink-fg-muted">Today</div>
          <div className="mt-1 font-heading text-xl font-semibold text-gold">{formatAed(sum(todayRides))}</div>
          <div className="text-[12px] text-ink-fg-muted">{todayRides.length} trips</div>
        </div>
        <div className="rounded-2xl border border-ink-border bg-ink-card p-4">
          <div className="text-[12.5px] text-ink-fg-muted">All time</div>
          <div className="mt-1 font-heading text-xl font-semibold text-ink-fg">{formatAed(sum(rides))}</div>
          <div className="text-[12px] text-ink-fg-muted">{rides.length} trips</div>
        </div>
      </div>

      <h2 className="mt-8 font-heading text-[15px] font-medium text-ink-fg">Trip history</h2>
      {rides.length === 0 ? (
        <p className="mt-4 text-center text-[14px] text-ink-fg-muted">No completed trips yet.</p>
      ) : (
        <div className="mt-4 space-y-3">
          {rides.map((ride) => (
            <div key={ride.id} className="rounded-2xl border border-ink-border bg-ink-card p-4">
              <div className="flex items-center justify-between">
                <span className="text-[13px] text-ink-fg-muted">
                  {ride.completed_at
                    ? new Date(ride.completed_at).toLocaleDateString("en-AE", { day: "numeric", month: "short" })
                    : ""}
                </span>
                <span className="font-heading text-[15px] font-semibold text-gold">
                  {formatAed(ride.final_fare_aed ?? ride.estimated_fare_aed ?? 0)}
                </span>
              </div>
              <div className="mt-1.5 text-[13px] text-ink-fg-muted">{ride.dropoff_address}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
