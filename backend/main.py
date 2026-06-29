from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import requests
from backend.predictor import predict_risk, engineer_flood_features, engineer_landslide_features, \
    flood_model, landslide_model, _physics_flood_cap, _physics_landslide_cap, flood_meta, landslide_meta, \
    apply_flood_overrides, apply_landslide_overrides

app = FastAPI(
    title="Flood & Landslide Prediction API",
    description="ML-powered flood and landslide risk prediction for India",
    version="1.0.0"
)

# Allow CORS for the frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class LocationRequest(BaseModel):
    lat: float
    lon: float

class ManualRequest(BaseModel):
    # Weather parameters
    rainfall_mm: float = 0.0
    antecedent_7day_mm: float = 0.0
    temp_max_c: float = 25.0
    temp_min_c: float = 15.0
    humidity_pct: float = 60.0
    wind_speed_kmh: float = 10.0
    precipitation_hours: float = 0.0
    evapotranspiration_mm: float = 3.0
    soil_moisture: float = 0.1
    # Terrain & hydrology
    elevation_m: float = 100.0
    river_discharge_m3s: float = 0.0
    flood_nearby: int = 0
    # Time
    month: int = 6
    year: int = 2024

@app.get("/")
def read_root():
    return {"status": "online", "message": "Flood & Landslide Prediction API"}

@app.get("/health")
def health_check():
    return {"status": "ok", "message": "Flood prediction API is running"}

@app.post("/predict")
def predict(request: LocationRequest):
    try:
        result = predict_risk(request.lat, request.lon)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/predict-manual")
def predict_manual(req: ManualRequest):
    """
    Predict flood & landslide risk from manually supplied parameters.
    Bypasses live API fetch — uses provided values directly.
    """
    try:
        raw = {
            "rainfall_mm":          req.rainfall_mm,
            "antecedent_7day_mm":   req.antecedent_7day_mm,
            "temp_max_c":           req.temp_max_c,
            "temp_min_c":           req.temp_min_c,
            "humidity_pct":         req.humidity_pct,
            "wind_speed_kmh":       req.wind_speed_kmh,
            "precipitation_hours":  req.precipitation_hours,
            "evapotranspiration_mm":req.evapotranspiration_mm,
            "soil_moisture":        req.soil_moisture,
            "elevation_m":          req.elevation_m,
            "river_discharge_m3s":  req.river_discharge_m3s,
            "flood_nearby":         req.flood_nearby,
            "month":                req.month,
            "year":                 req.year,
        }

        df_flood = engineer_flood_features(raw)
        df_ls    = engineer_landslide_features(raw)

        flood_ml = float(flood_model.predict_proba(df_flood)[0][1])
        ls_ml    = float(landslide_model.predict_proba(df_ls)[0][1])

        rain        = raw["rainfall_mm"]
        antecedent  = raw["antecedent_7day_mm"]
        elev        = raw["elevation_m"]
        discharge   = raw["river_discharge_m3s"]
        humidity    = raw["humidity_pct"]
        soil_moist  = raw["soil_moisture"]

        max_flood = _physics_flood_cap(rain, antecedent, discharge, elev)
        max_ls    = _physics_landslide_cap(rain, antecedent, elev, soil_moist)

        flood_prob = min(flood_ml, max_flood)
        ls_prob    = min(ls_ml,    max_ls)

        # Apply physical hard overrides
        flood_prob = apply_flood_overrides(flood_prob, rain, antecedent, discharge, elev, humidity)
        ls_prob    = apply_landslide_overrides(ls_prob, rain, antecedent, elev, humidity)

        return {
            "raw_ml_probabilities": {
                "flood_ml_pct":     round(flood_ml * 100, 1),
                "landslide_ml_pct": round(ls_ml    * 100, 1),
            },
            "physics_caps": {
                "max_flood_pct":     round(max_flood * 100, 1),
                "max_landslide_pct": round(max_ls    * 100, 1),
            },
            "predictions": {
                "flood_risk_pct":     round(flood_prob * 100, 1),
                "landslide_risk_pct": round(ls_prob    * 100, 1),
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class FloodManualRequest(BaseModel):
    # Raw features
    rainfall_mm: float = 0.0
    temp_max_c: float = 25.0
    temp_min_c: float = 15.0
    humidity_pct: float = 60.0
    wind_speed_kmh: float = 10.0
    precipitation_hours: float = 0.0
    evapotranspiration_mm: float = 3.0
    elevation_m: float = 100.0
    river_discharge_m3s: float = 0.0
    
    # Engineered features used in training
    rainfall_category: int = 0
    season: int = 0
    humidity_risk: int = 0
    low_elevation: int = 0
    high_discharge: int = 0
    log_rainfall_mm: float = 0.0
    log_river_discharge_m3s: float = 0.0
    log_elevation_m: float = 0.0
    rain_humidity_index: float = 0.0
    precip_efficiency: float = 0.0
    temp_range_c: float = 0.0
    flood_risk_score: float = 0.0

@app.post("/predict-flood-manual")
def predict_flood_manual(req: FloodManualRequest):
    try:
        data = {
            "rainfall_mm":          req.rainfall_mm,
            "temp_max_c":           req.temp_max_c,
            "temp_min_c":           req.temp_min_c,
            "humidity_pct":         req.humidity_pct,
            "wind_speed_kmh":       req.wind_speed_kmh,
            "precipitation_hours":  req.precipitation_hours,
            "evapotranspiration_mm":req.evapotranspiration_mm,
            "elevation_m":          req.elevation_m,
            "river_discharge_m3s":  req.river_discharge_m3s,
            "rainfall_category":    req.rainfall_category,
            "season":               req.season,
            "humidity_risk":        req.humidity_risk,
            "low_elevation":        req.low_elevation,
            "high_discharge":       req.high_discharge,
            "log_rainfall_mm":      req.log_rainfall_mm,
            "log_river_discharge_m3s": req.log_river_discharge_m3s,
            "log_elevation_m":      req.log_elevation_m,
            "rain_humidity_index":  req.rain_humidity_index,
            "precip_efficiency":    req.precip_efficiency,
            "temp_range_c":         req.temp_range_c,
            "flood_risk_score":     req.flood_risk_score,
        }
        
        import pandas as pd
        df_flood = pd.DataFrame([data])
        feats = flood_meta['features_used']
        df_flood = df_flood[feats]
        
        flood_ml = float(flood_model.predict_proba(df_flood)[0][1])

        rain       = req.rainfall_mm
        antecedent = 0.0
        discharge  = req.river_discharge_m3s
        elev       = req.elevation_m
        humidity   = req.humidity_pct

        max_flood  = _physics_flood_cap(rain, antecedent, discharge, elev)
        flood_prob = min(flood_ml, max_flood)

        # Apply physical hard overrides
        flood_prob = apply_flood_overrides(flood_prob, rain, antecedent, discharge, elev, humidity)

        return {
            "raw_ml_probability": round(flood_ml * 100, 1),
            "physics_cap":       round(max_flood * 100, 1),
            "flood_risk_pct":    round(flood_prob * 100, 1),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class LandslideManualRequest(BaseModel):
    # Raw features
    rainfall_mm: float = 0.0
    antecedent_7day_mm: float = 0.0
    temp_max_c: float = 25.0
    temp_min_c: float = 15.0
    humidity_pct: float = 60.0
    wind_speed_kmh: float = 10.0
    precipitation_hours: float = 0.0
    evapotranspiration_mm: float = 3.0
    soil_moisture: float = 0.1
    elevation_m: float = 100.0
    river_discharge_m3s: float = 0.0
    flood_nearby: int = 0
    
    # Engineered features used in training
    rainfall_intensity: float = 0.0
    elevation_cat: int = 0
    slope_proxy: float = 0.0
    twi_proxy: float = 0.0
    combined_rain_index: float = 0.0
    season: int = 0
    critical_zone: int = 0
    log_rainfall_mm: float = 0.0
    log_antecedent_7day_mm: float = 0.0
    log_elevation_m: float = 0.0
    temp_range: float = 0.0
    landslide_risk_score: float = 0.0

@app.post("/predict-landslide-manual")
def predict_landslide_manual(req: LandslideManualRequest):
    try:
        data = {
            "rainfall_mm":          req.rainfall_mm,
            "antecedent_7day_mm":   req.antecedent_7day_mm,
            "temp_max_c":           req.temp_max_c,
            "temp_min_c":           req.temp_min_c,
            "humidity_pct":         req.humidity_pct,
            "wind_speed_kmh":       req.wind_speed_kmh,
            "precipitation_hours":  req.precipitation_hours,
            "evapotranspiration_mm":req.evapotranspiration_mm,
            "soil_moisture":        req.soil_moisture,
            "elevation_m":          req.elevation_m,
            "river_discharge_m3s":  req.river_discharge_m3s,
            "flood_nearby":         req.flood_nearby,
            "rainfall_intensity":   req.rainfall_intensity,
            "elevation_cat":        req.elevation_cat,
            "slope_proxy":          req.slope_proxy,
            "twi_proxy":            req.twi_proxy,
            "combined_rain_index":  req.combined_rain_index,
            "season":               req.season,
            "critical_zone":        req.critical_zone,
            "log_rainfall_mm":      req.log_rainfall_mm,
            "log_antecedent_7day_mm": req.log_antecedent_7day_mm,
            "log_elevation_m":      req.log_elevation_m,
            "temp_range":           req.temp_range,
            "landslide_risk_score": req.landslide_risk_score,
        }

        import pandas as pd
        df_ls = pd.DataFrame([data])
        feats = landslide_meta['features']
        df_ls = df_ls[feats]
        
        ls_ml = float(landslide_model.predict_proba(df_ls)[0][1])

        rain        = req.rainfall_mm
        antecedent  = req.antecedent_7day_mm
        elev        = req.elevation_m
        soil_moist  = req.soil_moisture
        humidity    = req.humidity_pct
        discharge   = req.river_discharge_m3s

        max_ls  = _physics_landslide_cap(rain, antecedent, elev, soil_moist)
        ls_prob = min(ls_ml, max_ls)

        # Apply physical hard overrides
        ls_prob = apply_landslide_overrides(ls_prob, rain, antecedent, elev, humidity)

        return {
            "raw_ml_probability":  round(ls_ml * 100, 1),
            "physics_cap":         round(max_ls * 100, 1),
            "landslide_risk_pct":  round(ls_prob * 100, 1),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ─────────────────────────────────────────────────────────────────────────────
# SATELLITE IMAGERY PROXY  (keeps credentials server-side, avoids CORS)
# ─────────────────────────────────────────────────────────────────────────────
import base64
import time
from datetime import datetime, timedelta

# Sentinel Hub / Copernicus Data Space credentials
SH_CLIENT_ID     = "sh-605b1477-216c-4f1b-b5cc-3bbf38d7097e"
SH_CLIENT_SECRET = "Ww16V3kKpDniBe65MCYVFv4UO3iSlL9B"
SH_TOKEN_URL     = "https://identity.dataspace.copernicus.eu/auth/realms/CDSE/protocol/openid-connect/token"
SH_PROCESS_URL   = "https://sh.dataspace.copernicus.eu/api/v1/process"

# Token cache to avoid fetching a new one on every request
_token_cache = {"token": None, "expires_at": 0}

def _get_sh_token() -> str:
    """Fetch or return cached Sentinel Hub OAuth access token."""
    if _token_cache["token"] and time.time() < _token_cache["expires_at"]:
        return _token_cache["token"]
    resp = requests.post(
        SH_TOKEN_URL,
        headers={"Content-Type": "application/x-www-form-urlencoded"},
        data={
            "grant_type": "client_credentials",
            "client_id": SH_CLIENT_ID,
            "client_secret": SH_CLIENT_SECRET,
        },
        timeout=15,
    )
    if resp.status_code != 200:
        raise Exception(f"Sentinel Hub auth failed: {resp.status_code} {resp.text}")
    data = resp.json()
    _token_cache["token"] = data["access_token"]
    _token_cache["expires_at"] = time.time() + data.get("expires_in", 3600) - 60
    return _token_cache["token"]


EVALSCRIPT_TRUE_COLOR = """
//VERSION=3
function setup() {
  return { input: ["B02","B03","B04"], output: { bands: 3 } };
}
function evaluatePixel(s) {
  return [2.5*s.B04, 2.5*s.B03, 2.5*s.B02];
}
"""

EVALSCRIPT_NDWI = """
//VERSION=3
function setup() {
  return { input: ["B03","B08"], output: { bands: 3 } };
}
function evaluatePixel(s) {
  let ndwi = (s.B03 - s.B08) / (s.B03 + s.B08 + 0.0001);
  if (ndwi > 0.2)       return [0.0, 0.3, 0.9];
  else if (ndwi > 0.0)  return [0.4, 0.7, 1.0];
  else                  return [0.1, 0.35, 0.1];
}
"""

EVALSCRIPT_NDVI = """
//VERSION=3
function setup() {
  return { input: ["B04","B08"], output: { bands: 3 } };
}
function evaluatePixel(s) {
  let ndvi = (s.B08 - s.B04) / (s.B08 + s.B04 + 0.0001);
  if (ndvi > 0.5)       return [0.0, 0.5, 0.1];
  else if (ndvi > 0.2)  return [0.3, 0.7, 0.2];
  else if (ndvi > 0.0)  return [0.7, 0.6, 0.2];
  else                  return [0.6, 0.5, 0.4];
}
"""

class SatelliteRequest(BaseModel):
    lat: float
    lon: float
    image_type: str = "true_color"  # true_color | ndwi | ndvi
    size_km: float = 8.0
    mosaicking_order: str = "mostRecent"  # mostRecent | leastCC
    days: int = 15

@app.post("/satellite/image")
def get_satellite_image(req: SatelliteRequest):
    """
    Fetch a Sentinel-2 satellite image for the given coordinates.
    Returns the image as a base64-encoded PNG string.
    """
    try:
        token = _get_sh_token()

        evalscript_map = {
            "true_color": EVALSCRIPT_TRUE_COLOR,
            "ndwi":       EVALSCRIPT_NDWI,
            "ndvi":       EVALSCRIPT_NDVI,
        }
        evalscript = evalscript_map.get(req.image_type, EVALSCRIPT_TRUE_COLOR)

        offset = req.size_km / 111.0
        bbox = [
            round(req.lon - offset, 6),
            round(req.lat - offset, 6),
            round(req.lon + offset, 6),
            round(req.lat + offset, 6),
        ]

        end_date   = datetime.utcnow()
        start_date = end_date - timedelta(days=req.days)

        payload = {
            "input": {
                "bounds": {
                    "bbox": bbox,
                    "properties": {"crs": "http://www.opengis.net/def/crs/OGC/1.3/CRS84"},
                },
                "data": [{
                    "dataFilter": {
                        "timeRange": {
                            "from": start_date.strftime("%Y-%m-%dT00:00:00Z"),
                            "to":   end_date.strftime("%Y-%m-%dT23:59:59Z"),
                        },
                        "mosaickingOrder": req.mosaicking_order,
                    },
                    "type": "sentinel-2-l2a",
                }],
            },
            "output": {
                "width":  512,
                "height": 512,
                "responses": [{"identifier": "default", "format": {"type": "image/png"}}],
            },
            "evalscript": evalscript,
        }

        # Query Copernicus Catalog API to find the exact date & cloud cover of the selected image
        img_date = None
        cloud_cover = None
        try:
            catalog_payload = {
                "bbox": bbox,
                "datetime": f"{start_date.strftime('%Y-%m-%dT00:00:00Z')}/{end_date.strftime('%Y-%m-%dT23:59:59Z')}",
                "collections": ["sentinel-2-l2a"],
                "limit": 50
            }
            catalog_resp = requests.post(
                "https://sh.dataspace.copernicus.eu/api/v1/catalog/1.0.0/search",
                json=catalog_payload,
                headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
                timeout=15
            )
            if catalog_resp.status_code == 200:
                features = catalog_resp.json().get("features", [])
                if features:
                    if req.mosaicking_order == "mostRecent":
                        # Sort by date descending (most recent first)
                        features.sort(key=lambda x: x.get("properties", {}).get("datetime", ""), reverse=True)
                    else:
                        # Sort by cloud cover ascending (matches leastCC mosaicking)
                        features.sort(key=lambda x: x.get("properties", {}).get("eo:cloud_cover", 100))
                    
                    best_feat = features[0]
                    img_date = best_feat.get("properties", {}).get("datetime")
                    cloud_cover = best_feat.get("properties", {}).get("eo:cloud_cover")
        except Exception:
            pass  # Fallback gracefully if catalog query fails

        img_resp = requests.post(
            SH_PROCESS_URL,
            json=payload,
            headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
            timeout=40,
        )

        if img_resp.status_code != 200:
            err_msg = img_resp.text[:500]
            # Custom message for empty timeRange matches on Sentinel Hub Process API
            if "No data found" in err_msg or img_resp.status_code == 400:
                raise HTTPException(
                    status_code=404,
                    detail=f"No recent satellite images found in the last {req.days} days for this location. Try choosing the 'Clearest image' mode to check older images."
                )
            raise HTTPException(
                status_code=img_resp.status_code,
                detail=f"Sentinel Hub Process API error: {err_msg}",
            )

        encoded = base64.b64encode(img_resp.content).decode("utf-8")
        return {
            "image_base64": encoded,
            "format": "image/png",
            "date": img_date,
            "cloud_cover": cloud_cover
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


class RiverRequest(BaseModel):
    lat: float
    lon: float
    radius_m: int = 30000

@app.post("/satellite/river")
def find_nearest_river(req: RiverRequest):
    """
    Find the nearest river to the given coordinates using the Overpass API.
    Returns river name and center coordinates.
    """
    try:
        overpass_url = "https://overpass-api.de/api/interpreter"
        query = f"""
[out:json][timeout:20];
(
  way["waterway"="river"](around:{req.radius_m},{req.lat},{req.lon});
  way["waterway"="stream"](around:{req.radius_m},{req.lat},{req.lon});
);
out center 1;
"""
        resp = requests.post(overpass_url, data={"data": query}, timeout=25)
        if resp.status_code != 200:
            return {"found": False, "name": None, "lat": req.lat, "lon": req.lon}

        elements = resp.json().get("elements", [])
        if not elements:
            return {"found": False, "name": None, "lat": req.lat, "lon": req.lon}

        el = elements[0]
        name = el.get("tags", {}).get("name") or el.get("tags", {}).get("name:en") or "Unnamed River"
        center = el.get("center", {})
        river_lat = center.get("lat", req.lat)
        river_lon = center.get("lon", req.lon)

        return {"found": True, "name": name, "lat": river_lat, "lon": river_lon}

    except Exception as e:
        return {"found": False, "name": None, "lat": req.lat, "lon": req.lon}
