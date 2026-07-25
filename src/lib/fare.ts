import type { VehicleClass } from "@/types/ride";

// Starter fare configuration — these rates are placeholders for ASLM's
// business/ops team to review and adjust, not published pricing. Update
// freely; every screen reads from this single table.
export type FareRate = {
  label: string;
  description: string;
  baseFareAed: number;
  perKmAed: number;
  perMinAed: number;
  minFareAed: number;
};

export const VEHICLE_CLASSES: Record<VehicleClass, FareRate> = {
  economy: {
    label: "Economy",
    description: "Everyday sedans for quick, affordable trips.",
    baseFareAed: 8,
    perKmAed: 2.2,
    perMinAed: 0.35,
    minFareAed: 15,
  },
  comfort: {
    label: "Comfort",
    description: "Newer sedans with extra legroom.",
    baseFareAed: 12,
    perKmAed: 2.8,
    perMinAed: 0.45,
    minFareAed: 20,
  },
  suv: {
    label: "SUV",
    description: "Spacious SUVs for groups and luggage.",
    baseFareAed: 18,
    perKmAed: 3.6,
    perMinAed: 0.55,
    minFareAed: 30,
  },
  vip: {
    label: "VIP",
    description: "ASLM's luxury fleet with a professional chauffeur.",
    baseFareAed: 40,
    perKmAed: 5.5,
    perMinAed: 0.8,
    minFareAed: 75,
  },
};

export function estimateFare(
  vehicleClass: VehicleClass,
  distanceKm: number,
  durationMin: number
): number {
  const rate = VEHICLE_CLASSES[vehicleClass];
  const raw = rate.baseFareAed + rate.perKmAed * distanceKm + rate.perMinAed * durationMin;
  return Math.max(rate.minFareAed, Math.round(raw));
}

export function formatAed(amount: number): string {
  return `AED ${amount.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
}
