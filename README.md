# Workout Builder

A personal workout planner and tracker, hosted on the internet with your own
login. Pick a goal and the equipment you have, and it builds a 5-week
training block (four weeks loading up to a peak, then a deload week), lets
you log reps/sets/weight as you train, and auto-suggests your next cycle's
starting weights based on what you actually lifted. Sign in from your phone,
laptop, or any browser - it's always the same data.

**New here? Start with [SETUP.md](./SETUP.md)** - a beginner-friendly,
step-by-step guide to getting your own copy of this app running, with no
assumed experience.

## How it works

- **Frontend**: React + TypeScript + Vite, deployed as a static site (free,
  e.g. on Vercel).
- **Backend**: [Supabase](https://supabase.com) - a free hosted Postgres
  database with built-in login (Auth) and an automatic API, so there's no
  custom server to write or host. The browser talks to it directly via
  `@supabase/supabase-js`, and Postgres "Row Level Security" policies make
  sure you can only ever see and edit your own data.
- No ongoing cost: both Supabase's and Vercel's free tiers are enough for a
  single personal user.

## Getting started (local development)

```bash
npm install
cp .env.example .env.local   # then fill in your Supabase project's values
npm run dev
```

See [SETUP.md](./SETUP.md) for how to create the Supabase project and fill
in those values if you haven't already.

## Scripts

- `npm run dev` - local dev server with hot reload
- `npm run build` - type-checks and builds a production bundle to `dist/`
- `npm run preview` - serves the production build locally
- `npm test` - runs the domain-logic test suite (Vitest)
- `npm run lint` - runs oxlint
- `npm run seed:supabase` - one-time upload of the exercise catalog
  (`public/data/exercises.json`) into your Supabase project (see SETUP.md)
- `npm run seed:exercises` - regenerates `public/data/exercises.json` itself
  from the upstream public-domain
  [free-exercise-db](https://github.com/yuhonas/free-exercise-db) dataset
  (only needed if you want to refresh the source data)

## Deploying

See **Part 5** of [SETUP.md](./SETUP.md) for the full walkthrough (Vercel,
free, connects to GitHub and auto-deploys on every push).

## Your data

Your workout history lives in your own Supabase project's database, and
follows you across every device you sign into. Settings → "Download my
data" gives you a personal point-in-time JSON copy for peace of mind.

## Architecture

- `src/domain/` - pure TypeScript: the 5-week periodization scheme, mesocycle
  generation, progression algorithm, 1RM/PR calculations. No dependency on
  how data is stored, fully unit-testable.
- `src/data/` - the Supabase client, one repository file per entity
  (mirroring `src/domain/types.ts`), and the data-export helper.
- `src/app/` - routing, auth gating (`AuthProvider`/`AuthGate`), and the
  onboarding gate.
- `src/features/` - screens (auth, onboarding, dashboard, catalog, logger,
  analytics, history, program review, settings).
- `src/components/` - shared presentational components.
- `supabase/schema.sql` - the full database schema (tables + security
  policies), pasted once into the Supabase SQL Editor during setup.

See `npm test` for the domain-layer test coverage of the periodization and
progression logic - none of it depends on the persistence layer, so it's
unaffected by how/where data is stored.

## Known limitations (v1)

- Weights are tracked in kg only.
- Exercise instructions are text-only (no images/video).
- No offline support - an internet connection is needed to log workouts,
  by design (see project history if curious - this was a deliberate
  trade-off in favor of multi-device sync).
- No password-reset flow in the app itself (see SETUP.md's Troubleshooting
  section for the manual fix, since this is a single-user personal app).
