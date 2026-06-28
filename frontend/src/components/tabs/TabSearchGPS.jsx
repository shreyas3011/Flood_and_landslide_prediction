import React, { useState, useCallback, useEffect, useRef } from 'react';
import axios from 'axios';
import { Crosshair, Navigation, Search, MapPin } from 'lucide-react';
import PredictionResult from '../ui/PredictionResult';
import NearestSafeZonesPanel from '../ui/NearestSafeZonesPanel';
import SatelliteImageViewer from '../ui/SatelliteImageViewer';
import { findTopNSafeZones } from '../../services/orsService';
import { SAFE_ZONES } from '../../data/safeZones';
import { makeSafeZoneIcon, fmtDist, fmtTime, ZONE_META } from '../../utils/mapUtils';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';

const API_BASE = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'http://127.0.0.1:8000'
  : 'https://flood-and-landslide-prediction.onrender.com';

async function fetchPrediction(lat, lon) {
  const response = await axios.post(`${API_BASE}/predict`, { lat, lon });
  return response.data;
}

export default function TabSearchGPS() {
  const [query, setQuery] = useState('');
  const [coords, setCoords] = useState(null);
  const [locationName, setLocationName] = useState('');
  const [loading, setLoading] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [prediction, setPrediction] = useState(null);
  const [error, setError] = useState(null);
  const [nearestZones, setNearestZones] = useState([]);
  const [zonesLoading, setZonesLoading] = useState(false);

  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const wrapperRef = useRef(null);

  const runPrediction = useCallback(async (lat, lon, name = '') => {
    setLoading(true);
    setError(null);
    setPrediction(null);
    setNearestZones([]);
    try {
      const data = await fetchPrediction(lat, lon);
      setCoords({ lat, lon });
      setLocationName(name || `${lat.toFixed(4)}, ${lon.toFixed(4)}`);
      setPrediction(data);
      setZonesLoading(true);

      const fetchZones = async () => {
        let dynamicZones = [];
        const radii = [15000, 35000]; // Try 15km, then 35km if empty
        for (const radius of radii) {
          try {
            const osmTags = [
              'amenity=hospital',
              'amenity=clinic',
              'amenity=fire_station',
              'amenity=police',
              'amenity=social_facility'
            ];
            const tagsQuery = osmTags.map(tag => {
              const [key, val] = tag.split('=');
              return `node["${key}"="${val}"](around:${radius},${lat},${lon});`;
            }).join('\n');
            
            const query = `[out:json][timeout:15];(\n${tagsQuery}\n);out body;`;
            const res = await fetch('https://overpass-api.de/api/interpreter', {
              method: 'POST',
              body: `data=${encodeURIComponent(query)}`,
            });
            if (res.ok) {
              const data = await res.json();
              const elements = data.elements || [];
              if (elements.length > 0) {
                dynamicZones = elements
                  .filter(el => el.lat && el.lon)
                  .map(el => {
                    const a = el.tags?.amenity;
                    let type = 'hospital';
                    if (a === 'hospital')        type = 'hospital';
                    else if (a === 'clinic')     type = 'clinic';
                    else if (a === 'fire_station')type = 'fire_station';
                    else if (a === 'police')      type = 'police';
                    else if (a === 'social_facility') type = 'shelter';
                    
                    return {
                      id: `rt-${el.id}`,
                      name: el.tags?.name || el.tags?.['name:en'] || `Unnamed ${type}`,
                      lat: el.lat,
                      lon: el.lon,
                      type,
                      state: el.tags?.['addr:state'] || el.tags?.['addr:city'] || el.tags?.['addr:district'] || 'Local Area'
                    };
                  });
                break; // Found results, stop expanding search
              }
            }
          } catch (e) {
            console.warn(`Failed to fetch real-time safe zones at ${radius}m:`, e);
          }
        }

        const targetZones = dynamicZones.length > 0 ? dynamicZones : SAFE_ZONES;
        
        try {
          const zones = await findTopNSafeZones(lat, lon, targetZones, 3);
          setNearestZones(zones);
        } catch (err) {
          console.error('Error finding top N safe zones:', err);
        } finally {
          setZonesLoading(false);
        }
      };

      fetchZones();
    } catch (err) {
      setError(err.response?.data?.detail || 'Prediction failed. Is the backend running?');
      setZonesLoading(false);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get(
        `https://nominatim.openstreetmap.org/search`,
        {
          params: { q: query, format: 'json', limit: 1 },
          headers: { 'User-Agent': 'TerraGuard-AI/1.0' },
        }
      );
      if (!res.data || res.data.length === 0) {
        setError('Location not found. Try a different name.');
        setLoading(false);
        return;
      }
      const { lat, lon, display_name } = res.data[0];
      await runPrediction(parseFloat(lat), parseFloat(lon), display_name.split(',').slice(0, 2).join(', '));
    } catch {
      setError('Geocoding failed. Check your internet connection.');
      setLoading(false);
    }
  };
  const handleGPS = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser.');
      return;
    }
    setGpsLoading(true);
    setError(null);

    // On mobile, the browser often fires the callback immediately with a rough
    // WiFi / cell-tower fix (accuracy 500 m – 5 km) before the real GPS lock.
    // We use watchPosition to keep collecting fixes and pick the best one
    // within a timeout window, then cancel the watch.
    const ACCURACY_THRESHOLD_M = 150;  // accept if within 150 m
    const MAX_WAIT_MS          = 20000; // wait up to 20 s for a good fix
    const FALLBACK_ACCEPT_MS   = 8000; // after 8 s, accept whatever we have

    let watchId = null;
    let bestPos = null;
    let fallbackTimer = null;
    let maxTimer = null;
    let settled = false;

    const finish = async (pos) => {
      if (settled) return;
      settled = true;

      // Cancel the watch and any pending timers
      if (watchId !== null) navigator.geolocation.clearWatch(watchId);
      clearTimeout(fallbackTimer);
      clearTimeout(maxTimer);

      const { latitude, longitude, accuracy } = pos.coords;
      const accuracyNote = accuracy ? ` (±${Math.round(accuracy)} m)` : '';

      let locationLabel = `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`,
          { headers: { 'User-Agent': 'GeoShield-AI/1.0' } }
        );
        const data = await res.json();
        if (data && data.display_name) {
          locationLabel = data.display_name.split(',').slice(0, 4).join(',').trim() + accuracyNote;
        } else {
          locationLabel += accuracyNote;
        }
      } catch (e) {
        locationLabel += accuracyNote;
      }

      setGpsLoading(false);
      runPrediction(latitude, longitude, locationLabel);
    };

    const onError = (err) => {
      if (settled) return;
      // If we already have any fix (even rough), use it rather than failing
      if (bestPos) {
        finish(bestPos);
        return;
      }
      settled = true;
      if (watchId !== null) navigator.geolocation.clearWatch(watchId);
      clearTimeout(fallbackTimer);
      clearTimeout(maxTimer);
      setGpsLoading(false);

      let msg = 'GPS error. Please allow location access or type a location manually.';
      if (err.code === 1) msg = 'Location access denied. Please enable location permissions in your browser/phone settings.';
      else if (err.code === 2) msg = 'Position unavailable. Make sure GPS is enabled on your device.';
      else if (err.code === 3) msg = 'GPS timed out. Move to an open area with better signal and try again.';
      setError(msg);
    };

    // Start watching — each new fix should be more accurate than the last
    watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const acc = pos.coords.accuracy;
        // Keep the best (most accurate) fix seen so far
        if (!bestPos || acc < bestPos.coords.accuracy) {
          bestPos = pos;
        }
        // If accuracy is good enough, accept immediately
        if (acc <= ACCURACY_THRESHOLD_M) {
          finish(pos);
        }
      },
      onError,
      { enableHighAccuracy: true, maximumAge: 0, timeout: MAX_WAIT_MS }
    );

    // After FALLBACK_ACCEPT_MS, accept whatever best fix we have (even if imprecise)
    fallbackTimer = setTimeout(() => {
      if (bestPos && !settled) {
        finish(bestPos);
      }
    }, FALLBACK_ACCEPT_MS);

    // Hard stop after MAX_WAIT_MS
    maxTimer = setTimeout(() => {
      if (!settled) {
        if (bestPos) {
          finish(bestPos);
        } else {
          onError({ code: 3, message: 'Timed out waiting for GPS fix.' });
        }
      }
    }, MAX_WAIT_MS);
  };


  const handleSelectSuggestion = (sug) => {
    setIsTyping(false);
    const shortName = sug.display_name.split(',').slice(0, 2).join(', ');
    setQuery(shortName);
    setSuggestions([]);
    setShowSuggestions(false);
    runPrediction(parseFloat(sug.lat), parseFloat(sug.lon), shortName);
  };

  const handleSearchClick = () => {
    setIsTyping(false);
    setShowSuggestions(false);
    handleSearch();
  };

  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [wrapperRef]);

  useEffect(() => {
    if (!query.trim() || query.length < 2 || !isTyping) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    const delayDebounceFn = setTimeout(async () => {
      setSuggestionsLoading(true);
      setShowSuggestions(true);
      try {
        const res = await axios.get(
          `https://nominatim.openstreetmap.org/search`,
          {
            params: { q: query, format: 'json', limit: 5 },
            headers: { 'User-Agent': 'TerraGuard-AI/1.0' },
          }
        );
        if (res.data) {
          setSuggestions(res.data);
        }
      } catch (err) {
        console.error('Error fetching suggestions:', err);
      } finally {
        setSuggestionsLoading(false);
      }
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [query, isTyping]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 h-full">
      {/* Input Panel */}
      <div className="lg:col-span-4 xl:col-span-4 flex flex-col gap-6 overflow-y-auto pr-1 custom-scrollbar pb-20 md:pb-0">
        
        {/* GPS Panel */}
        <div className="glass p-5 rounded-2xl border border-white/5 shadow-lg">
          <div className="flex items-center gap-2 mb-2 text-blue-400 font-bold text-sm">
            <Crosshair size={20} />
            Detect My Location (GPS)
          </div>
          <p className="text-xs text-slate-400 mb-4">
            Allow location access on your device. On mobile, the app waits up to 8 seconds for a precise GPS fix — move outdoors for best accuracy.
          </p>
          <button
            className={`w-full py-3 rounded-xl flex items-center justify-center gap-2 font-semibold text-sm transition-all duration-300 ${gpsLoading ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30 cursor-not-allowed' : 'bg-gradient-to-r from-blue-600 to-emerald-500 hover:from-blue-500 hover:to-emerald-400 text-white shadow-lg shadow-blue-500/25'}`}
            onClick={handleGPS}
            disabled={gpsLoading || loading}
          >
            {gpsLoading ? (
              <><div className="w-4 h-4 rounded-full border-2 border-blue-400 border-t-transparent animate-spin" /> Acquiring GPS fix...</>
            ) : (
              <><Navigation size={18} /> Use My Current Location</>
            )}
          </button>

        </div>


        <div className="flex items-center gap-4 px-2">
          <div className="h-px bg-white/10 flex-1"></div>
          <span className="text-xs font-bold text-slate-500 tracking-widest uppercase">OR</span>
          <div className="h-px bg-white/10 flex-1"></div>
        </div>

        {/* Search Panel */}
        <div className="glass p-5 rounded-2xl border border-white/5 shadow-lg">
          <div className="flex items-center gap-2 mb-2 text-emerald-400 font-bold text-sm">
            <Search size={20} />
            Search by Place Name
          </div>
          <p className="text-xs text-slate-400 mb-4">Type a city, region, or landmark name to check flood and landslide risks.</p>
          
          <div className="relative" ref={wrapperRef}>
            <div className="flex bg-slate-900/50 rounded-xl border border-white/10 overflow-hidden focus-within:border-emerald-500/50 transition-colors">
              <input
                className="flex-1 bg-transparent border-none outline-none px-4 py-3 text-sm text-slate-200 placeholder:text-slate-500"
                type="text"
                placeholder="e.g. Mumbai, Kedarnath..."
                value={query}
                onChange={e => {
                  setQuery(e.target.value);
                  setIsTyping(true);
                }}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    setIsTyping(false);
                    setShowSuggestions(false);
                    handleSearch();
                  }
                }}
                onFocus={() => {
                  if (suggestions.length > 0) setShowSuggestions(true);
                }}
              />
              <button
                className="px-4 bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition-colors flex items-center justify-center"
                onClick={handleSearchClick}
                disabled={loading || gpsLoading}
              >
                {loading ? <div className="w-4 h-4 rounded-full border-2 border-emerald-400 border-t-transparent animate-spin" /> : <Search size={18} />}
              </button>
            </div>

            {/* Autocomplete dropdown */}
            {showSuggestions && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-slate-800 border border-white/10 rounded-xl shadow-2xl z-50 max-h-64 overflow-y-auto custom-scrollbar overflow-hidden">
                {suggestionsLoading ? (
                  <div className="p-4 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                    <div className="w-4 h-4 rounded-full border-2 border-slate-400 border-t-transparent animate-spin" />
                    Searching locations...
                  </div>
                ) : suggestions.length > 0 ? (
                  suggestions.map((sug, idx) => (
                    <button
                      key={sug.place_id || idx}
                      className="w-full text-left p-3 hover:bg-white/5 border-b border-white/5 last:border-0 flex items-center gap-3 transition-colors group"
                      onClick={() => handleSelectSuggestion(sug)}
                    >
                      <MapPin size={14} className="text-emerald-500 shrink-0 group-hover:scale-110 transition-transform" />
                      <span className="text-xs text-slate-300 truncate">{sug.display_name}</span>
                    </button>
                  ))
                ) : (
                  query.trim().length >= 2 && <div className="p-4 text-center text-xs text-slate-500">No locations found</div>
                )}
              </div>
            )}
          </div>

          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-6 mb-3">Quick Locations</div>
          <div className="flex flex-wrap gap-2">
            {[
              { name: 'Kedarnath', lat: 30.74, lon: 79.07 },
              { name: 'Kerala', lat: 9.55, lon: 76.62 },
              { name: 'Mumbai', lat: 19.07, lon: 72.87 },
              { name: 'Assam', lat: 26.14, lon: 91.74 },
              { name: 'Sahara', lat: 25.00, lon: 10.00 },
              { name: 'Rajasthan', lat: 27.02, lon: 74.21 },
            ].map(loc => (
              <button
                key={loc.name}
                className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 text-xs text-slate-300 transition-colors"
                onClick={() => { setQuery(loc.name); runPrediction(loc.lat, loc.lon, loc.name); }}
              >
                {loc.name}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium">
            {error}
          </div>
        )}
      </div>

      {/* Results Panel */}
      <div className="lg:col-span-8 xl:col-span-8 h-full min-h-[500px]">
        {loading ? (
          <div className="glass h-full rounded-2xl border border-white/5 flex flex-col items-center justify-center text-center">
            <div className="w-10 h-10 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin mb-4" />
            <div className="text-lg font-bold text-emerald-400 mb-1">Analyzing Region</div>
            <div className="text-xs text-slate-400 max-w-sm">Fetching real-time satellite telemetry, geological elevation, and historical weather data...</div>
          </div>
        ) : prediction ? (
          <div className="h-full flex flex-col gap-4 overflow-y-auto pr-1 custom-scrollbar">
            <div className="glass p-4 rounded-2xl border border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0">
                  <MapPin size={20} className="text-emerald-400" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-200">{locationName}</h2>
                  <p className="text-[10px] text-slate-500 font-medium">Coordinates: {coords.lat.toFixed(4)}, {coords.lon.toFixed(4)}</p>
                </div>
              </div>
            </div>

            <PredictionResult prediction={prediction} />
            <NearestSafeZonesPanel zones={nearestZones} loading={zonesLoading} />

            <div className="glass rounded-2xl border border-white/5 h-[300px] mt-2 relative overflow-hidden shadow-lg">
              <MapContainer key={`${coords.lat}-${coords.lon}`} center={[coords.lat, coords.lon]} zoom={11} style={{ height: '100%', width: '100%' }}>
                <TileLayer
                  attribution='&copy; <a href="https://carto.com/attributions">CARTO</a>'
                  url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                />
                <Marker position={[coords.lat, coords.lon]}>
                  <Popup><strong style={{fontFamily:'sans-serif'}}>{locationName}</strong></Popup>
                </Marker>
                {nearestZones.map((item, i) => (
                  <Marker
                    key={`nz-${item.zone.id}`}
                    position={[item.zone.lat, item.zone.lon]}
                    icon={makeSafeZoneIcon(item.zone.type)}
                    zIndexOffset={i === 0 ? 1000 : 0}
                  >
                    <Popup className="premium-popup">
                      <div className="font-sans text-xs min-w-[160px]">
                        {i === 0 && <div className="text-emerald-500 font-bold text-[10px] mb-1 uppercase tracking-wider">⭐ Nearest Safe Zone</div>}
                        <strong className="text-sm block">{item.zone.name}</strong>
                        <span className="text-[10px] text-slate-500 capitalize block mt-0.5">
                          {(ZONE_META[item.zone.type]?.label || item.zone.type.replace('_', ' '))} · {item.zone.state}
                        </span>
                      </div>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            </div>

            {/* ── Satellite Imagery Section ── */}
            <div className="glass rounded-2xl border border-white/5 p-4 shadow-lg">
              <SatelliteImageViewer
                lat={coords.lat}
                lon={coords.lon}
                locationName={locationName}
              />
            </div>
          </div>
        ) : (
          <div className="glass h-full rounded-2xl border border-white/5 flex flex-col items-center justify-center text-center opacity-60">
            <Search size={40} className="text-slate-500 mb-4" />
            <h3 className="text-lg font-bold text-slate-300 mb-2">No Location Selected</h3>
            <p className="text-sm text-slate-500 max-w-xs">Use the GPS detector or type a location to run the prediction models.</p>
          </div>
        )}
      </div>
    </div>
  );
}
