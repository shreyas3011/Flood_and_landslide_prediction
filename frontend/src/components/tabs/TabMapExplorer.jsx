import React, { useState, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import axios from 'axios';
import { MapPin } from 'lucide-react';
import { findTopNSafeZones } from '../../services/orsService';
import { SAFE_ZONES } from '../../data/safeZones';
import { makeSafeZoneIcon, fmtDist, fmtTime } from '../../utils/mapUtils';
import PredictionResult from '../ui/PredictionResult';
import NearestSafeZonesPanel from '../ui/NearestSafeZonesPanel';

const API_BASE = 'https://flood-and-landslide-prediction.onrender.com';

async function fetchPrediction(lat, lon) {
  const response = await axios.post(`${API_BASE}/predict`, { lat, lon });
  return response.data;
}

function LocationMarker({ position, setPosition, onLocationSelect }) {
  useMapEvents({
    click(e) {
      setPosition(e.latlng);
      onLocationSelect(e.latlng.lat, e.latlng.lng);
    },
  });
  return position === null ? null : <Marker position={position} />;
}

export default function TabMapExplorer() {
  const [position, setPosition] = useState(null);
  const [loading, setLoading] = useState(false);
  const [prediction, setPrediction] = useState(null);
  const [error, setError] = useState(null);
  const [nearestZones, setNearestZones] = useState([]);
  const [zonesLoading, setZonesLoading] = useState(false);

  const handleLocationSelect = useCallback(async (lat, lon) => {
    setLoading(true);
    setError(null);
    setNearestZones([]);
    try {
      const data = await fetchPrediction(lat, lon);
      setPrediction(data);
      // Fire nearest zones lookup in background (non-blocking)
      setZonesLoading(true);
      findTopNSafeZones(lat, lon, SAFE_ZONES, 3)
        .then(zones => { setNearestZones(zones); setZonesLoading(false); })
        .catch(() => setZonesLoading(false));
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to fetch predictions');
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <div className="flex flex-col lg:flex-row gap-4 h-full min-w-0">
      {/* Sidebar */}
      <div className="w-full lg:w-72 xl:w-80 lg:flex-shrink-0 flex flex-col gap-3 overflow-y-auto pr-1 pb-4 custom-scrollbar">
        <div className="glass p-3 rounded-2xl border border-white/5 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0">
            <MapPin size={18} className="text-blue-400" />
          </div>
          <div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Selected Coordinates</div>
            <div className="text-sm font-semibold text-slate-200">
              {position ? `${position.lat.toFixed(4)}, ${position.lng.toFixed(4)}` : 'Click anywhere on the map'}
            </div>
          </div>
        </div>

        <div className="glass p-4 rounded-2xl border border-white/5 shadow-sm">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Historical Case Studies</div>
          <div className="flex flex-col gap-2">
            {[
              { name: 'Kedarnath, Himalayas', desc: 'Extreme Landslide Risk Zone', lat: 30.74, lon: 79.07 },
              { name: 'Kerala, India', desc: 'High Flood & Landslide Zone', lat: 9.55, lon: 76.62 },
              { name: 'Sahara Desert', desc: 'Zero Risk Reference', lat: 25.00, lon: 10.00 },
              { name: 'Mumbai, India', desc: 'High Urban Flood Zone', lat: 19.07, lon: 72.87 },
            ].map(loc => (
              <button
                key={loc.name}
                className="flex flex-col items-start p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/20 transition-all text-left group"
                onClick={() => { setPosition({ lat: loc.lat, lng: loc.lon }); handleLocationSelect(loc.lat, loc.lon); }}
              >
                <div className="text-xs font-semibold text-slate-200 group-hover:text-blue-300 transition-colors">{loc.name}</div>
                <div className="text-[10px] text-slate-400">{loc.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium">
            {error}
          </div>
        )}

        {loading ? (
          <div className="glass p-8 rounded-2xl border border-white/5 flex flex-col items-center justify-center text-center">
            <div className="w-8 h-8 rounded-full border-2 border-blue-500 border-t-transparent animate-spin mb-4" />
            <div className="text-sm font-medium text-slate-300">Analyzing satellite telemetry...</div>
            <div className="text-[10px] text-slate-500 mt-1">Running ML pipelines</div>
          </div>
        ) : prediction ? (
          <>
            <PredictionResult prediction={prediction} />
            <NearestSafeZonesPanel zones={nearestZones} loading={zonesLoading} />
          </>
        ) : (
          <div className="glass p-10 rounded-2xl border border-white/5 flex flex-col items-center justify-center text-center opacity-60">
            <MapPin size={32} className="text-slate-500 mb-3" />
            <p className="text-sm font-medium text-slate-400">Select a location on the map to run the AI prediction models.</p>
          </div>
        )}
      </div>

      {/* Map */}
      <div className="flex-1 min-w-0 glass rounded-2xl border border-white/5 overflow-hidden shadow-2xl relative h-[300px] lg:h-full min-h-[300px]">
        <MapContainer center={[20.5937, 78.9629]} zoom={5} style={{ height: '100%', width: '100%', position: 'absolute', inset: 0 }}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          />
          <LocationMarker position={position} setPosition={setPosition} onLocationSelect={handleLocationSelect} />
          
          {/* Nearest safe zone markers on the map */}
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
                    {item.zone.type.replace('_', ' ')} · {item.zone.state}
                  </span>
                  <div className="flex gap-2 mt-2 pt-2 border-t border-slate-200">
                    <span className="font-bold text-indigo-600">📍 {fmtDist(item.distanceM)}</span>
                    <span className="font-bold text-indigo-600">🕒 {fmtTime(item.durationSec)}</span>
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </div>
  );
}
