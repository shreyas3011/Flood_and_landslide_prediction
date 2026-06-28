import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useSettings } from '../context/SettingsContext';
import {
  MapContainer, TileLayer, Marker, Popup, Tooltip, useMap, useMapEvents, Polyline,
} from 'react-leaflet';
import L from 'leaflet';
import { getRoute } from '../services/orsService';

// ── Leaflet icon fix ──────────────────────────────────────────────────────────
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl:       'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl:     'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// ── Inject styles ─────────────────────────────────────────────────────────────
if (!document.getElementById('nf-styles')) {
  const s = document.createElement('style');
  s.id = 'nf-styles';
  s.textContent = `
    @keyframes nf-pulse {
      0%   { transform: scale(1);   opacity: 0.5; }
      70%  { transform: scale(2.5); opacity: 0; }
      100% { transform: scale(2.5); opacity: 0; }
    }
    @keyframes nf-spin {
      to { transform: rotate(360deg); }
    }
    @keyframes nf-fadeUp {
      from { opacity: 0; transform: translateY(10px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    .nf-card { animation: nf-fadeUp 0.3s ease forwards; }
    .nf-spinner {
      width: 30px; height: 30px; border-radius: 50%;
      border: 3px solid rgba(99,102,241,0.15);
      border-top-color: #6366f1;
      animation: nf-spin 0.8s linear infinite;
      margin: 0 auto 12px;
    }
    .nf-sm-spinner {
      width: 14px; height: 14px; border-radius: 50%;
      border: 2px solid rgba(99,102,241,0.2);
      border-top-color: #818cf8;
      animation: nf-spin 0.7s linear infinite;
      flex-shrink: 0;
    }
    .nf-result-row {
      transition: background 0.15s ease;
    }
    .nf-result-row:hover {
      background: rgba(99,102,241,0.07) !important;
    }
    .nf-gmap-btn {
      display: inline-flex; align-items: center; gap: 5px;
      padding: 4px 10px; border-radius: 6px; font-size: 10px;
      font-weight: 700; cursor: pointer; border: none;
      background: rgba(66,133,244,0.15); color: #93c5fd;
      border: 1px solid rgba(66,133,244,0.3);
      font-family: inherit; transition: all 0.15s;
      text-decoration: none;
    }
    .nf-gmap-btn:hover { background: rgba(66,133,244,0.28); color: #bfdbfe; }
    .nf-search-input {
      flex: 1; background: var(--bg-app);
      border: 1px solid var(--border-color);
      border-radius: 10px; padding: 10px 14px;
      color: var(--text-main); font-size: 13px; font-family: inherit;
      outline: none; transition: border 0.2s, background 0.2s;
    }
    .nf-search-input::placeholder { color: var(--text-dim); }
    .nf-search-input:focus {
      border-color: var(--accent-blue-text);
      background: var(--bg-card);
    }
    .nf-btn-primary {
      padding: 10px 16px; border-radius: 10px; border: none; cursor: pointer;
      font-size: 13px; font-weight: 700; font-family: inherit;
      background: linear-gradient(135deg, #6366f1, #8b5cf6);
      color: #fff; box-shadow: 0 4px 14px rgba(99,102,241,0.4);
      transition: opacity 0.2s, transform 0.15s; white-space: nowrap;
    }
    .nf-btn-primary:hover:not(:disabled) { opacity: 0.9; transform: translateY(-1px); }
    .nf-btn-primary:disabled { opacity: 0.55; cursor: not-allowed; transform: none; }
    .nf-chip {
      padding: 4px 11px; border-radius: 20px; font-size: 11px; font-weight: 600;
      border: 1px solid var(--accent-blue-border); background: var(--accent-blue-bg);
      color: var(--accent-blue-text); cursor: pointer; transition: all 0.15s; white-space: nowrap;
      font-family: inherit;
    }
    .nf-chip:hover:not(:disabled) { background: var(--border-color); color: var(--text-main); }
    .nf-chip:disabled { opacity: 0.5; cursor: not-allowed; }
    .nf-radius-select {
      background: var(--bg-card); border: 1px solid var(--border-color);
      border-radius: 8px; padding: 6px 10px; color: var(--text-main); font-size: 12px;
      font-family: inherit; outline: none; cursor: pointer;
    }
    .nf-radius-select option {
      background: var(--bg-card); color: var(--text-main);
    }
    .nf-type-chip {
      padding: 3px 9px; border-radius: 12px; font-size: 10px; font-weight: 700;
      cursor: pointer; transition: all 0.15s; font-family: inherit; border: 1px solid;
    }
  `;
  document.head.appendChild(s);
}

// ── Constants ─────────────────────────────────────────────────────────────────
const FACILITY_TYPES = [
  { key: 'hospital',     label: 'Hospitals',   emoji: '🏥', color: '#10b981', osmTag: 'amenity=hospital' },
  { key: 'clinic',       label: 'Clinics',     emoji: '🩺', color: '#06b6d4', osmTag: 'amenity=clinic' },
  { key: 'pharmacy',     label: 'Pharmacy',    emoji: '💊', color: '#8b5cf6', osmTag: 'amenity=pharmacy' },
  { key: 'fire_station', label: 'Fire/Rescue', emoji: '🚒', color: '#ef4444', osmTag: 'amenity=fire_station' },
  { key: 'police',       label: 'Police',      emoji: '🚔', color: '#3b82f6', osmTag: 'amenity=police' },
  { key: 'shelter',      label: 'Shelters',    emoji: '🏠', color: '#f59e0b', osmTag: 'amenity=social_facility' },
];

const PRESETS = [
  { label: 'Guwahati',    lat: 26.1445, lon: 91.7362 },
  { label: 'Kedarnath',   lat: 30.7352, lon: 79.0669 },
  { label: 'Patna',       lat: 25.5941, lon: 85.1376 },
  { label: 'Mumbai',      lat: 19.0760, lon: 72.8777 },
  { label: 'Kerala',      lat: 10.5276, lon: 76.2144 },
  { label: 'Chennai',     lat: 13.0827, lon: 80.2707 },
  { label: 'Bhubaneswar', lat: 20.2961, lon: 85.8245 },
  { label: 'Kolkata',     lat: 22.5726, lon: 88.3639 },
];

// ── Haversine distance ────────────────────────────────────────────────────────
function haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function fmtKm(km) {
  if (km == null) return '—';
  if (km >= 10) return `${km.toFixed(1)} km`;
  if (km >= 1)  return `${km.toFixed(2)} km`;
  return `${(km * 1000).toFixed(0)} m`;
}

// ── Map helpers ───────────────────────────────────────────────────────────────
function MapFlyTo({ position, zoom = 13 }) {
  const map = useMap();
  useEffect(() => {
    if (position && !isNaN(position.lat) && !isNaN(position.lon)) {
      map.flyTo([position.lat, position.lon], zoom, { duration: 1.4 });
    }
  }, [position, zoom, map]);
  return null;
}

function MapSizeFixer() {
  const map = useMap();
  useEffect(() => {
    map.invalidateSize();
    const t1 = setTimeout(() => map.invalidateSize(), 100);
    const t2 = setTimeout(() => map.invalidateSize(), 400);
    const t3 = setTimeout(() => map.invalidateSize(), 800);
    const handleResize = () => map.invalidateSize();
    window.addEventListener('resize', handleResize);

    const container = map.getContainer();
    let observer;
    if (container && typeof ResizeObserver !== 'undefined') {
      observer = new ResizeObserver(() => {
        setTimeout(() => {
          map.invalidateSize();
        }, 50);
      });
      observer.observe(container);
    }

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      window.removeEventListener('resize', handleResize);
      if (observer) {
        observer.disconnect();
      }
    };
  }, [map]);
  return null;
}

function makePin(color, emoji, pulse = false) {
  return L.divIcon({
    className: '',
    html: `
      <div style="position:relative;width:38px;height:46px">
        ${pulse ? `<div style="
          position:absolute;top:-4px;left:-4px;
          width:46px;height:46px;border-radius:50%;
          background:${color};opacity:0.25;
          animation:nf-pulse 1.8s ease-out infinite
        "></div>` : ''}
        <div style="
          width:38px;height:38px;
          border-radius:50% 50% 50% 0;
          background:linear-gradient(135deg,${color},${color}bb);
          border:2.5px solid #fff;
          transform:rotate(-45deg);
          display:flex;align-items:center;justify-content:center;
          box-shadow:0 4px 14px rgba(0,0,0,0.45)
        ">
          <span style="transform:rotate(45deg);font-size:17px;line-height:1">${emoji}</span>
        </div>
      </div>`,
    iconSize: [38, 46],
    iconAnchor: [19, 46],
    popupAnchor: [0, -48],
  });
}

const USER_ICON = makePin('#f59e0b', '📍', true);

// ── Overpass query ────────────────────────────────────────────────────────────
async function queryOverpass(lat, lon, radiusM, activeTypes) {
  const tags = activeTypes.map(t => `node["${t.osmTag.split('=')[0]}"="${t.osmTag.split('=')[1]}"](around:${radiusM},${lat},${lon});`).join('\n');
  const query = `[out:json][timeout:25];(\n${tags}\n);out body;`;
  const res = await fetch('https://overpass-api.de/api/interpreter', {
    method: 'POST',
    body: `data=${encodeURIComponent(query)}`,
  });
  if (!res.ok) throw new Error(`Overpass API error (${res.status})`);
  const data = await res.json();
  return data.elements;
}

// Determine facility type from OSM tags
function detectType(tags) {
  const a = tags?.amenity;
  if (a === 'hospital')        return 'hospital';
  if (a === 'clinic')          return 'clinic';
  if (a === 'pharmacy')        return 'pharmacy';
  if (a === 'fire_station')    return 'fire_station';
  if (a === 'police')          return 'police';
  if (a === 'social_facility') return 'shelter';
  return 'hospital';
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function NearbyFacilities() {
  const { theme, t } = useSettings();
  const [userPos,      setUserPos]      = useState(null);     // { lat, lon, label }
  const [results,      setResults]      = useState([]);
  const [status,       setStatus]       = useState('idle');   // idle|loading|done|error
  const [errorMsg,     setErrorMsg]     = useState('');
  const [searchQuery,  setSearchQuery]  = useState('');
  const [gpsLoading,   setGpsLoading]   = useState(false);
  const [searchLoading,setSearchLoading]= useState(false);
  const [locError,     setLocError]     = useState('');
  const [radiusKm,     setRadiusKm]     = useState(10);
  const [activeTypes,  setActiveTypes]  = useState(FACILITY_TYPES);
  const [flyTarget,    setFlyTarget]    = useState(null);
  const [selected,     setSelected]     = useState(null);     // selected result id
  const inputRef = useRef(null);

  const [suggestions,       setSuggestions]       = useState([]);
  const [showSuggestions,   setShowSuggestions]   = useState(false);
  const [suggestionsLoading,setSuggestionsLoading]= useState(false);
  const [isTyping,          setIsTyping]          = useState(false);
  const suggestionsRef = useRef(null);

  const [evacRoutes, setEvacRoutes] = useState([]);
  const [routesLoading, setRoutesLoading] = useState(false);

  // ── Toggle facility type filter ───────────────────────────────
  const toggleType = useCallback((key) => {
    setActiveTypes(prev => {
      const has = prev.find(t => t.key === key);
      if (has && prev.length === 1) return prev; // keep at least one
      return has ? prev.filter(t => t.key !== key) : [...prev, FACILITY_TYPES.find(t => t.key === key)];
    });
  }, []);

  // ── Core search logic ─────────────────────────────────────────
  const doSearch = useCallback(async (lat, lon, label) => {
    if (isNaN(lat) || isNaN(lon)) {
      console.error('doSearch received NaN coordinates:', { lat, lon });
      setLocError('Invalid coordinates received.');
      return;
    }
    setUserPos({ lat, lon, label });
    setFlyTarget({ lat, lon });
    setResults([]);
    setSelected(null);
    setStatus('loading');
    setLocError('');
    setEvacRoutes([]);
    try {
      const elements = await queryOverpass(lat, lon, radiusKm * 1000, activeTypes);
      const mapped = elements
        .filter(el => el.lat && el.lon)
        .map(el => {
          const type = detectType(el.tags);
          const typeMeta = FACILITY_TYPES.find(t => t.key === type) || FACILITY_TYPES[0];
          const km = haversineKm(lat, lon, el.lat, el.lon);
          const name = el.tags?.name || el.tags?.['name:en'] || `Unnamed ${typeMeta.label}`;
          const addr = [
            el.tags?.['addr:street'],
            el.tags?.['addr:city'] || el.tags?.['addr:suburb'],
            el.tags?.['addr:state'],
          ].filter(Boolean).join(', ');
          return { id: el.id, lat: el.lat, lon: el.lon, name, type, typeMeta, km, addr, tags: el.tags };
        })
        .sort((a, b) => a.km - b.km)
        .slice(0, 50); // cap at 50

      setResults(mapped);
      setStatus('done');

      // Calculate evacuation routes to nearest hospital and police station
      setRoutesLoading(true);
      try {
        const nearestHosp = mapped.find(r => r.type === 'hospital') || mapped.find(r => r.type === 'clinic');
        const nearestPolice = mapped.find(r => r.type === 'police') || mapped.find(r => r.type === 'fire_station');
        
        const routePromises = [];
        if (nearestHosp) {
          routePromises.push(
            getRoute(lat, lon, nearestHosp.lat, nearestHosp.lon).then(route => ({
              type: 'hospital',
              title: nearestHosp.type === 'hospital' ? 'Nearest Hospital' : 'Nearest Clinic',
              facility: nearestHosp,
              route,
              color: theme === 'light' ? '#047857' : '#10b981'
            }))
          );
        }
        if (nearestPolice) {
          routePromises.push(
            getRoute(lat, lon, nearestPolice.lat, nearestPolice.lon).then(route => ({
              type: 'police',
              title: nearestPolice.type === 'police' ? 'Nearest Police Station' : 'Nearest Emergency Service',
              facility: nearestPolice,
              route,
              color: '#3b82f6'
            }))
          );
        }
        
        const routesData = await Promise.all(routePromises);
        setEvacRoutes(routesData);
      } catch (e) {
        console.error('Failed to calculate routes:', e);
      } finally {
        setRoutesLoading(false);
      }
    } catch (err) {
      setErrorMsg(err.message || 'Search failed.');
      setStatus('error');
    }
  }, [radiusKm, activeTypes, theme]);

  // ── GPS ──────────────────────────────────────────────────────
  const handleGPS = useCallback(() => {
    if (!navigator.geolocation) { setLocError('Geolocation not supported.'); return; }
    setGpsLoading(true);
    setLocError('');
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        // Reverse geocode to get actual place name
        let locationLabel = `📡 GPS (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`;
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`,
            { headers: { 'User-Agent': 'GeoShield-AI/1.0' } }
          );
          const data = await res.json();
          if (data && data.display_name) {
            locationLabel = '📡 ' + data.display_name.split(',').slice(0, 3).join(',');
          }
        } catch (e) {
          // Reverse geocode failed — use coordinate fallback
        }
        setGpsLoading(false);
        doSearch(latitude, longitude, locationLabel);
      },
      err => { setGpsLoading(false); setLocError(`GPS error: ${err.message}`); },
      { enableHighAccuracy: true, maximumAge: 0, timeout: 15000 }
    );
  }, [doSearch]);

  // ── Nominatim search ─────────────────────────────────────────
  const handleSearch = useCallback(async () => {
    const q = searchQuery.trim();
    if (!q) return;
    setSearchLoading(true);
    setLocError('');
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=1&countrycodes=in`,
        { headers: { 'User-Agent': 'TerraGuard-AI/1.0' } }
      );
      const data = await res.json();
      if (!data?.length) {
        setLocError('Location not found. Try a more specific name.');
        setSearchLoading(false);
        return;
      }
      const { lat, lon, display_name } = data[0];
      const label = display_name.split(',').slice(0, 2).join(', ');
      setSearchLoading(false);
      doSearch(parseFloat(lat), parseFloat(lon), label);
    } catch {
      setLocError('Search failed. Check your internet connection.');
      setSearchLoading(false);
    }
  }, [searchQuery, doSearch]);

  // Click outside hook
  useEffect(() => {
    function handleClickOutside(event) {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Debounced autocomplete search
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.length < 2 || !isTyping) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    const delayDebounceFn = setTimeout(async () => {
      setSuggestionsLoading(true);
      setShowSuggestions(true);
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchQuery)}&format=json&limit=5&countrycodes=in`,
          { headers: { 'User-Agent': 'TerraGuard-AI/1.0' } }
        );
        const data = await res.json();
        if (data) {
          setSuggestions(data);
        }
      } catch (err) {
        console.error('Error fetching suggestions:', err);
      } finally {
        setSuggestionsLoading(false);
      }
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, isTyping]);

  const handleSelectSuggestion = useCallback((sug) => {
    setIsTyping(false);
    if (!sug) return;
    const shortName = sug.display_name ? sug.display_name.split(',').slice(0, 2).join(', ') : 'Selected Location';
    setSearchQuery(shortName);
    setSuggestions([]);
    setShowSuggestions(false);
    
    const latVal = parseFloat(sug.lat || sug.latitude);
    const lonVal = parseFloat(sug.lon || sug.lng || sug.longitude);
    
    if (!isNaN(latVal) && !isNaN(lonVal)) {
      doSearch(latVal, lonVal, shortName);
    } else {
      console.error('Invalid suggestion coordinates:', sug);
      setLocError('Invalid location coordinates received.');
    }
  }, [doSearch]);

  const handleSearchClick = useCallback(() => {
    setIsTyping(false);
    setShowSuggestions(false);
    handleSearch();
  }, [handleSearch]);

  const isLoading = gpsLoading || searchLoading || status === 'loading';

  // ── Design tokens ────────────────────────────────────────────
  const C = theme === 'light' ? {
    bg:          '#f1f5f9',
    surface:     '#ffffff',
    surfaceAlt:  '#f8fafc',
    border:      'rgba(99,102,241,0.15)',
    borderLight: 'rgba(0,0,0,0.08)',
    accent:      '#4f46e5',
    accentGlow:  'rgba(99,102,241,0.1)',
    text:        '#0f172a',
    textMuted:   '#475569',
    textFaint:   '#94a3b8',
  } : {
    bg:          '#0f172a',
    surface:     '#1e293b',
    surfaceAlt:  '#162032',
    border:      'rgba(99,102,241,0.2)',
    borderLight: 'rgba(148,163,184,0.1)',
    accent:      '#6366f1',
    accentGlow:  'rgba(99,102,241,0.18)',
    text:        '#e2e8f0',
    textMuted:   '#94a3b8',
    textFaint:   '#475569',
  };
  const card = {
    background: C.surface, border: `1px solid ${C.borderLight}`,
    borderRadius: '14px', padding: '14px', color: C.text,
  };

  return (
    <div style={{ display: 'flex', height: '100%', flex: 1, width: '100%', gap: '14px', fontFamily: "'Inter', sans-serif", minHeight: '500px' }}>

      {/* ══ LEFT: Map ══ */}
      <div style={{
        flex: 1, borderRadius: '16px', overflow: 'hidden',
        border: `1px solid ${C.border}`,
        boxShadow: `0 0 0 1px ${C.accentGlow}, 0 8px 32px rgba(0,0,0,0.5)`,
        position: 'relative', minHeight: '400px', width: '100%',
      }}>
        {/* Map hint */}
        <div style={{
          position: 'absolute', bottom: 16, left: '50%', transform: 'translateX(-50%)',
          zIndex: 1000, background: 'rgba(15,23,42,0.82)', backdropFilter: 'blur(8px)',
          border: `1px solid ${C.border}`, borderRadius: '30px',
          padding: '6px 18px', fontSize: '11px', color: C.textMuted, pointerEvents: 'none',
          whiteSpace: 'nowrap',
        }}>
          {status === 'loading' ? 'Searching for facilities...' : t('clickMapRoutingHint')}
        </div>

        <MapContainer
          center={[22.5, 82.5]} zoom={5}
          style={{ height: '100%', width: '100%', position: 'absolute', inset: 0 }}
        >
          <TileLayer
            url={theme === 'dark' ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" : "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"}
            attribution='&copy; <a href="https://openstreetmap.org">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          />
          {flyTarget && <MapFlyTo position={flyTarget} zoom={radiusKm <= 5 ? 14 : radiusKm <= 15 ? 13 : 11} />}
          <MapSizeFixer />

          {/* User pin */}
          {userPos && (
            <Marker position={[userPos.lat, userPos.lon]} icon={USER_ICON} zIndexOffset={2000}>
              <Popup>
                <div style={{ fontFamily: 'Inter,sans-serif', fontSize: '13px' }}>
                  <strong>{t('yourLocationMarker')}</strong><br />
                  <span style={{ fontSize: '11px', color: '#64748b' }}>{userPos.label}</span>
                </div>
              </Popup>
            </Marker>
          )}

          {/* Evacuation Polylines */}
          {evacRoutes.map((er, idx) => (
            <Polyline
              key={`route-${er.type}-${idx}`}
              positions={er.route.coords}
              pathOptions={{
                color: er.color,
                weight: 6,
                opacity: 0.85,
                dashArray: er.route.isFallback ? '10, 10' : undefined
              }}
            >
              <Tooltip sticky>
                <div style={{ fontFamily: 'Inter,sans-serif', fontSize: '12px' }}>
                  <strong>{er.title}: {er.facility.name}</strong><br />
                  <span>Distance: {fmtKm(er.route.distanceM / 1000)}</span><br />
                  {er.route.durationSec ? <span>Time: {Math.ceil(er.route.durationSec / 60)} mins drive</span> : null}
                  {er.route.isFallback ? <span style={{ color: '#f59e0b' }}> (Direct line-of-sight path)</span> : null}
                </div>
              </Tooltip>
            </Polyline>
          ))}

          {/* Facility markers */}
          {results.map((r, idx) => {
            const icon = makePin(r.typeMeta.color, r.typeMeta.emoji, selected === r.id);
            return (
              <Marker
                key={r.id}
                position={[r.lat, r.lon]}
                icon={icon}
                zIndexOffset={selected === r.id ? 1500 : idx === 0 ? 1000 : 0}
                eventHandlers={{ click: () => setSelected(r.id) }}
              >
                <Tooltip direction="top" offset={[0, -46]}>
                  <span style={{ fontFamily: 'Inter,sans-serif', fontSize: '12px' }}>
                    {r.typeMeta.emoji} {r.name}
                  </span>
                </Tooltip>
                <Popup>
                  <div style={{ fontFamily: 'Inter,sans-serif', fontSize: '13px', minWidth: '200px' }}>
                    <div style={{ fontWeight: 700, marginBottom: '4px' }}>{r.name}</div>
                    <div style={{
                      display: 'inline-block', padding: '2px 8px', borderRadius: '8px',
                      background: r.typeMeta.color + '22', color: r.typeMeta.color,
                      fontSize: '10px', fontWeight: 700, textTransform: 'capitalize',
                      marginBottom: '6px',
                    }}>
                      {r.typeMeta.emoji} {r.typeMeta.label}
                    </div>
                    {r.addr && <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '6px' }}>📍 {r.addr}</div>}
                    <div style={{ fontSize: '11px', color: '#6366f1', fontWeight: 600, marginBottom: '8px' }}>
                      📏 {fmtKm(r.km)} away
                    </div>
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(r.name + (r.addr ? ', ' + r.addr : ''))}`}
                      target="_blank" rel="noreferrer"
                      className="nf-gmap-btn"
                    >
                      🗺️ Open in Google Maps
                    </a>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      </div>

      {/* ══ RIGHT: Sidebar ══ */}
      <div style={{
        width: '320px', display: 'flex', flexDirection: 'column',
        gap: '10px', overflowY: 'auto', overflowX: 'hidden', paddingRight: '2px',
      }}>

        {/* Header */}
        <div style={{
          ...card,
          background: `linear-gradient(135deg, ${C.surface}, rgba(99,102,241,0.14))`,
          border: `1px solid ${C.border}`, padding: '13px 16px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '11px' }}>
            <div style={{
              width: 38, height: 38, borderRadius: '11px',
              background: 'linear-gradient(135deg,#6366f1,#818cf8)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '19px', boxShadow: '0 4px 12px rgba(99,102,241,0.4)', flexShrink: 0,
            }}>🏥</div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '14px', color: C.text }}>Nearby Facilities</div>
              <div style={{ fontSize: '10px', color: C.textMuted }}>Hospitals · Clinics · Emergency Services</div>
            </div>
          </div>
        </div>

        {/* Search panel */}
        <div style={{ ...card }} className="nf-card">
          <div style={{ fontWeight: 700, fontSize: '12px', color: C.text, marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '14px' }}>📍</span> Set Your Location
          </div>

          {/* GPS Button */}
          <button
            className="nf-btn-primary"
            onClick={handleGPS}
            disabled={isLoading}
            style={{ width: '100%', marginBottom: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
          >
            {gpsLoading
              ? <><div className="nf-sm-spinner" style={{ borderTopColor: '#fff' }} /> Acquiring GPS…</>
              : <><span style={{ fontSize: '16px' }}>🎯</span> Use My Current Location</>
            }
          </button>

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
            <div style={{ flex: 1, height: 1, background: C.borderLight }} />
            <span style={{ fontSize: '10px', color: C.textFaint, fontWeight: 600, letterSpacing: '0.06em' }}>OR SEARCH</span>
            <div style={{ flex: 1, height: 1, background: C.borderLight }} />
          </div>

          {/* Search bar */}
          <div style={{ display: 'flex', gap: '7px', marginBottom: '10px' }}>
            <div style={{ flex: 1, position: 'relative' }} ref={suggestionsRef}>
              <input
                ref={inputRef}
                className="nf-search-input"
                style={{ width: '100%' }}
                placeholder="e.g. Guwahati, Patna, Mumbai…"
                value={searchQuery}
                onChange={e => {
                  setSearchQuery(e.target.value);
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
                disabled={isLoading}
              />

              {/* Autocomplete dropdown */}
              {showSuggestions && (
                <div className="suggestions-list" style={{ marginTop: '5px' }}>
                  {suggestionsLoading ? (
                    <div className="suggestions-loading">
                      <div className="nf-sm-spinner" />
                      <span>Searching locations...</span>
                    </div>
                  ) : suggestions.length > 0 ? (
                    suggestions.map((sug, idx) => (
                      <button
                        type="button"
                        key={sug.place_id || idx}
                        className="suggestion-item"
                        onClick={e => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleSelectSuggestion(sug);
                        }}
                        style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', border: 'none' }}
                      >
                        <span style={{ fontSize: '12px' }}>📍</span>
                        <span className="suggestion-text">{sug.display_name}</span>
                      </button>
                    ))
                  ) : (
                    searchQuery.trim().length >= 2 && (
                      <div className="suggestions-no-results">No locations found</div>
                    )
                  )}
                </div>
              )}
            </div>
            <button
              className="nf-btn-primary"
              onClick={handleSearchClick}
              disabled={isLoading || !searchQuery.trim()}
              style={{ padding: '10px 14px', fontSize: '15px' }}
            >
              {searchLoading ? <div className="nf-sm-spinner" /> : '🔍'}
            </button>
          </div>

          {/* Presets */}
          <div style={{ marginBottom: '10px' }}>
            <div style={{ fontSize: '10px', color: C.textFaint, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>
              Flood-Prone Cities
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
              {PRESETS.map(p => (
                <button
                  key={p.label}
                  className="nf-chip"
                  disabled={isLoading}
                  onClick={() => { setSearchQuery(p.label); doSearch(p.lat, p.lon, p.label); }}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Radius selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: locError ? '10px' : 0 }}>
            <span style={{ fontSize: '11px', color: C.textMuted, fontWeight: 600 }}>Search radius:</span>
            <select
              className="nf-radius-select"
              value={radiusKm}
              onChange={e => setRadiusKm(Number(e.target.value))}
              disabled={isLoading}
            >
              {[2, 5, 10, 20, 50].map(r => (
                <option key={r} value={r}>{r} km</option>
              ))}
            </select>
          </div>

          {/* Error */}
          {locError && (
            <div style={{
              marginTop: '10px', padding: '8px 10px', borderRadius: '8px',
              background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)',
              fontSize: '11px', color: '#fca5a5', lineHeight: 1.5,
            }}>⚠️ {locError}</div>
          )}
        </div>

        {/* Facility type filters */}
        <div style={{ ...card, padding: '12px 14px' }} className="nf-card">
          <div style={{ fontSize: '10px', color: C.textFaint, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>
            Filter by Type
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {FACILITY_TYPES.map(t => {
              const active = activeTypes.find(a => a.key === t.key);
              return (
                <button
                  key={t.key}
                  className="nf-type-chip"
                  onClick={() => toggleType(t.key)}
                  disabled={isLoading}
                  style={{
                    background:   active ? t.color + '20' : 'transparent',
                    borderColor:  active ? t.color + '60' : C.borderLight,
                    color:        active ? t.color        : C.textMuted,
                  }}
                >
                  {t.emoji} {t.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── LOADING ── */}
        {status === 'loading' && (
          <div style={{ ...card, textAlign: 'center', padding: '30px 16px' }} className="nf-card">
            <div className="nf-spinner" />
            <p style={{ margin: 0, fontWeight: 700, fontSize: '13px', color: C.text }}>
              Finding nearby facilities…
            </p>
            <p style={{ margin: '6px 0 0', fontSize: '11px', color: C.textMuted, lineHeight: 1.6 }}>
              Querying OpenStreetMap data<br />within {radiusKm} km radius
            </p>
            {userPos && (
              <div style={{
                marginTop: '12px', padding: '7px 10px', borderRadius: '8px',
                background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)',
                fontSize: '11px', color: theme === 'light' ? '#92400e' : '#fcd34d',
              }}>📍 {userPos.label}</div>
            )}
          </div>
        )}

        {/* ── ERROR ── */}
        {status === 'error' && (
          <div style={{ ...card, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.28)' }} className="nf-card">
            <p style={{ margin: '0 0 6px', fontWeight: 700, fontSize: '13px', color: '#fca5a5' }}>⚠️ Search Failed</p>
            <p style={{ margin: 0, fontSize: '12px', color: '#f87171', lineHeight: 1.6 }}>{errorMsg}</p>
            <button
              onClick={() => setStatus('idle')}
              style={{
                marginTop: '10px', width: '100%', padding: '8px', fontSize: '12px',
                border: '1px solid rgba(239,68,68,0.3)', borderRadius: '8px',
                background: 'rgba(239,68,68,0.1)', cursor: 'pointer', color: '#fca5a5',
                fontWeight: 600, fontFamily: 'inherit',
              }}
            >↩ Try Again</button>
          </div>
        )}

        {/* ── DONE: Results ── */}
        {status === 'done' && (
          <>
            {/* Location banner */}
            <div style={{
              ...card, padding: '10px 14px',
              background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.22)',
            }} className="nf-card">
              <div style={{ fontSize: '9px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.07em', color: theme === 'light' ? '#b45309' : '#fbbf24', marginBottom: '2px' }}>
                Searching Near
              </div>
              <div style={{ fontSize: '13px', fontWeight: 600, color: theme === 'light' ? '#78350f' : '#fde68a' }}>{userPos?.label}</div>
              <div style={{ fontSize: '10px', color: theme === 'light' ? '#92400e' : '#fcd34d', marginTop: '2px' }}>
                {userPos?.lat.toFixed(4)}°N, {userPos?.lon.toFixed(4)}°E · {radiusKm} km radius
              </div>
            </div>

            {/* Evacuation Routes Summary Card */}
            {routesLoading ? (
              <div style={{ ...card, padding: '14px', textAlign: 'center' }} className="nf-card">
                <div className="nf-spinner" style={{ margin: '0 auto 12px', width: 24, height: 24 }} />
                <div style={{ fontSize: '12px', fontWeight: 700, color: C.text }}>Calculating Evacuation Routes...</div>
                <div style={{ fontSize: '10px', color: C.textMuted }}>Finding safest path to nearest Hospital & Police station</div>
              </div>
            ) : evacRoutes.length > 0 ? (
              <div style={{ ...card, padding: '14px', background: theme === 'light' ? 'linear-gradient(135deg, #f8fafc, #e2e8f0)' : 'linear-gradient(135deg, #1e293b, #0f172a)', border: '1px solid rgba(16, 185, 129, 0.3)' }} className="nf-card">
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                  <span style={{ fontSize: '22px' }}>🚨</span>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 800, color: theme === 'light' ? '#047857' : '#10b981' }}>Evacuation Navigation</div>
                    <div style={{ fontSize: '10px', color: C.textMuted }}>Safest emergency routes plotted on map</div>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {evacRoutes.map((er, idx) => (
                    <div
                      key={`evac-card-${idx}`}
                      style={{
                        padding: '12px',
                        borderRadius: '12px',
                        background: theme === 'light' ? 'rgba(0,0,0,0.02)' : 'rgba(255,255,255,0.04)',
                        border: `1px solid ${er.color}44`,
                        borderLeft: `4px solid ${er.color}`,
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                      }}
                      onClick={() => {
                        setSelected(er.facility.id);
                        setFlyTarget({ lat: er.facility.lat, lon: er.facility.lon });
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                        <span style={{ fontSize: '11px', fontWeight: 700, color: er.color }}>
                          {er.facility.typeMeta.emoji} {er.title}
                        </span>
                        <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-main)', background: `${er.color}22`, padding: '2px 8px', borderRadius: '12px' }}>
                          {er.route.durationSec ? `${Math.ceil(er.route.durationSec / 60)} mins` : 'Direct'}
                        </span>
                      </div>
                      <div style={{ fontSize: '12px', fontWeight: 700, color: C.text, marginBottom: '6px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {er.facility.name}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '10px', color: C.textMuted }}>
                        <span>📏 {fmtKm(er.route.distanceM / 1000)} away {er.route.isFallback ? '(Direct)' : '(Drive)'}</span>
                        <span style={{ color: er.color, fontWeight: 600 }}>🔍 Focus Map</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {/* Results list */}
            <div style={{ ...card, padding: 0, overflow: 'hidden' }} className="nf-card">
              {/* List header */}
              <div style={{
                padding: '11px 14px', borderBottom: `1px solid ${C.borderLight}`,
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}>
                <span style={{ fontWeight: 700, fontSize: '12px', color: C.text }}>
                  🏥 Nearby Facilities
                </span>
                <span style={{
                  fontSize: '10px', color: C.accent, background: C.accentGlow,
                  padding: '2px 9px', borderRadius: '20px', fontWeight: 600,
                }}>
                  {results.length} found
                </span>
              </div>

              {results.length === 0 ? (
                <div style={{ padding: '24px 16px', textAlign: 'center', color: C.textMuted, fontSize: '12px' }}>
                  <div style={{ fontSize: '28px', marginBottom: '8px' }}>🔍</div>
                  No facilities found within {radiusKm} km.<br />
                  <span style={{ color: C.textFaint }}>Try increasing the search radius or changing filters.</span>
                </div>
              ) : (
                <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
                  {results.map((r, idx) => (
                    <div
                      key={r.id}
                      className="nf-result-row"
                      onClick={() => {
                        setSelected(r.id);
                        setFlyTarget({ lat: r.lat, lon: r.lon });
                      }}
                      style={{
                        padding: '11px 14px',
                        borderBottom: idx < results.length - 1 ? `1px solid ${C.borderLight}` : 'none',
                        background: selected === r.id ? `${r.typeMeta.color}12` : 'transparent',
                        display: 'flex', gap: '10px', alignItems: 'flex-start',
                        cursor: 'pointer',
                      }}
                    >
                      {/* Rank badge */}
                      <div style={{
                        width: 24, height: 24, borderRadius: '50%', flexShrink: 0,
                        background: idx === 0 ? r.typeMeta.color + '25' : C.accentGlow,
                        border: `1.5px solid ${idx === 0 ? r.typeMeta.color : C.border}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '10px', fontWeight: 800,
                        color: idx === 0 ? r.typeMeta.color : C.textMuted,
                      }}>{idx + 1}</div>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        {/* Name */}
                        <div style={{
                          fontSize: '11px', fontWeight: 700,
                          color: selected === r.id ? '#e2e8f0' : C.text,
                          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                          marginBottom: '2px',
                        }}>
                          {r.typeMeta.emoji} {r.name}
                        </div>

                        {/* Type + address */}
                        <div style={{
                          fontSize: '10px', color: r.typeMeta.color, marginBottom: '4px',
                          fontWeight: 600,
                        }}>
                          {r.typeMeta.label}
                          {r.addr && <span style={{ color: C.textFaint, fontWeight: 400 }}> · {r.addr}</span>}
                        </div>

                        {/* Distance + Google Maps button */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '7px', flexWrap: 'wrap' }}>
                          <span style={{
                            fontSize: '10px', color: C.textMuted,
                            background: 'rgba(148,163,184,0.08)', padding: '2px 7px',
                            borderRadius: '5px', fontWeight: 600,
                          }}>📏 {fmtKm(r.km)}</span>
                          <a
                            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(r.name + (r.addr ? ' ' + r.addr : '') + ' India')}`}
                            target="_blank"
                            rel="noreferrer"
                            className="nf-gmap-btn"
                            onClick={e => e.stopPropagation()}
                          >
                            🗺️ Google Maps
                          </a>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Powered by footer */}
            <div style={{
              fontSize: '10px', color: C.textFaint, textAlign: 'center',
              padding: '6px', lineHeight: 1.6,
            }}>
              Data from <a href="https://www.openstreetmap.org" target="_blank" rel="noreferrer" style={{ color: C.accent }}>OpenStreetMap</a> via Overpass API · No API key required
            </div>
          </>
        )}
      </div>
    </div>
  );
}
