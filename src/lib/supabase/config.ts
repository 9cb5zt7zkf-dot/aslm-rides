// Central place to check whether the backend is configured. Every page
// that depends on Supabase or Mapbox reads this instead of assuming the
// env vars are set, so a deploy without keys shows a clear message rather
// than crashing or silently displaying fake data.

export function isSupabaseConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

export function isMapboxConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_MAPBOX_TOKEN);
}

export function getMapboxToken(): string {
  return process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? "";
}
