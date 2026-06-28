import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Satellite, Eye, Droplets, Leaf, MapPin, RefreshCw, AlertTriangle, Info } from 'lucide-react';

const API_BASE = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'http://127.0.0.1:8000'
  : 'https://flood-and-landslide-prediction.onrender.com';

const IMAGE_CONFIGS = [
  {
    type: 'true_color',
    label: 'True Color',
    subtitle: 'Natural satellite view',
    description: 'Real RGB image — exactly how the area looks from space. Shows vegetation, water bodies, urban areas and bare soil in natural colors.',
    icon: Eye,
    iconColor: 'text-blue-400',
    borderColor: 'border-blue-500/30',
    glowColor: 'shadow-blue-500/10',
    badgeColor: 'bg-blue-500/20 text-blue-300',
  },
  {
    type: 'ndwi',
    label: 'NDWI Water Map',
    subtitle: 'Flood & water detection',
    description: 'Normalized Difference Water Index — blue areas = water or flooded land, green = dry land. Reveals flood extent invisible to the naked eye.',
    icon: Droplets,
    iconColor: 'text-cyan-400',
    borderColor: 'border-cyan-500/30',
    glowColor: 'shadow-cyan-500/10',
    badgeColor: 'bg-cyan-500/20 text-cyan-300',
  },
  {
    type: 'ndvi',
    label: 'NDVI Vegetation',
    subtitle: 'Plant health & land cover',
    description: 'Normalized Difference Vegetation Index — dark green = dense healthy vegetation, brown = sparse/stressed plants, grey = bare soil or urban.',
    icon: Leaf,
    iconColor: 'text-emerald-400',
    borderColor: 'border-emerald-500/30',
    glowColor: 'shadow-emerald-500/10',
    badgeColor: 'bg-emerald-500/20 text-emerald-300',
  },
];

function SingleImageCard({ config, lat, lon, riverInfo, onExpand, mosaickingOrder, days }) {
  const [imageData, setImageData] = useState(null);
  const [imageMeta, setImageMeta] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const Icon = config.icon;

  const coordsKey = `${lat.toFixed(4)}-${lon.toFixed(4)}`;

  const fetchImage = useCallback(async () => {
    setLoading(true);
    setError(null);
    setImageData(null);
    setImageMeta(null);
    try {
      const targetLat = config.type === 'true_color' && riverInfo?.found ? riverInfo.lat : lat;
      const targetLon = config.type === 'true_color' && riverInfo?.found ? riverInfo.lon : lon;
      const sizeKm = config.type === 'true_color' && riverInfo?.found ? 10 : 8;

      const res = await axios.post(`${API_BASE}/satellite/image`, {
        lat: targetLat,
        lon: targetLon,
        image_type: config.type,
        size_km: sizeKm,
        mosaicking_order: mosaickingOrder,
        days: days
      }, { timeout: 50000 });

      setImageData(res.data.image_base64);
      setImageMeta({
        date: res.data.date,
        cloudCover: res.data.cloud_cover
      });
    } catch (e) {
      setError(e.response?.data?.detail || 'Failed to fetch satellite image.');
    } finally {
      setLoading(false);
    }
  }, [lat, lon, config.type, riverInfo, mosaickingOrder, days]);

  // Auto-fetch when coordinates or settings change
  useEffect(() => {
    fetchImage();
  }, [coordsKey, mosaickingOrder, days, fetchImage]);

  return (
    <div className={`flex flex-col rounded-2xl border ${config.borderColor} bg-slate-900/60 backdrop-blur-sm overflow-hidden shadow-lg ${config.glowColor} transition-all duration-300`}>
      {/* Card Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
        <div className="flex items-center gap-2.5">
          <div className={`w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center`}>
            <Icon size={16} className={config.iconColor} />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-200 leading-tight">{config.label}</div>
            <div className="text-[10px] text-slate-500">{config.subtitle}</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${config.badgeColor}`}>
            Sentinel-2
          </span>
          <button
            onClick={fetchImage}
            disabled={loading}
            className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors text-slate-400 hover:text-slate-200 disabled:opacity-40"
            title="Refresh image"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Image Area */}
      <div
        className="relative bg-slate-950 cursor-pointer group"
        style={{ aspectRatio: '1/1' }}
        onClick={() => imageData && onExpand(imageData, config)}
      >
        {loading ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
            <div className="relative w-12 h-12">
              <div className="absolute inset-0 rounded-full border-2 border-slate-700" />
              <div className={`absolute inset-0 rounded-full border-2 border-t-transparent animate-spin ${config.iconColor.replace('text-', 'border-')}`} />
              <Satellite size={18} className={`absolute inset-0 m-auto ${config.iconColor} animate-pulse`} />
            </div>
            <div className="text-center">
              <div className="text-xs font-semibold text-slate-300">Fetching from orbit...</div>
              <div className="text-[10px] text-slate-500 mt-0.5">Sentinel-2 ESA · up to 20s</div>
            </div>
          </div>
        ) : error ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 px-4 text-center">
            <AlertTriangle size={24} className="text-red-400/60" />
            <div className="text-xs text-red-400/80 font-medium">Image unavailable</div>
            <div className="text-[10px] text-slate-500 leading-relaxed">{error}</div>
            <button
              onClick={(e) => { e.stopPropagation(); fetchImage(); }}
              className="mt-1 text-[10px] px-3 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 transition-colors"
            >
              Retry
            </button>
          </div>
        ) : imageData ? (
          <>
            <img
              src={`data:image/png;base64,${imageData}`}
              alt={config.label}
              className="w-full h-full object-cover"
              style={{ imageRendering: 'pixelated' }}
            />
            {/* Hover overlay */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
              <div className="bg-black/60 backdrop-blur text-white text-xs px-3 py-1.5 rounded-lg font-semibold">
                Click to expand
              </div>
            </div>
            {/* Corner badge for river */}
            {config.type === 'true_color' && riverInfo?.found && (
              <div className="absolute top-2 left-2 bg-blue-900/80 backdrop-blur text-blue-300 text-[10px] px-2 py-0.5 rounded-md font-semibold flex items-center gap-1 shadow-md">
                <MapPin size={10} /> {riverInfo.name}
              </div>
            )}
            {/* Corner badge for cloud cover */}
            {imageMeta?.cloudCover !== null && imageMeta?.cloudCover !== undefined && (
              <div className="absolute top-2 right-2 bg-slate-900/85 backdrop-blur text-slate-200 text-[10px] px-2 py-0.5 rounded-md font-semibold flex flex-col items-end shadow-md">
                <span className="text-[8px] text-slate-400 leading-tight">
                  ☁️ {Math.round(imageMeta.cloudCover)}% clouds
                </span>
              </div>
            )}
          </>
        ) : null}
      </div>

      {/* Description */}
      <div className="px-4 py-3 flex items-start gap-2">
        <Info size={12} className="text-slate-600 mt-0.5 shrink-0" />
        <p className="text-[10px] text-slate-500 leading-relaxed">{config.description}</p>
      </div>
    </div>
  );
}

// Full-screen expanded view
function ExpandedModal({ imageData, config, onClose }) {
  if (!imageData || !config) return null;
  const Icon = config.icon;
  return (
    <div
      className="fixed inset-0 z-[9999] bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="relative max-w-3xl w-full rounded-2xl overflow-hidden border border-white/10 shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-3 bg-slate-900 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <Icon size={16} className={config.iconColor} />
            <span className="text-sm font-bold text-slate-200">{config.label}</span>
            <span className={`text-[10px] px-2 py-0.5 rounded-full ${config.badgeColor}`}>Sentinel-2 ESA</span>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-slate-300 text-sm font-bold transition-colors"
          >✕</button>
        </div>
        <img
          src={`data:image/png;base64,${imageData}`}
          alt={config.label}
          className="w-full object-contain"
          style={{ maxHeight: '75vh', imageRendering: 'pixelated' }}
        />
        <div className="px-5 py-3 bg-slate-900/80 border-t border-white/5">
          <p className="text-xs text-slate-400">{config.description}</p>
        </div>
      </div>
    </div>
  );
}

export default function SatelliteImageViewer({ lat, lon, locationName }) {
  const [riverInfo, setRiverInfo] = useState(null);
  const [riverLoading, setRiverLoading] = useState(false);
  const [expandedConfig, setExpandedConfig] = useState(null);
  const [expandedImage, setExpandedImage] = useState(null);
  const [imageMode, setImageMode] = useState('mostRecent'); // 'mostRecent' | 'leastCC'

  const coordsKey = `${lat?.toFixed(4)}-${lon?.toFixed(4)}`;

  // Find nearest river when coordinates change
  useEffect(() => {
    if (!lat || !lon) return;
    setRiverInfo(null);
    setRiverLoading(true);
    axios.post(`${API_BASE}/satellite/river`, { lat, lon })
      .then(res => setRiverInfo(res.data))
      .catch(() => setRiverInfo({ found: false }))
      .finally(() => setRiverLoading(false));
  }, [coordsKey]);

  if (!lat || !lon) return null;

  return (
    <>
      <div className="mt-2">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 flex items-center justify-center">
              <Satellite size={18} className="text-indigo-400" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-200">Live Satellite Analysis</h3>
              <p className="text-[10px] text-slate-500">
                Sentinel-2 ESA
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {/* Image preference selector */}
            <div className="flex bg-slate-950/60 p-1 rounded-xl border border-white/5 gap-1 shadow-inner">
              <button
                className={`px-3 py-1.5 text-[10px] font-bold rounded-lg transition-all duration-200 ${imageMode === 'mostRecent' ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'}`}
                onClick={() => setImageMode('mostRecent')}
              >
                📅 Most recent
              </button>
              <button
                className={`px-3 py-1.5 text-[10px] font-bold rounded-lg transition-all duration-200 ${imageMode === 'leastCC' ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'}`}
                onClick={() => setImageMode('leastCC')}
              >
                ✨ Clearest (older)
              </button>
            </div>

            {/* River info badge */}
            {riverLoading ? (
              <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
                <div className="w-3 h-3 rounded-full border border-slate-500 border-t-transparent animate-spin" />
                Finding river...
              </div>
            ) : riverInfo?.found ? (
              <div className="flex items-center gap-1.5 bg-blue-500/10 border border-blue-500/20 text-blue-300 text-[10px] px-3 py-1.5 rounded-full shrink-0">
                <MapPin size={10} /> {riverInfo.name}
              </div>
            ) : (
              <div className="text-[10px] text-slate-600 italic shrink-0">No river found nearby</div>
            )}
          </div>
        </div>

        {/* Location context bar */}
        <div className="mb-4 px-4 py-2.5 rounded-xl bg-slate-800/50 border border-white/5 flex items-center gap-2 text-xs text-slate-400">
          <MapPin size={12} className="text-slate-500 shrink-0" />
          <span className="truncate">{locationName}</span>
          <span className="text-slate-600 shrink-0">·</span>
          <span className="text-slate-500 shrink-0 font-mono text-[10px]">{lat.toFixed(4)}°, {lon.toFixed(4)}°</span>
        </div>

        {/* Three image cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {IMAGE_CONFIGS.map(config => (
            <SingleImageCard
              key={config.type}
              config={config}
              lat={lat}
              lon={lon}
              riverInfo={config.type === 'true_color' ? riverInfo : null}
              onExpand={(imgData, cfg) => { setExpandedImage(imgData); setExpandedConfig(cfg); }}
              mosaickingOrder={imageMode}
              days={imageMode === 'mostRecent' ? 15 : 90}
            />
          ))}
        </div>

        {/* Legend / Info footer */}
        <div className="mt-4 px-4 py-3 rounded-xl bg-slate-900/40 border border-white/5 grid grid-cols-1 sm:grid-cols-3 gap-3 text-[10px] text-slate-500">
          <div className="flex items-start gap-2">
            <Eye size={11} className="text-blue-400 mt-0.5 shrink-0" />
            <span><span className="text-blue-300 font-semibold">True Color:</span> Natural RGB view from Sentinel-2. Image 1 targets the nearest river for flood context.</span>
          </div>
          <div className="flex items-start gap-2">
            <Droplets size={11} className="text-cyan-400 mt-0.5 shrink-0" />
            <span><span className="text-cyan-300 font-semibold">NDWI:</span> Blue = water/flooding. Use this to detect flood extent and surface water bodies.</span>
          </div>
          <div className="flex items-start gap-2">
            <Leaf size={11} className="text-emerald-400 mt-0.5 shrink-0" />
            <span><span className="text-emerald-300 font-semibold">NDVI:</span> Dark green = healthy vegetation. Landslide zones often show sudden NDVI loss.</span>
          </div>
        </div>
      </div>

      {/* Expanded modal — rendered outside the card grid so z-index & overflow work correctly */}
      {expandedConfig && expandedImage && (
        <ExpandedModal
          imageData={expandedImage}
          config={expandedConfig}
          onClose={() => { setExpandedConfig(null); setExpandedImage(null); }}
        />
      )}
    </>
  );
}
