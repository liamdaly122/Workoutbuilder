# Workout Builder

A personal, offline-first workout planner and tracker. Pick a goal and the
equipment you have, and it builds a 5-week training block (four weeks loading
up to a peak, then a deload week), lets you log reps/sets/weight as you train,
and auto-suggests your next cycle's starting weights based on what you
actually lifted.

Everything runs entirely in your browser - there is no backend, no account,
and no ongoing cost. All data is stored locally via IndexedDB (through
[Dexie.js](https://dexie.org)), and the app is an installable PWA so it works
fully offline at the gym.

## Getting started

```bash
npm install
npm run dev
```

Open the printed local URL, walk through onboarding (goal -> equipment ->
review your plan), and start training.

## Scripts

- `npm run dev` - local dev server with hot reload
- `npm run build` - type-checks and builds a production bundle to `dist/`
- `npm run preview` - serves the production build locally (this is how the
  PWA/offline behavior actually activates - the dev server does not register
  the service worker)
- `npm test` - runs the domain-logic and data-layer test suite (Vitest)
- `npm run lint` - runs oxlint
- `npm run seed:exercises` - regenerates `public/data/exercises.json` from the
  public-domain [free-exercise-db](https://github.com/yuhonas/free-exercise-db)
  dataset (only needed if you want to refresh/re-derive the bundled catalog)

## Deploying for free

Since this is a static site with no backend, any static host works and stays
free indefinitely:

- **Cloudflare Pages** or **Vercel**: connect the repo, build command
  `npm run build`, output directory `dist`.
- **GitHub Pages**: same build, then set `base` in `vite.config.ts` to your
  repo name (e.g. `/workoutbuilder/`) since GitHub Pages serves from a
  subpath.

You can also just run `npm run build && npm run preview` locally, or open
`dist/index.html`, if you don't want to host it anywhere - install it to your
phone's home screen from that URL as a PWA.

## Data & backups

Your training history lives only in this browser/device's local storage -
there is no cloud copy. Go to **Settings -> Backup** to export a full JSON
backup, and to restore from one. Do this periodically, and especially before
clearing browser data or switching devices/browsers.

## Architecture

- `src/domain/` - pure TypeScript: the 5-week periodization scheme, mesocycle
  generation, progression algorithm, 1RM/PR calculations. No React or Dexie
  imports, fully unit-testable.
- `src/data/` - Dexie schema, repositories, exercise-seed ingestion, and
  export/import.
- `src/features/` - screens (onboarding, dashboard, catalog, logger,
  analytics, history, program review, settings).
- `src/components/` - shared presentational components.

See `npm test` for the domain-layer test coverage of the periodization and
progression logic.

## Known limitations (v1)

- Single device only by design (see "Data & backups" above) - no multi-device
  sync.
- Weights are tracked in kg only.
- Exercise instructions are text-only (no images/video), to keep the app
  small enough to fully precache for offline use.
