# QuickFPL

A blunt, no-fluff Fantasy Premier League price tracker. Every player's price,
ownership, and price movement in one sortable, filterable table — plus a
risers/fallers section so you know who's actually worth transferring in
before the price ticks up again.

Data comes straight from the official FPL API — `bootstrap-static` for
players/teams and `fixtures` for upcoming fixture difficulty. No account, no
API key needed — both are public endpoints. Player photos come from the
official FPL image CDN (`resources.premierleague.com`); if a photo 404s the
UI falls back to a plain initials avatar.

## Features

- **Top 15** — the 15 most-owned players, sortable, each with a price
  sparkline built from our own snapshot history.
- **Find a player** — autocomplete search across every player, for anyone
  not in the top 15.
- **Risers & Fallers** — players whose price moved in the last gameweek,
  with a one-line blunt verdict on whether it matters.
- **My team** — a classic FPL-style squad builder (2 GKP / 5 DEF / 5 MID /
  3 FWD). Pitch view or list view, player photos, prices, and each player's
  next 3 fixtures colour-coded by difficulty. Saved to the browser's
  localStorage — no account needed, but it won't follow you to another
  device.
- **Own price history** — a scheduled GitHub Actions job snapshots prices
  periodically and commits them to `data/history.json`, so the site can
  report price moves it has actually witnessed (and power the sparklines),
  not just what the FPL API itself reports.

## Tech stack

- [Next.js 16](https://nextjs.org) (App Router, TypeScript)
- [Tailwind CSS 4](https://tailwindcss.com)
- No database — the live table reads straight from the FPL API on each
  request (cached for 5 minutes via Next's fetch cache); historical
  snapshots are plain JSON files committed to the repo by a scheduled job.

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Refreshing price history locally

```bash
npm run refresh
```

This fetches the current FPL data, writes `data/latest.json`, and appends a
snapshot to `data/history.json`. In production this runs automatically —
see below.

## How the scheduled job works

`.github/workflows/refresh-data.yml` runs `npm run refresh` every 3 hours
via GitHub Actions. If any player's price has changed since the last
snapshot, it commits the updated `data/` files back to the repository. Since
Vercel auto-deploys on every push, this also keeps the live site's build-time
data fresh.

You can also trigger it manually from the **Actions** tab (`workflow_dispatch`)
if you want a snapshot right now.

Snapshot history is capped at 240 entries (roughly a month at the default
3-hour cadence) so `data/history.json` doesn't grow without bound.

## Deploying to Vercel

1. Push this repo to GitHub (already set up if you're reading this from the repo).
2. Go to [vercel.com/new](https://vercel.com/new) and import the repository.
   Next.js is auto-detected — no config needed.
3. Deploy. Vercel will rebuild automatically on every push to the production
   branch, including the commits made by the scheduled refresh job.
4. (Optional) In the GitHub repo settings, confirm Actions has permission to
   push to the branch Vercel deploys from — `refresh-data.yml` already
   requests `contents: write` permission, which is enabled by default for
   most repos.

No environment variables are required. `FPL_BOOTSTRAP_URL` and
`FPL_FIXTURES_URL` can be set to override the FPL API URLs (useful for
testing against a mock endpoint).

## Project structure

```
app/
  page.tsx                       Home page — fetches live data, renders everything
  api/players/route.ts           JSON API exposing the same player data
  api/player-history/[id]/route.ts  One player's price history (for sparklines)
lib/
  fpl-types.ts           Shared types for the FPL API + our normalized data
  normalize.ts           Raw FPL payload -> normalized Player[]
  live.ts                Live fetch from the FPL API (players + fixtures, 5 min cache)
  fixtures.ts             Builds each team's next-3-fixtures difficulty run
  history.ts             Reads our own committed price-snapshot history
  copy.ts                Blunt one-liners for the risers/fallers cards
components/
  TopPlayers.tsx          Top 15 sortable table with sparklines
  RisersFallers.tsx       Recent price movers
  PlayerLookup.tsx        Search-any-player section
  SquadBuilder.tsx         My team: pitch view / list view squad builder
  PlayerAutocomplete.tsx  Shared search input used by the above
  PlayerDetailCard.tsx    Shared player summary card (photo, price, sparkline)
  PlayerPhoto.tsx         Player photo with initials fallback
  FixtureChips.tsx         Small difficulty-coloured fixture chips
  Sparkline.tsx           Inline SVG price sparkline
scripts/
  fetch-snapshot.ts      Snapshot job run by the scheduled workflow
data/
  history.json           Committed price history (bounded, pruned)
.github/workflows/
  refresh-data.yml        Scheduled price snapshot job
  ci.yml                  Lint + build on push/PR
```

Not affiliated with the Premier League or Fantasy Premier League.
