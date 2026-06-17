# Where's the Lift? — Project Plan

> A living document capturing the goal, scope, and decisions for the project.
> Last updated: 2026-06-17

## 1. Problem / Motivation

When booking a hotel in Japan, it's hard to know whether the nearest JR/metro
station is **step-free**. Stairs-only stations are a real problem for travelers
with luggage, strollers, or reduced mobility.

**Goal:** Let people quickly check whether a station has an **exit with a lift
that connects all the way to the platform**, so they can confidently pick a
hotel near a station they can actually get in and out of.

## 2. Target Users

- Travelers choosing a hotel (desktop, planning ahead).
- Travelers navigating on their phone (mobile).
- → The site must be a **single responsive website** that works well on both
  desktop and mobile.

## 3. Scope (v1)

### In scope
- **Core question per station:** Is there an **exit that has a lift**, and does
  that lift route connect to the **designated platform** (street → concourse →
  platform, fully step-free)?
- Show the **step-free status**: yes / partial / no.
- Show **which exit(s) have a lift** and **which platforms / lines** they reach
  step-free.
- Show a **"last verified" date** + a link to the **official source**.
- **Navigation via Google Maps**: a "Navigate to station" link and a
  "Find accessible hotels nearby" link (we do not build our own routing).
- A **"report a problem"** link so users can flag outdated info.
- **Map** view (Leaflet + OpenStreetMap, no API key) + searchable list.

### Explicitly OUT of scope (decided)
- **Which car / boarding position** ("board car X to be nearest the lift").
  Not needed.
- **Bus stations** — the user can get to the platform themselves.
- **Transfer routing** (multi-line journeys) — not in v1.
- Building our own walking directions — Google Maps handles that.

## 4. Geographic Coverage (v1)

- Start with **Tokyo**, focusing on the train lines tourists use most and where
  data is most complete (e.g. Yamanote, Marunouchi, Ginza).
- Expand to more lines / cities later.

## 5. Data Strategy

- **Station-level step-free info** (does it have a lift): backbone from
  **ODPT (Public Transportation Open Data Center)** + **OpenStreetMap** to fill
  gaps.
- **Finer details** (which exit has a lift → which platform): **hand-curated**
  for the first few major lines for accuracy.
- Every station shows a **"last verified" date** and an **official link**.
- Add a **user "report a problem"** path; moderate corrections over time.

### Proposed data model (per station)

```json
{
  "id": "shinjuku",
  "name": "Shinjuku",
  "nameJa": "新宿",
  "city": "Tokyo",
  "lat": 35.690921,
  "lng": 139.700258,
  "operators": ["JR East", "Tokyo Metro"],
  "lines": ["Yamanote", "Marunouchi"],
  "stepFree": "yes",                 // yes | partial | no  (street → platform)
  "entrances": [
    {
      "exit": "New South Gate",      // which exit
      "hasLift": true,               // does this exit have a lift
      "toPlatforms": ["Yamanote", "Marunouchi"],  // platforms reachable step-free
      "notes": "Lift to concourse, then lift down to platform."
    }
  ],
  "lastVerified": "2026-06-17",
  "officialUrl": "https://..."
}
```

## 6. Display per Station

- Overall step-free status (yes / partial / no).
- **Which exit has a lift → which line/platform it reaches.**
- Map marker + station location.
- Buttons: **Navigate to station (Google Maps)**, **Find accessible hotels
  nearby (Google Maps)**, **Official station info**, **Report a problem**.
- **"Last verified" date** + a reminder to confirm before traveling.

## 7. Technical Approach

- Static front-end (HTML/CSS/JS), no build step for v1.
- Map: **Leaflet + OpenStreetMap** (free, no API key).
- Data in `data/stations.json` (curated seed; later backed by ODPT/OSM).
- Add a small backend only later, if needed for crowdsourcing or caching ODPT.

## 8. Build Steps (v1)

1. Update the data model to use `entrances` (exit → lift → reachable platforms);
   populate Tokyo's main lines.
2. Update the UI to clearly show "which exit has a lift → which platform" + the
   Google Maps navigation links.
3. Add "last verified" date + "report a problem" link.
4. Test on desktop + mobile; commit, push, update PR.

## 9. Important Principle

Accessibility info that is **wrong can harm the people who rely on it most**.
So: be conservative, show sources, show the "last verified" date, and always
remind users to confirm with the official operator before traveling.

## 10. Open / Future Ideas

- Pull live barrier-free data from the ODPT API to scale coverage.
- Crowdsourced corrections with moderation.
- More cities (Osaka, Kyoto, etc.) and more lines.
- Filter hotels directly (integration with a hotel/booking source).
