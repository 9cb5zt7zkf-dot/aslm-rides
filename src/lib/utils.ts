export function cx(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}

export function formatMinutes(min: number): string {
  if (min < 1) return "< 1 min";
  return `${Math.round(min)} min`;
}

export function formatKm(km: number): string {
  return `${km.toFixed(1)} km`;
}

export function initials(name: string | null | undefined): string {
  if (!name) return "?";
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0]!.toUpperCase())
    .join("");
}
