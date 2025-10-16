# US Data Centers — Interactive Map (HTML/CSS/JS)

A lightweight, dependency‑minimal web map using [Leaflet](https://leafletjs.com) and marker clustering. Works as a static site—perfect for GitHub Pages.

## 🧭 Quick start

1. **Download** this folder as a zip (or clone from GitHub once you push it).
2. Put your data into `data/datacenters.geojson` (see schema below).
3. Serve locally or publish with GitHub Pages.

> Browsers block `fetch()` for local `file://` paths. Use a local server such as:
>
> ```bash
> # Python 3
> python -m http.server 8000
> # then visit http://localhost:8000
> ```

## 🔁 Data schema

Each feature is a Point with these `properties` (edit the `FIELDS` map in `js/app.js` if your keys differ):

| Property       | Type     | Example               | Notes                                  |
|----------------|----------|-----------------------|----------------------------------------|
| `name`         | string   | "Metro Core East"   | Display name                            |
| `operator`     | string   | "Acme Cloud"        | Company / operator                      |
| `status`       | string   | "Existing"          | One of: `Existing`, `Permitted`, `Under Construction` |
| `capacity_mw`  | number   | 320                   | Used by the min‑MW filter               |
| `water_stress` | string   | "High"              | '', `Low`, `Medium`, `High`, `Extremely High` |
| `city`         | string   | "Ashburn"           | Optional but helpful                    |
| `state`        | string   | "VA"                | Optional                                |
| `url`          | string   | "https://…"         | Optional link in popup                  |

## 🧩 Customization

- **Field names:** Adjust the `FIELDS` map in `js/app.js`.
- **Status colors:** Edit CSS variables `--existing`, `--permitted`, `--construction` in `css/styles.css`.
- **Initial view:** Change `setView([lat, lng], zoom)` in `js/app.js`.
- **Tile provider:** Default is OpenStreetMap. For heavy traffic, switch to a commercial provider or self‑hosted tiles and update the `L.tileLayer` URL.

## 🚀 Deploy to GitHub Pages

1. Create a new GitHub repo (e.g., `interactive-map`).
2. Add/commit/push these files.
3. In **Settings → Pages**, set:
   - **Source**: `Deploy from a branch`
   - **Branch**: `main` (or `master`), folder `/root`
4. Click **Save**. Your site will publish at:
   ```
   https://<your-user>.github.io/<repo>/
   ```

## 📦 Converting CSV to GeoJSON (optional)

If your data starts as CSV with `lat` and `lng` columns, you can convert it with an online tool like geojson.io or script your own. Each row should become a `Point` with `coordinates: [lng, lat]`.

## ⚖️ Attribution & usage

- Basemap © OpenStreetMap contributors.
- Respect tile‑server usage policies. For production or high‑traffic sites, use a provider with an API key or host your own tiles.

## 🛠 Tech stack

- Leaflet 1.9.x
- Leaflet.markercluster 1.5.x
- Vanilla HTML/CSS/JS
