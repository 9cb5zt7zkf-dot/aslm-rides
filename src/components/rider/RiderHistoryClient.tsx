"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, MapPin } from "lucide-react";
import { useProfile } from "@/lib/hooks/useProfile";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { NotConfiguredNotice } from "@/components/shared/NotConfiguredNotice";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { formatAed } from "@/lib/fare";
import type { Ride } from "@/types/ride";

export function RiderHistoryClient() {
  const { userId } = useProfile();
  const [rides, setRides] = useState<Ride[] | null>(null);

  useEffect(() => {
    if (!userId) return;
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;

    supabase
      .from("rides")
      .select("*")
      .eq("rider_id", userId)
      .in("status", ["completed", "cancelled"])
      .order("requested_at", { ascending: false })
      .then(({ data }: { data: Ride[] | null }) => setRides(data ?? []));
  }, [userId]);

  if (!isSupabaseConfigured()) {
    return <NotConfiguredNotice what="Ride history needs a live Supabase project." />;
  }

  return (
    <div className="px-5 py-6">
      <h1 className="font-heading text-2xl font-semibold text-ink-fg">Ride history</h1>

      {rides === null ? (
        <div className="mt-10 flex justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-gold" />
        </div>
      ) : rides.length === 0 ? (
        <p className="mt-8 text-center text-[14px] text-ink-fg-muted">No past rides yet.</p>
      ) : (
        <div className="mt-6 space-y-3">
          {rides.map((ride) => (
            <Link
              key={ride.id}
              href={`/rider/ride/${ride.id}`}
              className="block rounded-2xl border border-ink-border bg-ink-card p-4"
            >
              <div className="flex items-center justify-between">
                <span className="text-[13px] text-ink-fg-muted">
                  {new Date(ride.requested_at).toLocaleDateString("en-AE", { day: "numeric", month: "short", year: "numeric" })}
                </span>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium uppercase tracking-wide ${
                    ride.status === "completed" ? "bg-success/15 text-success" : "bg-danger/15 text-danger"
                  }`}
                >
                  {ride.status}
                </span>
              </div>
              <div className="mt-2.5 flex items-start gap-2 text-[13.5px] text-ink-fg">
                <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ink-fg-muted" />
                {ride.dropoff_address}
              </div>
              <div className="mt-2 font-heading text-[15px] font-medium text-gold">
                {formatAed(ride.final_fare_aed ?? ride.estimated_fare_aed ?? 0)}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
