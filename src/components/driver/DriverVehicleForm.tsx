"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Car } from "lucide-react";
import { useProfile } from "@/lib/hooks/useProfile";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { VEHICLE_CLASSES } from "@/lib/fare";
import type { Vehicle, VehicleClass } from "@/types/ride";

const EMPTY = { make: "", model: "", year: "", plate_number: "", class: "comfort" as VehicleClass, color: "" };

export function DriverVehicleForm() {
  const { userId } = useProfile();
  const [existing, setExisting] = useState<Vehicle | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!userId) return;
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;

    supabase
      .from("vehicles")
      .select("*")
      .eq("driver_id", userId)
      .eq("is_active", true)
      .maybeSingle()
      .then(({ data }: { data: Vehicle | null }) => {
        const vehicle = data;
        if (vehicle) {
          setExisting(vehicle);
          setForm({
            make: vehicle.make,
            model: vehicle.model,
            year: vehicle.year ? String(vehicle.year) : "",
            plate_number: vehicle.plate_number,
            class: vehicle.class,
            color: vehicle.color ?? "",
          });
        }
      });
  }, [userId]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!userId) return;
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;

    setSaving(true);
    setSaved(false);

    const payload = {
      driver_id: userId,
      make: form.make,
      model: form.model,
      year: form.year ? Number(form.year) : null,
      plate_number: form.plate_number,
      class: form.class,
      color: form.color || null,
      is_active: true,
    };

    if (existing) {
      await supabase.from("vehicles").update(payload).eq("id", existing.id);
    } else {
      const { data } = await supabase.from("vehicles").insert(payload).select().single();
      if (data) setExisting(data as Vehicle);
    }

    setSaving(false);
    setSaved(true);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-ink-border bg-ink-card p-4">
      <div className="flex items-center gap-2 font-heading text-[15px] font-medium text-ink-fg">
        <Car className="h-4 w-4 text-gold" />
        Vehicle
      </div>

      <div className="grid grid-cols-2 gap-3">
        <input
          required
          placeholder="Make"
          value={form.make}
          onChange={(e) => setForm({ ...form, make: e.target.value })}
          className="rounded-xl border border-ink-border bg-ink-muted px-3.5 py-2.5 text-[14px] text-ink-fg outline-none focus:border-gold"
        />
        <input
          required
          placeholder="Model"
          value={form.model}
          onChange={(e) => setForm({ ...form, model: e.target.value })}
          className="rounded-xl border border-ink-border bg-ink-muted px-3.5 py-2.5 text-[14px] text-ink-fg outline-none focus:border-gold"
        />
        <input
          placeholder="Year"
          inputMode="numeric"
          value={form.year}
          onChange={(e) => setForm({ ...form, year: e.target.value })}
          className="rounded-xl border border-ink-border bg-ink-muted px-3.5 py-2.5 text-[14px] text-ink-fg outline-none focus:border-gold"
        />
        <input
          placeholder="Color"
          value={form.color}
          onChange={(e) => setForm({ ...form, color: e.target.value })}
          className="rounded-xl border border-ink-border bg-ink-muted px-3.5 py-2.5 text-[14px] text-ink-fg outline-none focus:border-gold"
        />
        <input
          required
          placeholder="Plate number"
          value={form.plate_number}
          onChange={(e) => setForm({ ...form, plate_number: e.target.value })}
          className="col-span-2 rounded-xl border border-ink-border bg-ink-muted px-3.5 py-2.5 text-[14px] text-ink-fg outline-none focus:border-gold"
        />
        <select
          value={form.class}
          onChange={(e) => setForm({ ...form, class: e.target.value as VehicleClass })}
          className="col-span-2 rounded-xl border border-ink-border bg-ink-muted px-3.5 py-2.5 text-[14px] text-ink-fg outline-none focus:border-gold"
        >
          {(Object.keys(VEHICLE_CLASSES) as VehicleClass[]).map((key) => (
            <option key={key} value={key}>
              {VEHICLE_CLASSES[key].label}
            </option>
          ))}
        </select>
      </div>

      <Button type="submit" variant="secondary" loading={saving}>
        {existing ? "Update vehicle" : "Register vehicle"}
      </Button>
      {saved ? <p className="text-center text-[12.5px] text-success">Saved.</p> : null}
    </form>
  );
}
