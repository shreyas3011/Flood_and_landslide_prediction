# Project Prompt — Real-Time Satellite Image Viewer

## Project Name
Real-Time Location Satellite Image Viewer using Sentinel Hub

---

## Project Overview

Build a **Streamlit web application** where a user types any location name and the app automatically fetches and displays **3 real-time satellite images** of that location using the **Sentinel Hub API** (Sentinel-2 satellite data from the European Space Agency).

There is **no machine learning model** involved. This is purely a satellite image fetching and display application.

---

## How It Works (Full Flow)

```
User types location name
        ↓
Geocode to latitude & longitude  (Nominatim / OpenStreetMap — free)
        ↓
Find nearest river to that location  (Overpass API — free)
        ↓
Fetch 3 satellite images from Sentinel Hub API
        ↓
Display all 3 images side by side on screen
```

---

## Tech Stack

| Component | Technology |
|---|---|
| Frontend + Backend | Python — Streamlit |
| Satellite images | Sentinel Hub API (Sentinel-2 L2A) |
| Geocoding (name → coordinates) | OpenStreetMap Nominatim API (free) |
| Nearest river finder | OpenStreetMap Overpass API (free) |
| Image processing | Pillow, NumPy |
| Satellite library | `sentinelhub` Python package |

---

## Required Python Libraries

```
streamlit
sentinelhub
Pillow
requests
numpy
```

---

## API Credentials Needed

- **Sentinel Hub account** — free account at [dataspace.copernicus.eu](https://dataspace.copernicus.eu)
- After signup: go to Settings → OAuth Clients → copy `client_id` and `client_secret`
- Store credentials in a `.env` file (never hardcode in source)

```
SH_CLIENT_ID=your_client_id_here
SH_CLIENT_SECRET=your_client_secret_here
```

---

## UI — What the App Should Look Like

### Input Section (top of page)
- App title: **"Real-Time Satellite Image Viewer"**
- A single text input box — placeholder: `e.g. Kerala, India`
- A button: **"Show Satellite Images"**

### After button click — show in order:
1. A success message showing the found coordinates: `Found: Kerala, India — 10.8505°N, 76.2711°E`
2. A loading spinner while images are fetching: `"Fetching satellite images... (may take 10–20 seconds)"`
3. **3 images displayed side by side in columns**
4. An info box at the bottom with location details

---

## The 3 Images to Display

### Image 1 — True Color Satellite Image
- **What it shows:** The real, natural-color view of the location from space — green land, blue water, brown soil, exactly as it looks
- **Area:** 5 km radius around the typed location
- **Caption:** `"True color — what the area looks like from space"`
- **Sentinel Hub bands used:** B04 (Red), B03 (Green), B02 (Blue)

**Evalscript:**
```javascript
//VERSION=3
function setup() {
  return { input: ["B02","B03","B04"], output: { bands: 3 } }
}
function evaluatePixel(s) {
  return [s.B04/3000, s.B03/3000, s.B02/3000]
}
```

---

### Image 2 — NDWI Water Detection Map
- **What it shows:** A water-detection map where **blue = water or flooded areas**, **dark green = dry land**. Makes water/flood extent very clear even when it's not visible in the true-color image
- **Area:** Same 5 km radius around the typed location
- **Caption:** `"NDWI water map — blue areas = water detected"`
- **Sentinel Hub bands used:** B03 (Green), B08 (NIR)

**NDWI formula:** `(Green − NIR) / (Green + NIR)`  
Values above 0.2 = water. Values below 0 = land.

**Evalscript:**
```javascript
//VERSION=3
function setup() {
  return { input: ["B03","B08"], output: { bands: 3 } }
}
function evaluatePixel(s) {
  let ndwi = (s.B03 - s.B08) / (s.B03 + s.B08 + 0.0001)
  if (ndwi > 0.2)      return [0.0, 0.3, 0.9]   // water → bright blue
  else if (ndwi > 0.0) return [0.4, 0.7, 1.0]   // wet soil → light blue
  else                 return [0.1, 0.35, 0.1]  // land → dark green
}
```

---

### Image 3 — Nearest River Satellite Image
- **What it shows:** A true-color satellite image of the **nearest river** to the typed location, fetched automatically
- **Area:** 8 km radius around the river center (slightly larger to show river banks)
- **Caption:** `"Nearest river — [River Name]"` (e.g. `"Nearest river — Periyar River"`)
- **How river is found:** OpenStreetMap Overpass API — search for `waterway=river` or `waterway=stream` within 30 km of the location coordinates
- **Same evalscript as Image 1** (True Color)

---

## Core Functions to Build

### 1. `get_coordinates(place_name)`
- Input: string like `"Kerala, India"`
- Calls Nominatim API: `https://nominatim.openstreetmap.org/search`
- Returns: `(latitude, longitude)` as floats
- If not found: return `(None, None)` and show error in UI
- **Important:** Always add `User-Agent` header: `"SatelliteViewerApp/1.0"`

### 2. `find_nearest_river(lat, lng)`
- Input: latitude, longitude
- Calls Overpass API: `https://overpass-api.de/api/interpreter`
- Searches for rivers/streams within 30 km radius
- Returns: `(river_name, river_lat, river_lng)`
- If no river found: return `(None, lat, lng)` and skip Image 3 gracefully

### 3. `fetch_image(lat, lng, evalscript, size_km)`
- Input: coordinates, evalscript string, area size in km
- Creates bounding box: `offset = size_km / 111.0` degrees around the point
- Date range: last 90 days with `mosaicking_order="leastCC"` (picks clearest/least cloudy image automatically)
- Image size: capped at 512×512 pixels to avoid memory issues
- Returns: `PIL.Image` object (RGB)
- Uses `DataCollection.SENTINEL2_L2A`

---

## Sentinel Hub Image Fetch Settings

```python
time_interval = (90 days ago, today)       # last 90 days
mosaicking_order = "leastCC"               # least cloud cover = clearest image
resolution = 10                            # 10 meters per pixel (Sentinel-2 native)
max image size = 512 × 512 pixels          # cap to avoid memory errors
data_collection = SENTINEL2_L2A           # atmospherically corrected
output format = PNG
```

---

## Error Handling Requirements

| Situation | What to show |
|---|---|
| Location not found by geocoding | `st.error("Location not found. Try a more specific name.")` then `st.stop()` |
| No river found within 30 km | Show only 2 images (skip Image 3), add note: `"No river found near this location"` |
| Sentinel Hub API error | `st.error("Could not fetch satellite image. Check your API credentials.")` |
| Image is all black (cloud cover) | Add caption note: `"Image may have cloud cover. Try a different date range."` |

---

## Info Box (show after images)

Display a styled info box below the images containing:
```
📍 Location:       Kerala, India
🌐 Coordinates:    10.8505°N, 76.2711°E
🏞️ Nearest river:  Periyar River
🛰️ Data source:    Sentinel-2, European Space Agency
📅 Image date:     Most recent clear image from last 90 days
```

---

## File Structure

```
project/
├── app.py                ← Main Streamlit app (all code here)
├── .env                  ← API credentials (gitignored)
├── requirements.txt      ← Python dependencies
└── README.md             ← How to run the project
```

---

## `requirements.txt`

```
streamlit
sentinelhub
Pillow
requests
numpy
python-dotenv
```

---

## How to Run

```bash
pip install -r requirements.txt
streamlit run app.py
```

Opens at: `http://localhost:8501`

---

## Important Notes for Developer

- **No machine learning model** — this is purely image fetching and display
- Sentinel-2 satellite updates every **5 days** — `leastCC` mosaicking ensures the clearest recent image is returned, not necessarily today's
- The Nominatim API has a **rate limit of 1 request/second** — add `time.sleep(1)` between multiple geocoding calls if needed
- Always use `@st.cache_resource` for the Sentinel Hub config object to avoid reinitializing on every rerun
- The Overpass API can be slow (5–15 seconds) — wrap it in a spinner
- Sentinel Hub free tier allows **30,000 processing units/month** — each image fetch costs approximately 1–5 units depending on size

---

## Example Test Locations

Test the app with these locations after building:

| Location | Expected result |
|---|---|
| `Kerala, India` | Green landscape with rivers, NDWI shows water bodies |
| `Bangladesh` | High water presence, very strong NDWI signal |
| `Sahara Desert, Egypt` | Mostly dry land, minimal NDWI signal |
| `Amazon River, Brazil` | Strong river presence in Image 3 |
| `Mumbai, India` | Coastal city, Arabian Sea visible |
