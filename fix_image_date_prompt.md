# Fix Prompt — Show Most Recent Satellite Images

## Problem
The app is currently showing satellite images from 2 months ago (April).
This happens because `mosaicking_order="leastCC"` picks the clearest image
regardless of how old it is. For a flood detection app, recent images are
more important than perfectly clear ones.

---

## Changes Required

### Change 1 — In `fetch_image()` function

**Find this:**
```python
mosaicking_order="leastCC"
```

**Replace with:**
```python
mosaicking_order="mostRecent"
```

---

### Change 2 — In `fetch_image()` function

**Find this:**
```python
start = (datetime.now() - timedelta(days=90)).strftime("%Y-%m-%d")
```

**Replace with:**
```python
start = (datetime.now() - timedelta(days=15)).strftime("%Y-%m-%d")
```

---

### Change 3 — Add image date display in UI

Add this new function to the code:

```python
from sentinelhub import SentinelHubCatalog

def get_latest_image_date(lat, lng, config):
    catalog = SentinelHubCatalog(config=config)
    offset = 0.05
    bbox = BBox([lng-offset, lat-offset, lng+offset, lat+offset], CRS.WGS84)

    end   = datetime.now().strftime("%Y-%m-%d")
    start = (datetime.now() - timedelta(days=15)).strftime("%Y-%m-%d")

    results = list(catalog.search(
        DataCollection.SENTINEL2_L2A,
        bbox=bbox,
        time=(start, end),
        limit=1
    ))

    if results:
        return results[0]["properties"]["datetime"][:10]  # e.g. "2026-06-23"
    return "Not available"
```

Then call it after coordinates are found and show the date in the UI:

```python
image_date = get_latest_image_date(lat, lng, config)
st.caption(f"Satellite image date: {image_date}")
```

---

### Change 4 — Add image preference toggle in UI

Add this radio button in the UI before the fetch button so users can choose:

```python
mode = st.radio(
    "Image preference",
    ["Most recent (may have clouds)", "Clearest image (may be older)"],
    horizontal=True
)

mosaicking = "mostRecent" if "recent" in mode else "leastCC"
days       = 15            if "recent" in mode else 90
```

Then pass `mosaicking` and `days` as parameters into `fetch_image()` and use
them instead of the hardcoded values.

---

## Summary of All Changes

| What | Before | After |
|---|---|---|
| Mosaicking order | `leastCC` | `mostRecent` |
| Date range | 90 days | 15 days |
| Image date shown to user | Not shown | Shown below images |
| User control | None | Radio toggle in UI |

---

## Expected Result After Fix
- Images will be from the **last 5–15 days** instead of months ago
- User can see the exact **date of the satellite image** below the photos
- User can toggle between **"most recent"** and **"clearest"** based on their need
- If no image found in 15 days (rare), fallback message shown:
  `"No recent image available for this location."`
