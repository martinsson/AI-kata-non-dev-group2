# Feasibility study: weekly curated bus-reachable hikes around Grenoble

**Requested workflow:** Every week, check Komoot for hiking options around Grenoble → keep only trails whose starting point is reachable by bus → never repeat a hike already done → check bus timings on Google Maps → email a curated list of 3–5 options.

**Verdict: feasible overall, but not with the exact tools requested.** The two anchor apps in the workflow — Komoot for discovery and Google Maps for bus times — are precisely the two pieces that cannot be automated. Both have well-supported substitutes, and the rest of the workflow (filtering, no-repeat memory, weekly email) is straightforward.

---

## Step-by-step feasibility

### 1. "Check Komoot for options" — ❌ not automatable, workarounds exist

- Komoot **does not offer a public API**. Its API is partner-only (Garmin, Bosch, Suunto…) and Komoot's own support page confirms there is no general developer access ([Komoot API support article](https://support.komoot.com/hc/en-us/articles/7464746034458-Komoot-API)).
- Automated fetching of komoot.com pages was tested and is blocked (HTTP 403 / bot protection), and scraping would violate their terms of service. Unofficial scrapers exist ([Apify](https://apify.com/creatormagic/komoot-api/api), [parse.bot](https://parse.bot/marketplace/0aec9660-5240-47d5-afa3-06745f962627/komoot-com-api)) but they are paid, fragile, and ToS-grey — not recommended for a weekly personal pipeline.

**Workarounds (pick one):**

| Option | Effort | Reliability |
|---|---|---|
| **A. Curated catalog (recommended):** build once a catalog of ~50–100 bus-reachable hikes around Grenoble (Chartreuse, Vercors, Belledonne, Taillefer) with trailhead, bus line, distance, elevation, difficulty. The weekly job picks 3–5 unhiked entries. | One-time setup | High — fully under our control |
| B. Open route sources instead of Komoot: Visorando, AllTrails, or OpenStreetMap hiking relations (Waymarked Trails) — OSM data is fully open and machine-readable. | Medium | Medium–high |
| C. Keep Komoot manual: the weekly email names the trail; you look it up in the Komoot app yourself for the map/navigation on the day. | None | High |

Options A + C combine well: automated curation, Komoot stays your navigation app.

### 2. "Reachable by bus" filter — ✅ feasible

Grenoble is unusually well served by open transit data:

- **Métromobilité API** (`data.mobilites-m.fr`) — free API covering TAG bus/tram plus regional lines, with routes, stops, and timetable endpoints ([source](https://data.mobilites-m.fr/donnees)).
- **GTFS feeds** for the TAG network on the French national open-transport portal ([transport.data.gouv.fr](https://transport.data.gouv.fr/datasets/horaires-theoriques-du-reseau-tag)), including real-time (GTFS-RT).
- Trailheads outside the metro area (e.g. Col de Porte, Chamrousse, Villard-de-Lans) are served by **cars Région / Transisère** lines, also published as open data.

The bus-reachability of each trailhead is mostly *static* knowledge — it belongs in the catalog (option A), checked once per trail.

### 3. "Check timings on Google Maps" — ❌ as stated / ✅ via open data

- Google Maps has no free automatable interface; the Routes/Directions API requires a billing-enabled Google Cloud key.
- **Substitute:** the GTFS/Métromobilité data above is the *same underlying timetable data Google Maps displays* for Grenoble. The weekly job can query Saturday/Sunday departures for each proposed trail's bus line and put the actual times in the email. Deep links to Google Maps directions can still be included for one-tap checking on your phone.

⚠️ Caveat found during testing: **this particular sandbox's network policy blocks outbound access** to komoot.com, data.mobilites-m.fr and even transport.data.gouv.fr (the proxy refuses the connection). The weekly automation needs an environment with network access to those domains — e.g. a Claude Code environment with a permissive network policy, or a GitHub Actions runner.

### 4. "Never do a trek twice" — ✅ trivially feasible

Keep a `hikes-done.json` (or a "done" column in the catalog) in this repository. Each weekly run excludes done + previously-proposed-and-declined trails, and you confirm which one you actually hiked (or the job marks the proposed ones after you reply).

### 5. "Send me an email each week" — ✅ feasible, one constraint

- The Gmail integration available in this session can **create drafts but not send** — so today I could prepare the email in your Gmail drafts, not deliver it to your inbox.
- For true hands-off delivery: a **GitHub Actions weekly cron** in this repo that sends via SMTP/an email action, or a Gmail connection with send permission.

### 6. Weekly scheduling — ✅ feasible, but not from a chat session

Schedules created inside a Claude session are ephemeral (in-memory, ~7-day cap). The durable option is a **GitHub Actions cron** (e.g. Thursday evening, so you can plan the weekend) that runs the curation script — or triggers a Claude Code session — then emails the result.

---

## Main challenges (summary)

1. **Komoot is a closed platform** — no API, scraping blocked. Discovery must come from a curated catalog or open sources; Komoot remains your on-trail navigation app.
2. **Google Maps isn't automatable for free** — replaced by Grenoble's open GTFS/Métromobilité data (same timetables).
3. **Sandbox network policy** currently blocks the needed transit-data domains — the job must run where those are reachable (GitHub Actions is the natural fit for this repo).
4. **Email sending** needs either Gmail send permission or an SMTP step in the Action (drafts are possible today).
5. **Seasonality & disruptions**: weekend bus frequencies to trailheads are sparse (sometimes 2–3 departures/day) and some mountain lines are seasonal — the job should check the *actual date's* departures, not a generic timetable, and flag last-return times.

## Recommended MVP architecture

```
[trail catalog in repo]          [hikes-done.json]
        \                          /
   GitHub Actions cron (weekly, Thu 18:00)
        |
   pick 3–5 unhiked, bus-reachable trails
        |
   query Métromobilité/GTFS for this weekend's departures + last return
        |
   compose email (trail, distance, D+, difficulty, bus line,
   departure times, last return, Komoot search link, Google Maps link)
        |
   send via SMTP action → jm1974@hotmail.com
```

## Open questions

- Preferred hike length/difficulty range and hiking day (Sat/Sun)?
- Is a non-Komoot discovery source acceptable if each email links back to the trail in Komoot?
- OK with a GitHub Actions + SMTP sender, or do you want it from your own Gmail?
