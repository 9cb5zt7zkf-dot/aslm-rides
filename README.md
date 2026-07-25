# ASLM Rides

A ride-hailing rider app + driver app for ASLM, Dubai's premium chauffeur
network — built as one Next.js project with two role-based portals
(`/rider/*` and `/driver/*`), installable on a phone as a PWA (add to home
screen, full-screen, works like a native app). Real-time ride matching,
live driver location, and address search/fare estimation are all backed
by a live Supabase project and Mapbox — **this app does nothing until
those two are configured** (see Setup below).

## Why a PWA, not a native App Store app

Compiling and publishing actual iOS/Android binaries requires Apple/Google
developer accounts, code signing, and app store review — none of which
this environment can do. A PWA gets you a fully real, installable,
offline-capable app experience today; the backend built here (Supabase
schema + real-time logic) is what a future native app (React Native,
Flutter, Swift/Kotlin) would reuse if you want to go that route later.

## Stack

- **Next.js 14** (App Router), **TypeScript** strict mode, **Tailwind CSS**
  — palette and fonts (Playfair Display + Inter, near-black + gold) match
  the main ASLM marketing site
- **Supabase** — Postgres database, email OTP authentication, and Realtime
  (`postgres_changes` subscriptions) for live ride status + driver location
- **Mapbox** — address autocomplete (Geocoding API), live map display,
  route line + distance/duration (Directions API)
- **Framer Motion** available but used sparingly (this is an app, not a
  marketing site — motion is secondary to responsiveness)

## Project structure

```
supabase/schema.sql        Run this once in the Supabase SQL Editor
src/
  app/
    page.tsx                Landing splash — "I need a ride" / "I'm a driver"
    rider/
      login/                Rider sign-in (email OTP)
      (app)/                Guarded rider portal (redirects to login if signed out)
        home/                Request-ride screen: address search, vehicle class, fare estimate
        ride/[id]/           Live tracking: map, driver info, status, cancel, rating
        history/             Past rides
        profile/             Profile + sign out
    driver/
      login/                Driver sign-in (email OTP)
      (app)/
        home/                Online/offline toggle + live incoming request feed
        ride/[id]/           Active ride flow: arrived / start / complete
        earnings/            Today + all-time earnings, trip history
        profile/             Profile, vehicle registration, sign out
  components/rider/, driver/, shared/, ui/
  lib/
    supabase/                client.ts (browser), server.ts (SSR), admin.ts (service role, unused by
                              default — see "Why no service-role API routes" below), auth.ts, config.ts
    rides.ts                 Every ride-lifecycle action (create, claim, status update, cancel, rate)
    mapbox.ts                Address search + route/distance
    fare.ts                  Vehicle-class rate table + fare calculation
    hooks/                   useProfile, useRide, useDriverLocation, useOpenRideRequests, useCounterpart
  types/ride.ts               Shared TypeScript types
```

## Setup (required before this app does anything)

### 1. Supabase

1. Create a free project at [supabase.com](https://supabase.com).
2. Open the SQL Editor and run the entire contents of `supabase/schema.sql`
   once. It creates all tables, row-level security policies, and a
   trigger that creates a `profiles` row automatically on sign-up.
3. In Authentication settings, make sure "Email OTP" / email sign-in is
   enabled (it is by default). No SMS/phone provider is needed.
4. Copy your Project URL, anon public key, and service role key from
   Project Settings → API.

### 2. Mapbox

1. Create a free account at [mapbox.com](https://mapbox.com) — no credit
   card required for the free tier.
2. Copy your default public token from your account's Tokens page.

### 3. Environment variables

Copy `.env.example` to `.env.local` for local development, or add the same
four variables under Vercel → Project Settings → Environment Variables:

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_MAPBOX_TOKEN=
```

Every screen that needs the backend checks whether these are set and
shows a clear "Backend not configured" message instead of crashing or
displaying fake data — so it's safe to deploy before they're filled in.

## How ride matching works (and its honest tradeoffs)

When a rider requests a ride, it's inserted as `status = 'requested'`.
**Every online driver's app subscribes to open requests in real time and
sees the same list; the first driver to tap Accept wins** — enforced
atomically at the database level (`claimRide` in `lib/rides.ts` runs a
conditional `UPDATE ... WHERE status = 'requested' AND driver_id IS NULL`,
so a double-accept race resolves to exactly one winner, and the loser is
told honestly that the ride was already taken).

This is a real, working dispatch strategy — some ride platforms use
exactly this "broadcast to nearby drivers" model — but it's simpler than
Uber/Careem's actual approach (sequential nearest-driver offers with a
per-driver timeout before moving to the next). If you want that instead,
it needs a server-side dispatcher (e.g. a Supabase Edge Function or a
cron-triggered process) that offers the ride to one driver at a time —
a natural next step once the current MVP is validated.

**No service-role API routes are used for the core flow.** Every action
(create ride, claim ride, update status, go online, update location, rate)
runs directly from the rider/driver's own browser session, protected by
the row-level security policies in `supabase/schema.sql`. `lib/supabase/admin.ts`
exists for future server-side needs (e.g. an ops dashboard querying across
all accounts) but isn't wired into any current screen.

## Known limitations (stated honestly, not hidden)

- **Fare rates are placeholders.** `src/lib/fare.ts` has starter
  base/per-km/per-min rates per vehicle class — for ASLM's ops team to
  review and adjust, not published pricing.
- **Final fare = estimated fare.** The driver's "Complete trip" action
  currently carries over the pre-trip estimate rather than metering actual
  distance/time driven. A real system would recompute from the driver's
  logged location trail during the trip.
- **No payments.** Rides complete with a fare shown but no charge is
  processed — no payment gateway is wired in.
- **Dispatch is broadcast, not sequential.** See above.
- **No push notifications.** A driver only sees a new request while the
  app is open; native push (via a service worker) is a natural addition.
- **No admin/ops dashboard.** Vehicle approval, driver verification, and
  dispute handling would need a separate internal tool.
- **Not locally build-verified.** This project was hand-authored in an
  environment with no npm registry access, so `npm install`, `next build`,
  and `next lint` couldn't run here. Every file was hand-reviewed (JSX
  entity escaping, import resolution, `"use client"` boundaries, the
  Supabase `@supabase/ssr` cookie API), and a best-effort syntax-only
  TypeScript pass found no parser-level errors — but a real `next build`
  on Vercel (which has full registry access) is the actual verification
  step. If a build error shows up there, send the log the same way we've
  fixed build errors on the other ASLM/Epic Trading/Stride Properties
  projects.

## Local development

```bash
npm install
npm run dev       # http://localhost:3000
npm run lint
npm run typecheck
npm run build && npm run start
```

## Deployment

Push to GitHub and import into Vercel — standard Next.js project, no
special build configuration. Add the four environment variables above
under Vercel → Project Settings → Environment Variables, then redeploy.
