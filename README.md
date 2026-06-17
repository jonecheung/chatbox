# Japan Station Lift Finder 🛗

A simple website that helps travelers find which **JR and metro stations in Japan have elevators (lifts) and step-free access** — so you can confidently pick a hotel near a station you can actually get in and out of with luggage, a stroller, or a wheelchair.

> **Why this exists:** When booking a hotel in Japan it's hard to know whether the nearest station is step-free. Stairs-only stations are a real problem with suitcases or reduced mobility. This tool puts that information on a map and in search results.

## Features

- 🔎 **Search** stations by English or Japanese name, city, line, or operator.
- 🗺️ **Interactive map** (OpenStreetMap / Leaflet) with a marker per station, colored by accessibility status.
- ✅⚠️⛔ **Step-free status** at a glance: fully step-free, partly step-free, or no step-free route.
- 🛗 **Elevator details** per station: which levels each lift connects, plus accessible exits.
- 🏨 **"Find accessible hotels nearby"** and **"Open in Google Maps"** shortcuts for each station.
- 📱 **Mobile-friendly** layout for use while traveling.

## Run it locally

It's a static site — no build step. Because it loads `data/stations.json` with `fetch`, open it through a local web server (not via `file://`):

```bash
# Python (already available on most machines)
python3 -m http.server 8000
# then open http://localhost:8000
```

```bash
# or Node
npx serve .
```

## Project structure

```
index.html          # Page markup
css/styles.css      # Styling (responsive, accessible)
js/app.js           # App logic: data load, search/filter, map, detail panel
data/stations.json  # Curated station accessibility dataset
```

## Data

`data/stations.json` is a **community seed dataset** covering major hubs (Tokyo, Yokohama, Osaka, Kyoto, Nagoya, Sapporo, Fukuoka). Each station entry looks like:

```json
{
  "id": "shinjuku",
  "name": "Shinjuku",
  "nameJa": "新宿",
  "city": "Tokyo",
  "lat": 35.690921,
  "lng": 139.700258,
  "operators": ["JR East", "Tokyo Metro"],
  "lines": ["Yamanote", "Chuo"],
  "stepFree": "yes",                 // "yes" | "partial" | "no"
  "elevators": [
    { "from": "Street", "to": "Concourse", "notes": "..." }
  ],
  "accessibleExits": ["New South Gate"],
  "officialUrl": "https://..."
}
```

### Add or correct a station

1. Add an object to the `stations` array in `data/stations.json`.
2. Use a unique `id`, accurate `lat`/`lng`, and set `stepFree` honestly.
3. Open a pull request.

### ⚠️ Disclaimer

Elevator availability can change due to maintenance or construction. **Always verify with the official operator before you travel**, especially if you rely on step-free access. Use the "Official station info" link on each station for the authoritative source.

### Authoritative data sources to expand this

- JR East station information — https://www.jreast.co.jp/e/stations/
- Tokyo Metro barrier-free station info — https://www.tokyometro.jp/en/station/
- Toei Transportation — https://www.kotsu.metro.tokyo.jp/eng/
- Public Transportation Open Data Center (ODPT) — https://www.odpt.org/en/ (free API token; has machine-readable barrier-free facility data)

## License / attribution

Map tiles &copy; OpenStreetMap contributors. Station data is curated for convenience and should be verified against official sources.
