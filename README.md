# Grenoble Weekly Trails

A free, static, no-backend site that picks 3–5 bus-reachable hikes around
Grenoble every week — and never proposes the same trek twice.

- `site/` — the app: vanilla HTML/CSS/JS, no build step.
  - `site/data/trails.json` — the trail catalog (seed data, being verified).
  - Weekly picks are deterministic (seeded by ISO week number).
  - Done-hikes live in the browser's localStorage (export/import buttons on the page).
- `docs/feasibility-weekly-grenoble-trails.md` — feasibility study, stack decision,
  and the plan for building/verifying the catalog.

## Deploy

Edit files in `site/`, push to `main`, GitHub Actions deploys to Pages.

One-time per fork/clone: **Settings → Pages → Source: GitHub Actions**.

## Run locally

```
cd site && python3 -m http.server
```

then open http://localhost:8000 (opening `index.html` directly won't load the JSON).
