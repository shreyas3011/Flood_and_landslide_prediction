import React, { useState, useCallback, useEffect } from 'react';
import { Layers, Droplets, Mountain, MapPin } from 'lucide-react';
import axios from 'axios';
import { MapContainer, TileLayer, CircleMarker, Popup, useMapEvents, useMap } from 'react-leaflet';
import { getRiskColor, getRiskLabel } from '../../utils/riskUtils';
import { useSettings } from '../../context/SettingsContext';

const API_BASE = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'http://127.0.0.1:8000'
  : 'https://flood-and-landslide-prediction.onrender.com';

async function fetchPrediction(lat, lon) {
  const response = await axios.post(`${API_BASE}/predict`, { lat, lon });
  return response.data;
}

const ALL_RISK_POINTS = [
  { lat: 28.20, lon: 94.41, label: 'Arunachal Pradesh (E)' },
  { lat: 27.10, lon: 93.62, label: 'Arunachal Pradesh (W)' },
  { lat: 26.14, lon: 91.74, label: 'Guwahati, Assam' },
  { lat: 26.70, lon: 94.20, label: 'Upper Assam' },
  { lat: 24.52, lon: 92.80, label: 'Silchar, Assam' },
  { lat: 25.57, lon: 91.88, label: 'Shillong, Meghalaya' },
  { lat: 25.47, lon: 90.36, label: 'West Meghalaya' },
  { lat: 24.80, lon: 93.94, label: 'Imphal, Manipur' },
  { lat: 23.73, lon: 92.72, label: 'Aizawl, Mizoram' },
  { lat: 25.67, lon: 94.12, label: 'Kohima, Nagaland' },
  { lat: 23.94, lon: 91.98, label: 'Agartala, Tripura' },
  { lat: 30.74, lon: 79.07, label: 'Kedarnath, Uttarakhand' },
  { lat: 30.09, lon: 78.29, label: 'Rishikesh, Uttarakhand' },
  { lat: 29.38, lon: 79.45, label: 'Almora, Uttarakhand' },
  { lat: 32.22, lon: 77.19, label: 'Kullu, Himachal Pradesh' },
  { lat: 31.63, lon: 77.11, label: 'Shimla, Himachal Pradesh' },
  { lat: 32.73, lon: 74.86, label: 'Jammu Foothills' },
  { lat: 34.08, lon: 74.80, label: 'Kashmir Valley' },
  { lat: 27.03, lon: 88.26, label: 'Darjeeling, WB' },
  { lat: 27.33, lon: 88.61, label: 'Gangtok, Sikkim' },
  { lat: 27.59, lon: 88.51, label: 'North Sikkim' },
  { lat: 25.60, lon: 85.14, label: 'Patna, Bihar' },
  { lat: 26.12, lon: 87.47, label: 'Supaul, Bihar (Kosi)' },
  { lat: 26.83, lon: 84.50, label: 'Gopalganj, Bihar' },
  { lat: 25.45, lon: 82.00, label: 'Varanasi, UP' },
  { lat: 26.85, lon: 80.95, label: 'Lucknow, UP' },
  { lat: 27.57, lon: 81.60, label: 'Bahraich, UP' },
  { lat: 22.57, lon: 88.36, label: 'Kolkata, WB' },
  { lat: 24.07, lon: 88.27, label: 'Murshidabad, WB' },
  { lat: 20.46, lon: 85.88, label: 'Bhubaneswar, Odisha' },
  { lat: 19.32, lon: 84.79, label: 'South Odisha Coast' },
  { lat: 17.69, lon: 83.22, label: 'Visakhapatnam, AP' },
  { lat: 16.51, lon: 81.75, label: 'Konaseema, AP' },
  { lat: 17.38, lon: 78.49, label: 'Hyderabad Basin' },
  { lat: 16.20, lon: 77.36, label: 'Raichur, Karnataka' },
  { lat: 9.55,  lon: 76.62, label: 'Kottayam, Kerala' },
  { lat: 10.07, lon: 77.06, label: 'Munnar, Kerala' },
  { lat: 11.35, lon: 76.18, label: 'Ooty, Tamil Nadu' },
  { lat: 12.30, lon: 75.78, label: 'Coorg, Karnataka' },
  { lat: 15.45, lon: 74.99, label: 'N. Goa-Karnataka Ghats' },
  { lat: 19.07, lon: 72.87, label: 'Mumbai Coast' },
  { lat: 17.30, lon: 73.31, label: 'Ratnagiri, Konkan' },
  { lat: 18.52, lon: 73.86, label: 'Pune, Maharashtra' },
  { lat: 21.10, lon: 81.63, label: 'Raipur, Chhattisgarh' },
  { lat: 22.72, lon: 82.70, label: 'Bilaspur, CG' },
  { lat: 13.08, lon: 80.27, label: 'Chennai Coast' },
  { lat: 11.00, lon: 77.97, label: 'Thanjavur Delta' },
  { lat: 24.58, lon: 73.68, label: 'Udaipur, Rajasthan' },
  { lat: 26.92, lon: 75.82, label: 'Jaipur, Rajasthan' },
  { lat: 28.61, lon: 77.20, label: 'Delhi (Yamuna)' },
];

const FLOOD_THRESHOLD = 30;
const LANDSLIDE_THRESHOLD = 30;

function ClickCaptureLayer({ onMapClick }) {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });
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
      window.removeEventListener('resize', handleResize);
      if (observer) observer.disconnect();
    };
  }, [map]);
  return null;
}

export default function TabDualMaps() {
  const { theme, t } = useSettings();
  const [pointsData, setPointsData] = useState([]);
  const [loadingAll, setLoadingAll] = useState(false);
  const [progress, setProgress] = useState(0);
  const [fetched, setFetched] = useState(false);
  const [error, setError] = useState(null);

  // Click scan states
  const [clickPoints, setClickPoints] = useState([]);
  const [clickLoading, setClickLoading] = useState(false);
  const [lastClick, setLastClick] = useState(null);

  const loadAllPoints = async () => {
    setLoadingAll(true);
    setProgress(0);
    setError(null);
    setPointsData([]);
    const results = [];
    
    // Chunk points to scan sequentially
    for (let i = 0; i < ALL_RISK_POINTS.length; i++) {
      const pt = ALL_RISK_POINTS[i];
      try {
        const pred = await fetchPrediction(pt.lat, pt.lon);
        results.push({ ...pt, id: `preset-${i}`, prediction: pred });
      } catch (err) {
        console.warn(`Scan failed for ${pt.label}:`, err);
      }
      setProgress(Math.round(((i + 1) / ALL_RISK_POINTS.length) * 100));
    }
    
    setPointsData(results);
    setFetched(true);
    setLoadingAll(false);
  };

  const handleMapClick = async (lat, lon) => {
    setClickLoading(true);
    setError(null);
    try {
      const label = `${lat.toFixed(4)}°N, ${lon.toFixed(4)}°E`;
      const pred = await fetchPrediction(lat, lon);
      const newPt = { lat, lon, label, id: `click-${Date.now()}`, prediction: pred };
      setClickPoints(prev => [...prev, newPt]);
      setLastClick(newPt);
    } catch (err) {
      setError(err.response?.data?.detail || 'Map coordinate scan failed');
    } finally {
      setClickLoading(false);
    }
  };

  // Filter lists based on thresholds
  const allAvailable = [...pointsData, ...clickPoints];
  const floodVisible = allAvailable.filter(pt => pt.prediction.predictions.flood_risk_pct >= FLOOD_THRESHOLD);
  const lsVisible = allAvailable.filter(pt => pt.prediction.predictions.landslide_risk_pct >= LANDSLIDE_THRESHOLD);

  return (
    <div className="flex flex-col gap-4 flex-1 h-full min-h-[500px]">
      {/* Controls */}
      <div className="glass p-4 rounded-2xl border border-slate-200/10 dark:border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-lg shrink-0">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center shrink-0 border border-indigo-500/30">
            <Layers size={24} className="text-indigo-500 dark:text-indigo-400" />
          </div>
          <div>
            <h2 className="text-lg font-extrabold text-slate-800 dark:text-slate-900 dark:text-slate-100 tracking-tight">Risk Heat Map — India</h2>
            <p className="text-[11px] text-slate-500 dark:text-slate-600 dark:text-slate-400 uppercase tracking-widest mt-0.5">{t('clickMapHint')}</p>
          </div>
        </div>

        <div className="flex flex-col md:flex-row items-center gap-4">
          <div className="flex items-center gap-3 text-xs font-semibold">
            <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span><span className="text-slate-600 dark:text-slate-750 dark:text-slate-300">30–60% Mod</span></div>
            <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-red-500"></span><span className="text-slate-600 dark:text-slate-750 dark:text-slate-300">60–100% High</span></div>
          </div>
          <button
            className={`px-6 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 transition-all duration-300 ${loadingAll ? 'bg-slate-300 dark:bg-slate-800 text-slate-600 dark:text-slate-400 cursor-not-allowed border border-slate-200/10 dark:border-white/5' : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-lg shadow-blue-500/20'}`}
            onClick={loadAllPoints}
            disabled={loadingAll}
          >
            {loadingAll ? (
              <><div className="w-4 h-4 rounded-full border-2 border-slate-400 border-t-transparent animate-spin" /> {t('scanningSubcontinent')} {progress}%</>
            ) : fetched ? t('reloadRiskZones') : t('loadRiskZones')}
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-sm font-medium shrink-0">
          {error}
        </div>
      )}

      {!fetched && !loadingAll && (
        <div className="glass flex-1 rounded-2xl border border-slate-200/10 dark:border-white/5 flex flex-col items-center justify-center text-center opacity-60 min-h-[400px]">
          <Layers size={48} className="text-slate-600 dark:text-slate-400 mb-4" />
          <h3 className="text-lg font-bold text-slate-700 dark:text-slate-750 dark:text-slate-300 mb-2">{t('mapsUninitialized')}</h3>
          <p className="text-sm text-slate-500 dark:text-slate-600 dark:text-slate-400 max-w-md">
            Click <strong>"{t('loadRiskZones')}"</strong> to fetch predictions for <strong>{ALL_RISK_POINTS.length} locations</strong>.
            Only locations with ≥30% risk will be displayed.
          </p>
        </div>
      )}

      {loadingAll && (
        <div className="glass flex-1 rounded-2xl border border-slate-200/10 dark:border-white/5 flex flex-col items-center justify-center text-center min-h-[400px]">
          <div className="w-12 h-12 rounded-full border-4 border-blue-500 border-t-transparent animate-spin mb-4" />
          <h3 className="text-lg font-bold text-blue-600 dark:text-blue-400 mb-1">{t('scanningSubcontinent')} {progress}%</h3>
          <p className="text-xs text-slate-500 dark:text-slate-600 dark:text-slate-400">{t('processingBatch')} {Math.round(progress * ALL_RISK_POINTS.length / 100)} of {ALL_RISK_POINTS.length}</p>
        </div>
      )}

      {/* Dual Maps Grid */}
      {(fetched || clickPoints.length > 0) && !loadingAll && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 min-h-[450px]">
          {/* Flood Map */}
          <div className="relative rounded-[2rem] border border-blue-500/20 overflow-hidden shadow-lg w-full h-[350px] lg:h-[calc(100vh-220px)] lg:min-h-[450px] lg:max-h-[750px]">
            <MapContainer center={[22, 82]} zoom={5} style={{ height: '100%', width: '100%', position: 'absolute', inset: 0 }}>
              <TileLayer
                attribution='&copy; <a href="https://carto.com/attributions">CARTO</a>'
                url={theme === 'dark' 
                  ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" 
                  : "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                }
              />
              <ClickCaptureLayer onMapClick={handleMapClick} />
              <MapSizeFixer />
              {floodVisible.map((pt, i) => (
                <CircleMarker
                  key={`flood-${pt.id ?? i}`}
                  center={[pt.lat, pt.lon]}
                  radius={12}
                  pathOptions={{
                    fillColor: getRiskColor(pt.prediction.predictions.flood_risk_pct),
                    color: getRiskColor(pt.prediction.predictions.flood_risk_pct),
                    fillOpacity: 0.6,
                    weight: 2,
                  }}
                >
                  <Popup className="premium-popup">
                    <div className="font-sans text-xs min-w-[140px]">
                      <strong className="block text-sm mb-1 text-slate-800 dark:text-slate-800 dark:text-slate-200">{pt.label}</strong>
                      <div className="flex justify-between items-center bg-blue-500/10 p-1.5 rounded text-blue-600 dark:text-blue-400 mb-1">
                        <span className="font-semibold flex items-center gap-1"><Droplets size={12}/> Flood</span>
                        <span className="font-bold text-sm">{getRiskLabel(pt.prediction.predictions.flood_risk_pct)}</span>
                      </div>
                      <span className="text-[10px] text-slate-500">{getRiskLabel(pt.prediction.predictions.flood_risk_pct)}</span>
                    </div>
                  </Popup>
                </CircleMarker>
              ))}
            </MapContainer>
            <div className="absolute top-5 left-5 z-[1000] bg-white/95 dark:bg-slate-900/90 backdrop-blur-xl px-5 py-2.5 rounded-2xl border border-blue-500/40 text-sm font-extrabold text-blue-600 dark:text-blue-400 flex items-center gap-3 shadow-lg">
              <div><Droplets size={18} /></div>
              {t('floodRiskOverlay')}
              <span className="bg-blue-500/10 text-[10px] px-2.5 py-1 rounded-full text-blue-600 dark:text-blue-300 ml-2 border border-blue-500/20">
                {floodVisible.length} {t('zonesText')}
              </span>
            </div>
            {clickLoading && <div className="absolute inset-0 bg-slate-950/40 z-[999] backdrop-blur-sm flex items-center justify-center"><div className="w-12 h-12 rounded-full border-4 border-blue-500 border-t-transparent animate-spin" /></div>}
          </div>

          {/* Landslide Map */}
          <div className="relative rounded-[2rem] border border-amber-500/20 overflow-hidden shadow-lg w-full h-[350px] lg:h-[calc(100vh-220px)] lg:min-h-[450px] lg:max-h-[750px]">
            <MapContainer center={[22, 82]} zoom={5} style={{ height: '100%', width: '100%', position: 'absolute', inset: 0 }}>
              <TileLayer
                attribution='&copy; <a href="https://carto.com/attributions">CARTO</a>'
                url={theme === 'dark' 
                  ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" 
                  : "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                }
              />
              <ClickCaptureLayer onMapClick={handleMapClick} />
              <MapSizeFixer />
              {lsVisible.map((pt, i) => (
                <CircleMarker
                  key={`ls-${pt.id ?? i}`}
                  center={[pt.lat, pt.lon]}
                  radius={12}
                  pathOptions={{
                    fillColor: getRiskColor(pt.prediction.predictions.landslide_risk_pct),
                    color: getRiskColor(pt.prediction.predictions.landslide_risk_pct),
                    fillOpacity: 0.6,
                    weight: 2,
                  }}
                >
                  <Popup className="premium-popup">
                    <div className="font-sans text-xs min-w-[140px]">
                      <strong className="block text-sm mb-1 text-slate-800 dark:text-slate-800 dark:text-slate-200">{pt.label}</strong>
                      <div className="flex justify-between items-center bg-amber-500/10 p-1.5 rounded text-amber-600 dark:text-amber-500 mb-1">
                        <span className="font-semibold flex items-center gap-1"><Mountain size={12}/> Landslide</span>
                        <span className="font-bold text-sm">{getRiskLabel(pt.prediction.predictions.landslide_risk_pct)}</span>
                      </div>
                      <span className="text-[10px] text-slate-500">{getRiskLabel(pt.prediction.predictions.landslide_risk_pct)}</span>
                    </div>
                  </Popup>
                </CircleMarker>
              ))}
            </MapContainer>
            <div className="absolute top-5 left-5 z-[1000] bg-white/95 dark:bg-slate-900/90 backdrop-blur-xl px-5 py-2.5 rounded-2xl border border-amber-500/40 text-sm font-extrabold text-amber-600 dark:text-amber-500 flex items-center gap-3 shadow-lg">
              <div><Mountain size={18} /></div>
              {t('landslideRiskOverlay')}
              <span className="bg-amber-500/10 text-[10px] px-2.5 py-1 rounded-full text-amber-600 dark:text-amber-400 ml-2 border border-amber-500/20">
                {lsVisible.length} {t('zonesText')}
              </span>
            </div>
            {clickLoading && <div className="absolute inset-0 bg-slate-950/40 z-[999] backdrop-blur-sm flex items-center justify-center"><div className="w-12 h-12 rounded-full border-4 border-amber-500 border-t-transparent animate-spin" /></div>}
          </div>
        </div>
      )}

      {lastClick?.prediction && (
        <div className="glass px-4 py-3 rounded-xl border border-slate-200/10 dark:border-white/10 flex flex-col sm:flex-row sm:items-center gap-3 shadow-lg shrink-0 animate-in slide-in-from-bottom-4 duration-300">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-800 dark:text-slate-800 dark:text-slate-200">
            <MapPin size={16} className="text-indigo-500 dark:text-indigo-400" />
            {t('clickResultLabel')}: {lastClick.label}
          </div>
          <div className="flex items-center gap-2 sm:ml-auto flex-wrap">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20">
              <Droplets size={14} className="text-blue-500 dark:text-blue-400" />
              <span className="text-xs font-semibold text-blue-600 dark:text-blue-300">{t('floodRiskLabel')}: <span className="font-bold text-blue-600 dark:text-blue-400">{getRiskLabel(lastClick.prediction.predictions.flood_risk_pct)}</span></span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <Mountain size={14} className="text-amber-600 dark:text-amber-500" />
              <span className="text-xs font-semibold text-amber-600 dark:text-amber-400">{t('landslideRiskLabel')}: <span className="font-bold text-amber-600 dark:text-amber-500">{getRiskLabel(lastClick.prediction.predictions.landslide_risk_pct)}</span></span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
