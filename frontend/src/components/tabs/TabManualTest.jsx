import React, { useState } from 'react';
import { Droplets, Mountain } from 'lucide-react';
import axios from 'axios';
import { getRiskColor, getRiskLabel, getRiskIcon, getRiskAdvice } from '../../utils/riskUtils';

const API_BASE = 'http://localhost:8000';

// ── TAB 4: Manual Parameter Test (Separate Flood & Landslide) ─

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

// Helper function to auto-calculate flood engineered features
function calculateFloodEngineered(raw) {
  const rain = raw.rainfall_mm;
  const hum = raw.humidity_pct;
  const elev = raw.elevation_m;
  const discharge = raw.river_discharge_m3s;
  const precip_hours = raw.precipitation_hours;

  let rain_cat = 0;
  if (rain > 150) rain_cat = 5;
  else if (rain > 75) rain_cat = 4;
  else if (rain > 30) rain_cat = 3;
  else if (rain > 15) rain_cat = 2;
  else if (rain > 5) rain_cat = 1;

  const month = raw.month || 7;
  const seasonMap = {1:0, 2:0, 3:1, 4:1, 5:1, 6:2, 7:2, 8:2, 9:2, 10:3, 11:3, 12:3};
  const season = seasonMap[month] !== undefined ? seasonMap[month] : 2;

  let hum_risk = 0;
  if (hum > 75) hum_risk = 3;
  else if (hum > 50) hum_risk = 2;
  else if (hum > 30) hum_risk = 1;

  const low_elev = elev < 100 ? 1 : 0;
  const high_disc = discharge > 1000 ? 1 : 0;

  const log_rain = Math.log1p(Math.max(0, rain));
  const log_disc = Math.log1p(Math.max(0, discharge));
  const log_elev = Math.log1p(Math.max(0, elev));

  const rain_hum = (rain * hum) / 100;
  const precip_eff = precip_hours > 0 ? rain / precip_hours : 0;
  const temp_range = raw.temp_max_c - raw.temp_min_c;

  const norm_clamp = (val, min, max) => {
    const rng = max - min;
    return rng > 0 ? Math.max(0.0, Math.min(1.0, (val - min) / rng)) : 0.0;
  };
  const r_norm = norm_clamp(rain, 0, 500);
  const h_norm = norm_clamp(hum, 10, 100);
  const p_norm = norm_clamp(precip_hours, 0, 24);
  const e_norm = norm_clamp(elev, 0, 5000);
  const d_norm = norm_clamp(discharge, 0, 8000);

  const score = 0.30 * r_norm + 0.20 * h_norm + 0.20 * p_norm + 0.15 * (1.0 - e_norm) + 0.15 * d_norm;

  return {
    rainfall_category: rain_cat,
    season: season,
    humidity_risk: hum_risk,
    low_elevation: low_elev,
    high_discharge: high_disc,
    log_rainfall_mm: parseFloat(log_rain.toFixed(2)),
    log_river_discharge_m3s: parseFloat(log_disc.toFixed(2)),
    log_elevation_m: parseFloat(log_elev.toFixed(2)),
    rain_humidity_index: parseFloat(rain_hum.toFixed(2)),
    precip_efficiency: parseFloat(precip_eff.toFixed(2)),
    temp_range_c: parseFloat(temp_range.toFixed(2)),
    flood_risk_score: parseFloat(score.toFixed(3)),
  };
}

// Helper function to auto-calculate landslide engineered features
function calculateLandslideEngineered(raw) {
  const rain = raw.rainfall_mm;
  const ante = raw.antecedent_7day_mm;
  const elev = raw.elevation_m;
  const hum = raw.humidity_pct;
  const sm = raw.soil_moisture;

  const rain_int = raw.precipitation_hours > 0 ? rain / raw.precipitation_hours : 0;

  let elev_cat = 0;
  if (elev > 3000) elev_cat = 4;
  else if (elev > 1500) elev_cat = 3;
  else if (elev > 750) elev_cat = 2;
  else if (elev > 250) elev_cat = 1;

  const slope = elev > 0 ? Math.log1p(Math.max(0, elev)) / 10 : 0;
  const twi = slope > 0 ? sm / (slope + 0.01) : 0;
  const comb_rain = 0.6 * rain + 0.4 * ante;

  const month = raw.month || 7;
  const seasonMap = {1:0, 2:0, 3:1, 4:1, 5:1, 6:2, 7:2, 8:2, 9:2, 10:3, 11:3, 12:3};
  const season = seasonMap[month] !== undefined ? seasonMap[month] : 2;

  const crit_zone = (elev > 500 && rain > 30) ? 1 : 0;

  const log_rain = Math.log1p(Math.max(0, rain));
  const log_ante = Math.log1p(Math.max(0, ante));
  const log_elev = Math.log1p(Math.max(0, elev));
  const temp_range = raw.temp_max_c - raw.temp_min_c;

  const norm_clamp = (val, min, max) => {
    const rng = max - min;
    return rng > 0 ? Math.max(0.0, Math.min(1.0, (val - min) / rng)) : 0.0;
  };
  const r_norm = norm_clamp(rain, 0, 500);
  const a_norm = norm_clamp(ante, 0, 800);
  const e_norm = norm_clamp(elev, 0, 5000);
  const h_norm = norm_clamp(hum, 10, 100);
  const s_norm = norm_clamp(slope, 0, 1);
  const sm_norm = norm_clamp(sm, 0, 1);

  const score = 0.25 * r_norm + 0.20 * a_norm + 0.20 * e_norm + 0.15 * h_norm + 0.10 * s_norm + 0.10 * sm_norm;

  return {
    rainfall_intensity: parseFloat(rain_int.toFixed(2)),
    elevation_cat: elev_cat,
    slope_proxy: parseFloat(slope.toFixed(2)),
    twi_proxy: parseFloat(twi.toFixed(2)),
    combined_rain_index: parseFloat(comb_rain.toFixed(2)),
    season: season,
    critical_zone: crit_zone,
    log_rainfall_mm: parseFloat(log_rain.toFixed(2)),
    log_antecedent_7day_mm: parseFloat(log_ante.toFixed(2)),
    log_elevation_m: parseFloat(log_elev.toFixed(2)),
    temp_range: parseFloat(temp_range.toFixed(2)),
    landslide_risk_score: parseFloat(score.toFixed(3)),
  };
}

// ── Flood-specific configs ──
const FLOOD_DEFAULT_PARAMS = {
  // Raw
  rainfall_mm:          50,
  temp_max_c:           30,
  temp_min_c:           20,
  humidity_pct:         75,
  wind_speed_kmh:       20,
  precipitation_hours:  6,
  evapotranspiration_mm:3,
  elevation_m:          500,
  river_discharge_m3s:  300,
  month:                7,
  year:                 2024,
  // Engineered
  rainfall_category:    3,
  season:               2,
  humidity_risk:        2,
  low_elevation:        0,
  high_discharge:       0,
  log_rainfall_mm:      3.93,
  log_river_discharge_m3s: 5.71,
  log_elevation_m:      6.22,
  rain_humidity_index:  37.5,
  precip_efficiency:    8.33,
  temp_range_c:         10.0,
  flood_risk_score:     0.35,
};

const FLOOD_RAW_CONFIG = [
  ['rainfall_mm',           'Daily Rainfall',          'mm',    0,    400,  1,    'Rainfall in the last 24 hours — primary flood trigger'],
  ['temp_max_c',            'Max Temperature',         '°C',    -10,  50,   0.5,  'Maximum daily temperature'],
  ['temp_min_c',            'Min Temperature',         '°C',    -20,  40,   0.5,  'Minimum daily temperature'],
  ['humidity_pct',          'Relative Humidity',       '%',     0,    100,  1,    'Maximum relative humidity (%)'],
  ['wind_speed_kmh',        'Wind Speed',              'km/h',  0,    150,  1,    'Maximum wind speed'],
  ['precipitation_hours',   'Precipitation Hours',     'hrs',   0,    24,   0.5,  'Number of hours with precipitation during the day'],
  ['evapotranspiration_mm', 'Evapotranspiration',      'mm',    0,    20,   0.1,  'Daily reference ET (FAO-56)'],
  ['elevation_m',           'Elevation',               'm',     0,    6000, 10,   'Terrain elevation above sea level'],
  ['river_discharge_m3s',   'River Discharge',         'm³/s',  0,    10000,10,   'River flow rate from GloFAS (m³/second)'],
  ['month',                 'Month',                   '',      1,    12,   1,    'Month of the year (1=Jan, 12=Dec)'],
];

const FLOOD_ENGINEERED_CONFIG = [
  ['rainfall_category',     'Rainfall Category',       '',      0,    5,    1,    'Binned rainfall category (0–5)'],
  ['season',                'Season',                  '',      0,    3,    1,    'Binned season code (0–3)'],
  ['humidity_risk',         'Humidity Risk',           '',      0,    3,    1,    'Binned humidity risk (0–3)'],
  ['low_elevation',         'Low Elevation',           '',      0,    1,    1,    'Binary flag: 1 if elevation < 100m'],
  ['high_discharge',        'High Discharge',          '',      0,    1,    1,    'Binary flag: 1 if river discharge > 1000 m³/s'],
  ['log_rainfall_mm',       'Log Rainfall',            '',      0,    7,    0.01, 'log₁ₚ(rainfall_mm)'],
  ['log_river_discharge_m3s','Log River Discharge',    '',      0,    10,   0.01, 'log₁ₚ(river_discharge_m3s)'],
  ['log_elevation_m',       'Log Elevation',           '',      0,    9,    0.01, 'log₁ₚ(elevation_m)'],
  ['rain_humidity_index',   'Rain-Humidity Index',     '',      0,    400,  0.1,  'rainfall_mm × humidity_pct / 100'],
  ['precip_efficiency',     'Precip Efficiency',       '',      0,    100,  0.1,  'rainfall_mm / precipitation_hours'],
  ['temp_range_c',          'Temp Range',              '°C',    0,    50,   0.5,  'temp_max_c − temp_min_c'],
  ['flood_risk_score',      'Flood Risk Score',        '',      0,    1,    0.01, 'Weighted normalized score (0–1)'],
];

// ── Landslide-specific configs ──
const LANDSLIDE_DEFAULT_PARAMS = {
  // Raw
  rainfall_mm:          50,
  antecedent_7day_mm:   80,
  temp_max_c:           25,
  temp_min_c:           18,
  humidity_pct:         80,
  wind_speed_kmh:       12,
  precipitation_hours:  8,
  evapotranspiration_mm:3,
  soil_moisture:        0.25,
  elevation_m:          800,
  river_discharge_m3s:  50,
  flood_nearby:         0,
  month:                7,
  year:                 2024,
  // Engineered
  rainfall_intensity:   6.25,
  elevation_cat:        2,
  slope_proxy:          0.67,
  twi_proxy:            0.37,
  combined_rain_index:  62.0,
  season:               2,
  critical_zone:        1,
  log_rainfall_mm:      3.93,
  log_antecedent_7day_mm: 4.39,
  log_elevation_m:      6.69,
  temp_range:           7.0,
  landslide_risk_score: 0.45,
};

const LANDSLIDE_RAW_CONFIG = [
  ['rainfall_mm',           'Daily Rainfall',          'mm',    0,    400,  1,    'Rainfall in the last 24 hours'],
  ['antecedent_7day_mm',    '7-Day Antecedent Rain',   'mm',    0,    600,  1,    'Cumulative rainfall over the past 7 days — critical landslide trigger'],
  ['temp_max_c',            'Max Temperature',         '°C',    -10,  50,   0.5,  'Maximum daily temperature'],
  ['temp_min_c',            'Min Temperature',         '°C',    -20,  40,   0.5,  'Minimum daily temperature'],
  ['humidity_pct',          'Relative Humidity',       '%',     0,    100,  1,    'Maximum relative humidity (%)'],
  ['wind_speed_kmh',        'Wind Speed',              'km/h',  0,    150,  1,    'Maximum wind speed'],
  ['precipitation_hours',   'Precipitation Hours',     'hrs',   0,    24,   0.5,  'Number of hours with precipitation'],
  ['evapotranspiration_mm', 'Evapotranspiration',      'mm',    0,    20,   0.1,  'Daily reference ET (FAO-56)'],
  ['soil_moisture',         'Soil Moisture',           '0-1',   0,    1,    0.01, 'Volumetric soil moisture 0–7cm depth'],
  ['elevation_m',           'Elevation',               'm',     0,    6000, 10,   'Terrain elevation — proxy for slope steepness'],
  ['river_discharge_m3s',   'River Discharge',         'm³/s',  0,    10000,10,   'River flow rate (m³/second)'],
  ['month',                 'Month',                   '',      1,    12,   1,    'Month of the year (1=Jan, 12=Dec)'],
];

const LANDSLIDE_ENGINEERED_CONFIG = [
  ['rainfall_intensity',    'Rainfall Intensity',      'mm/hr', 0,    100,  0.1,  'rainfall_mm / precipitation_hours'],
  ['elevation_cat',         'Elevation Category',      '',      0,    4,    1,    'Binned elevation category (0–4)'],
  ['slope_proxy',           'Slope Proxy',             '',      0,    1,    0.01, 'log₁ₚ(elevation_m) / 10'],
  ['twi_proxy',             'TWI Proxy',               '',      0,    10,   0.01, 'soil_moisture / (slope_proxy + 0.01)'],
  ['combined_rain_index',   'Combined Rain Index',     'mm',    0,    640,  0.1,  '0.6 × rainfall_mm + 0.4 × antecedent_7day_mm'],
  ['season',                'Season',                  '',      0,    3,    1,    'Binned season code (0–3)'],
  ['critical_zone',         'Critical Zone',           '',      0,    1,    1,    'Binary flag: 1 if elevation > 500m AND rainfall > 30mm'],
  ['log_rainfall_mm',       'Log Rainfall',            '',      0,    7,    0.01, 'log₁ₚ(rainfall_mm)'],
  ['log_antecedent_7day_mm','Log Antecedent Rain',     '',      0,    7,    0.01, 'log₁ₚ(antecedent_7day_mm)'],
  ['log_elevation_m',       'Log Elevation',           '',      0,    9,    0.01, 'log₁ₚ(elevation_m)'],
  ['temp_range',            'Temp Range',              '°C',    0,    50,   0.5,  'temp_max_c − temp_min_c'],
  ['landslide_risk_score',  'Landslide Risk Score',    '',      0,    1,    0.01, 'Weighted normalized score (0–1)'],
];

function ManualResultBar({ label, mlPct, finalPct, capPct, color, icon }) {
  return (
    <div className="manual-result-block">
      <div className="manual-result-header">
        {icon}
        <span className="manual-result-title">{label}</span>
        <span className="manual-result-final" style={{ color }}>{finalPct}%</span>
      </div>
      <div className="manual-result-bars">
        <div className="manual-bar-row">
          <span className="manual-bar-label">Raw ML Model</span>
          <div className="risk-bar-track">
            <div className="risk-bar-fill" style={{ width: `${mlPct}%`, background: '#60a5fa' }} />
          </div>
          <span className="manual-bar-val">{mlPct}%</span>
        </div>
        <div className="manual-bar-row">
          <span className="manual-bar-label">Physics Cap</span>
          <div className="risk-bar-track">
            <div className="risk-bar-fill" style={{ width: `${capPct}%`, background: '#a78bfa' }} />
          </div>
          <span className="manual-bar-val">{capPct}%</span>
        </div>
        <div className="manual-bar-row">
          <span className="manual-bar-label">Final Risk</span>
          <div className="risk-bar-track">
            <div className="risk-bar-fill" style={{ width: `${finalPct}%`, background: color }} />
          </div>
          <span className="manual-bar-val" style={{ color, fontWeight: 700 }}>{finalPct}%</span>
        </div>
      </div>
      <div className="risk-status-row" style={{ marginTop: '0.5rem' }}>
        {getRiskIcon(finalPct)}
        <span className="risk-status-label">{getRiskLabel(finalPct)} — {getRiskAdvice(finalPct)}</span>
      </div>
    </div>
  );
}

// ── Flood Manual Test Sub-Tab ──
function FloodManualTest() {
  const [params, setParams] = useState(FLOOD_DEFAULT_PARAMS);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [autoCalc, setAutoCalc] = useState(true);

  const handleRawChange = (key, val) => {
    const numericVal = parseFloat(val);
    setParams(prev => {
      const nextParams = { ...prev, [key]: numericVal };
      if (autoCalc) {
        const engineered = calculateFloodEngineered(nextParams);
        return { ...nextParams, ...engineered };
      }
      return nextParams;
    });
  };

  const handleEngineeredChange = (key, val) => {
    setAutoCalc(false); // Disable auto-calculate if user overrides an engineered parameter manually
    setParams(prev => ({ ...prev, [key]: parseFloat(val) }));
  };

  const handlePreset = (preset) => {
    let raw = {};
    if (preset === 'extreme') raw = {
      rainfall_mm: 236.6, temp_max_c: 27.1, temp_min_c: 25.6, humidity_pct: 97,
      wind_speed_kmh: 43.3, precipitation_hours: 24, evapotranspiration_mm: 1.1,
      elevation_m: 85, river_discharge_m3s: 0.66, month: 6, year: 2017,
    };
    if (preset === 'moderate') raw = {
      rainfall_mm: 21.8, temp_max_c: 30.6, temp_min_c: 23.5, humidity_pct: 100,
      wind_speed_kmh: 13.3, precipitation_hours: 13, evapotranspiration_mm: 3.62,
      elevation_m: 8, river_discharge_m3s: 4.68, month: 11, year: 2022,
    };
    if (preset === 'safe') raw = {
      rainfall_mm: 0, temp_max_c: 42.2, temp_min_c: 29.4, humidity_pct: 58,
      wind_speed_kmh: 21.1, precipitation_hours: 0, evapotranspiration_mm: 9.96,
      elevation_m: 204, river_discharge_m3s: 0, month: 5, year: 2026,
    };
    const engineered = calculateFloodEngineered(raw);
    setParams({ ...raw, ...engineered });
    setResult(null);
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.post(`${API_BASE}/predict-flood-manual`, {
        rainfall_mm: params.rainfall_mm,
        temp_max_c: params.temp_max_c,
        temp_min_c: params.temp_min_c,
        humidity_pct: params.humidity_pct,
        wind_speed_kmh: params.wind_speed_kmh,
        precipitation_hours: params.precipitation_hours,
        evapotranspiration_mm: params.evapotranspiration_mm,
        elevation_m: params.elevation_m,
        river_discharge_m3s: params.river_discharge_m3s,
        
        rainfall_category: Math.round(params.rainfall_category),
        season: Math.round(params.season),
        humidity_risk: Math.round(params.humidity_risk),
        low_elevation: Math.round(params.low_elevation),
        high_discharge: Math.round(params.high_discharge),
        log_rainfall_mm: params.log_rainfall_mm,
        log_river_discharge_m3s: params.log_river_discharge_m3s,
        log_elevation_m: params.log_elevation_m,
        rain_humidity_index: params.rain_humidity_index,
        precip_efficiency: params.precip_efficiency,
        temp_range_c: params.temp_range_c,
        flood_risk_score: params.flood_risk_score,
      });
      setResult(res.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Prediction failed. Is the backend running?');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="manual-layout">
      <div className="manual-form-panel">
        <div className="glass-card" style={{ marginBottom: '1rem' }}>
          <div className="manual-form-title">
            <Droplets size={20} className="icon-blue" />
            Flood Prediction — Manual Training Parameters Test
          </div>
          <p className="search-panel-desc">
            Directly test the flood model by passing the <strong>exact features used in training</strong>.
            You can modify the engineered features manually to test the ML model's limits.
          </p>
          <div className="manual-model-badge" style={{ background: '#3b82f622', borderColor: '#3b82f644', color: '#60a5fa' }}>
            <Droplets size={14} /> Model: Random Forest (Calibrated) · ROC-AUC: 0.906 · 21 total features · 15,167 training rows
          </div>

          <div className="section-label">Quick Presets (Real Events)</div>
          <div className="quick-locs">
            <button className="quick-loc-btn" onClick={() => handlePreset('extreme')} style={{ borderColor: '#ef444455' }}>🌊 Bangladesh 2017</button>
            <button className="quick-loc-btn" onClick={() => handlePreset('moderate')} style={{ borderColor: '#f59e0b55' }}>🌧️ Indonesia Sumatra 2022</button>
            <button className="quick-loc-btn" onClick={() => handlePreset('safe')} style={{ borderColor: '#10b98155' }}>☀️ Dry Day (No Rain)</button>
          </div>
        </div>

        {/* Raw Parameters section */}
        <div className="glass-card" style={{ marginBottom: '1rem' }}>
          <div className="section-label" style={{ marginBottom: '1rem' }}>📋 Raw Inputs ({FLOOD_RAW_CONFIG.length})</div>
          <div className="manual-params-grid">
            {FLOOD_RAW_CONFIG.map(([key, label, unit, min, max, step, desc]) => (
              <div key={key} className="manual-param-row">
                <div className="manual-param-header flex justify-between items-center">
                  <span className="manual-param-label font-semibold text-slate-200 text-sm">{label}</span>
                  {key === 'month' ? (
                    <select
                      value={Math.round(params[key] || 7)}
                      onChange={e => handleRawChange(key, e.target.value)}
                      className="bg-slate-800 border border-slate-700 text-xs text-blue-400 font-bold rounded px-2 py-0.5 outline-none focus:border-blue-500/50"
                    >
                      {MONTH_NAMES.map((name, idx) => (
                        <option key={name} value={idx + 1}>{name}</option>
                      ))}
                    </select>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        min={min}
                        max={max}
                        step={step}
                        value={params[key] !== undefined ? params[key] : 0}
                        onChange={e => handleRawChange(key, e.target.value)}
                        className="w-20 bg-slate-800/80 border border-slate-700/50 rounded px-2 py-0.5 text-xs text-blue-400 font-bold text-right outline-none focus:border-blue-500/50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                      <span className="text-xs text-slate-400 font-medium">{unit}</span>
                    </div>
                  )}
                </div>
                <p className="manual-param-desc">{desc}</p>
                {key !== 'month' && (
                  <>
                    <input type="range" min={min} max={max} step={step} value={params[key] || 0}
                      onChange={e => handleRawChange(key, e.target.value)} className="manual-slider mt-2" />
                    <div className="manual-slider-bounds flex justify-between text-[10px] text-slate-500 mt-1"><span>{min}{unit}</span><span>{max}{unit}</span></div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Engineered Parameters section */}
        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid #ffffff11', paddingBottom: '0.5rem' }}>
            <span className="section-label" style={{ margin: 0 }}>⚙️ Engineered Features ({FLOOD_ENGINEERED_CONFIG.length})</span>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '13px', cursor: 'pointer', color: '#60a5fa' }}>
              <input type="checkbox" checked={autoCalc} onChange={e => {
                setAutoCalc(e.target.checked);
                if (e.target.checked) {
                  setParams(prev => ({ ...prev, ...calculateFloodEngineered(prev) }));
                }
              }} style={{ cursor: 'pointer' }} />
              Auto-Calculate
            </label>
          </div>
          
          <div className="manual-params-grid">
            {FLOOD_ENGINEERED_CONFIG.map(([key, label, unit, min, max, step, desc]) => (
              <div key={key} className="manual-param-row" style={{ opacity: autoCalc ? 0.75 : 1, transition: 'opacity 0.2s' }}>
                <div className="manual-param-header">
                  <span className="manual-param-label" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    {label} {autoCalc && <span style={{ fontSize: '10px', background: '#3b82f633', color: '#60a5fa', padding: '1px 4px', borderRadius: '4px' }}>Auto</span>}
                  </span>
                  <span className="manual-param-unit" style={{ color: autoCalc ? '#60a5fa' : '#fbbf24' }}>
                    {params[key] !== undefined ? params[key] : 0}{unit}
                  </span>
                </div>
                <p className="manual-param-desc">{desc}</p>
                <input type="range" min={min} max={max} step={step} value={params[key] !== undefined ? params[key] : 0}
                  onChange={e => handleEngineeredChange(key, e.target.value)} className="manual-slider" />
                <div className="manual-slider-bounds"><span>{min}{unit}</span><span>{max}{unit}</span></div>
              </div>
            ))}
          </div>

          <button id="flood-manual-predict-btn" className="gps-btn" style={{ marginTop: '1.5rem', width: '100%' }}
            onClick={handleSubmit} disabled={loading}>
            {loading ? <><div className="spinner-sm" /> Running Model...</> : <><Droplets size={18} /> Predict Flood Risk</>}
          </button>
        </div>
      </div>

      <div className="manual-result-panel">
        {error && <div className="error-card">{error}</div>}
        {!result && !loading && (
          <div className="empty-card empty-card-lg">
            <Droplets size={48} className="empty-icon" />
            <p>Set flood parameters on the left and click <strong>Predict Flood Risk</strong>.</p>
            <p style={{ marginTop: '0.5rem', fontSize: '13px', opacity: 0.6 }}>Passes all 21 training features directly to the ML model for evaluation.</p>
          </div>
        )}
        {loading && (
          <div className="loading-card loading-card-lg">
            <div className="spinner" />
            <p className="loading-text">Running flood model...</p>
            <p className="loading-sub">Passing 21 training features directly to ML model</p>
          </div>
        )}
        {result && (
          <>
            <div className="glass-card" style={{ marginBottom: '1rem' }}>
              <div className="manual-summary-title"><Droplets size={16} className="icon-blue" /> Flood Prediction Result</div>
              <div style={{ marginTop: '0.75rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <span className="manual-result-big" style={{ color: getRiskColor(result.flood_risk_pct) }}>{result.flood_risk_pct}%</span>
                <span className="pill" style={{ background: getRiskColor(result.flood_risk_pct) + '33', color: getRiskColor(result.flood_risk_pct), borderColor: getRiskColor(result.flood_risk_pct) + '66', fontSize: '15px', padding: '6px 14px' }}>
                  {getRiskLabel(result.flood_risk_pct)}
                </span>
              </div>
            </div>
            <div className="glass-card" style={{ marginBottom: '1rem' }}>
              <ManualResultBar label="Flood Risk Details" mlPct={result.raw_ml_probability} capPct={result.physics_cap}
                finalPct={result.flood_risk_pct} color={getRiskColor(result.flood_risk_pct)}
                icon={<Droplets size={18} className="icon-blue" />} />
            </div>
            <div className="glass-card live-factors-card">
              <div className="live-factors-title">Evaluation Logic</div>
              <div style={{ fontSize: '13px', color: '#94a3b8', lineHeight: 1.7 }}>
                <p>① <span style={{ color: '#60a5fa' }}>Raw ML ({result.raw_ml_probability}%)</span> — Random Forest Model evaluated directly on the 21 input features.</p>
                <p>② <span style={{ color: '#a78bfa' }}>Physics Cap ({result.physics_cap}%)</span> — Calculated using rain, river discharge, and elevation.</p>
                <p>③ <span style={{ color: '#e2e8f0' }}>Final Risk ({result.flood_risk_pct}%)</span> — Capped by physical feasibility: min(ML, Physics Cap).</p>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ── Landslide Manual Test Sub-Tab ──
function LandslideManualTest() {
  const [params, setParams] = useState(LANDSLIDE_DEFAULT_PARAMS);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [autoCalc, setAutoCalc] = useState(true);

  const handleRawChange = (key, val) => {
    const numericVal = parseFloat(val);
    setParams(prev => {
      const nextParams = { ...prev, [key]: numericVal };
      if (autoCalc) {
        const engineered = calculateLandslideEngineered(nextParams);
        return { ...nextParams, ...engineered };
      }
      return nextParams;
    });
  };

  const handleEngineeredChange = (key, val) => {
    setAutoCalc(false); // Disable auto-calculate if user overrides an engineered parameter manually
    setParams(prev => ({ ...prev, [key]: parseFloat(val) }));
  };

  const handlePreset = (preset) => {
    let raw = {};
    if (preset === 'extreme') raw = {
      rainfall_mm: 379.2, antecedent_7day_mm: 190.7, temp_max_c: 24.3, temp_min_c: 22.8,
      humidity_pct: 100, wind_speed_kmh: 26.3, precipitation_hours: 24, evapotranspiration_mm: 0.42,
      soil_moisture: 0.43, elevation_m: 142, river_discharge_m3s: 15.52, flood_nearby: 0,
      month: 4, year: 2022,
    };
    if (preset === 'moderate') raw = {
      rainfall_mm: 7.8, antecedent_7day_mm: 147.5, temp_max_c: 24.5, temp_min_c: 21.6,
      humidity_pct: 89, wind_speed_kmh: 5.8, precipitation_hours: 10, evapotranspiration_mm: 1.61,
      soil_moisture: 0.497, elevation_m: 888, river_discharge_m3s: 5.22, flood_nearby: 0,
      month: 6, year: 2022,
    };
    if (preset === 'safe') raw = {
      rainfall_mm: 0, antecedent_7day_mm: 0.3, temp_max_c: 41.8, temp_min_c: 26.4,
      humidity_pct: 60, wind_speed_kmh: 16.4, precipitation_hours: 0, evapotranspiration_mm: 8.94,
      soil_moisture: 0.044, elevation_m: 204, river_discharge_m3s: 0, flood_nearby: 0,
      month: 5, year: 2026,
    };
    const engineered = calculateLandslideEngineered(raw);
    setParams({ ...raw, ...engineered });
    setResult(null);
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.post(`${API_BASE}/predict-landslide-manual`, {
        rainfall_mm: params.rainfall_mm,
        antecedent_7day_mm: params.antecedent_7day_mm,
        temp_max_c: params.temp_max_c,
        temp_min_c: params.temp_min_c,
        humidity_pct: params.humidity_pct,
        wind_speed_kmh: params.wind_speed_kmh,
        precipitation_hours: params.precipitation_hours,
        evapotranspiration_mm: params.evapotranspiration_mm,
        soil_moisture: params.soil_moisture,
        elevation_m: params.elevation_m,
        river_discharge_m3s: params.river_discharge_m3s,
        flood_nearby: params.flood_nearby ? 1 : 0,

        rainfall_intensity: params.rainfall_intensity,
        elevation_cat: Math.round(params.elevation_cat),
        slope_proxy: params.slope_proxy,
        twi_proxy: params.twi_proxy,
        combined_rain_index: params.combined_rain_index,
        season: Math.round(params.season),
        critical_zone: Math.round(params.critical_zone),
        log_rainfall_mm: params.log_rainfall_mm,
        log_antecedent_7day_mm: params.log_antecedent_7day_mm,
        log_elevation_m: params.log_elevation_m,
        temp_range: params.temp_range,
        landslide_risk_score: params.landslide_risk_score,
      });
      setResult(res.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Prediction failed. Is the backend running?');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="manual-layout">
      <div className="manual-form-panel">
        <div className="glass-card" style={{ marginBottom: '1rem' }}>
          <div className="manual-form-title">
            <Mountain size={20} className="icon-amber" />
            Landslide Prediction — Manual Training Parameters Test
          </div>
          <p className="search-panel-desc">
            Directly test the landslide model by passing the <strong>exact features used in training</strong>.
            You can modify the engineered features manually to test the ML model's limits.
          </p>
          <div className="manual-model-badge" style={{ background: '#f59e0b22', borderColor: '#f59e0b44', color: '#fbbf24' }}>
            <Mountain size={14} /> Model: Naive Bayes · ROC-AUC: 0.904 · 24 total features · 9,010 training rows
          </div>

          <div className="section-label">Quick Presets (Real Events)</div>
          <div className="quick-locs">
            <button className="quick-loc-btn" onClick={() => handlePreset('extreme')} style={{ borderColor: '#ef444455' }}>⛰️ Philippines Leyte 2022</button>
            <button className="quick-loc-btn" onClick={() => handlePreset('moderate')} style={{ borderColor: '#f59e0b55' }}>🏔️ India Nagaland 2022</button>
            <button className="quick-loc-btn" onClick={() => handlePreset('safe')} style={{ borderColor: '#10b98155' }}>☀️ Safe Location (No Rain)</button>
          </div>
        </div>

        {/* Raw Parameters section */}
        <div className="glass-card" style={{ marginBottom: '1rem' }}>
          <div className="section-label" style={{ marginBottom: '1rem' }}>📋 Raw Inputs ({LANDSLIDE_RAW_CONFIG.length + 1})</div>
          <div className="manual-params-grid">
            {LANDSLIDE_RAW_CONFIG.map(([key, label, unit, min, max, step, desc]) => (
              <div key={key} className="manual-param-row">
                <div className="manual-param-header flex justify-between items-center">
                  <span className="manual-param-label font-semibold text-slate-200 text-sm">{label}</span>
                  {key === 'month' ? (
                    <select
                      value={Math.round(params[key] || 7)}
                      onChange={e => handleRawChange(key, e.target.value)}
                      className="bg-slate-800 border border-slate-700 text-xs text-blue-400 font-bold rounded px-2 py-0.5 outline-none focus:border-blue-500/50"
                    >
                      {MONTH_NAMES.map((name, idx) => (
                        <option key={name} value={idx + 1}>{name}</option>
                      ))}
                    </select>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        min={min}
                        max={max}
                        step={step}
                        value={params[key] !== undefined ? params[key] : 0}
                        onChange={e => handleRawChange(key, e.target.value)}
                        className="w-20 bg-slate-800/80 border border-slate-700/50 rounded px-2 py-0.5 text-xs text-blue-400 font-bold text-right outline-none focus:border-blue-500/50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                      <span className="text-xs text-slate-400 font-medium">{unit}</span>
                    </div>
                  )}
                </div>
                <p className="manual-param-desc">{desc}</p>
                {key !== 'month' && (
                  <>
                    <input type="range" min={min} max={max} step={step} value={params[key] || 0}
                      onChange={e => handleRawChange(key, e.target.value)} className="manual-slider mt-2" />
                    <div className="manual-slider-bounds flex justify-between text-[10px] text-slate-500 mt-1"><span>{min}{unit}</span><span>{max}{unit}</span></div>
                  </>
                )}
              </div>
            ))}
 
            {/* Flood Nearby toggle */}
            <div className="manual-param-row">
              <div className="manual-param-header flex justify-between items-center">
                <span className="manual-param-label font-semibold text-slate-200 text-sm">Flood Nearby</span>
                <span className="manual-param-unit font-bold text-blue-400 text-xs">{params.flood_nearby ? 'Yes' : 'No'}</span>
              </div>
              <p className="manual-param-desc">Is there a flood event nearby?</p>
              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button className={`quick-loc-btn ${params.flood_nearby ? 'active' : ''}`}
                  style={{ flex: 1, background: params.flood_nearby ? '#60a5fa22' : 'transparent', borderColor: params.flood_nearby ? '#60a5fa' : undefined }}
                  onClick={() => setParams(p => ({ ...p, flood_nearby: 1 }))}>Yes</button>
                <button className={`quick-loc-btn ${!params.flood_nearby ? 'active' : ''}`}
                  style={{ flex: 1, background: !params.flood_nearby ? '#10b98122' : 'transparent', borderColor: !params.flood_nearby ? '#10b981' : undefined }}
                  onClick={() => setParams(p => ({ ...p, flood_nearby: 0 }))}>No</button>
              </div>
            </div>
          </div>
        </div>
        {/* Engineered Parameters section */}
        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid #ffffff11', paddingBottom: '0.5rem' }}>
            <span className="section-label" style={{ margin: 0 }}>⚙️ Engineered Features ({LANDSLIDE_ENGINEERED_CONFIG.length})</span>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '13px', cursor: 'pointer', color: '#60a5fa' }}>
              <input type="checkbox" checked={autoCalc} onChange={e => {
                setAutoCalc(e.target.checked);
                if (e.target.checked) {
                  setParams(prev => ({ ...prev, ...calculateLandslideEngineered(prev) }));
                }
              }} style={{ cursor: 'pointer' }} />
              Auto-Calculate
            </label>
          </div>
          
          <div className="manual-params-grid">
            {LANDSLIDE_ENGINEERED_CONFIG.map(([key, label, unit, min, max, step, desc]) => (
              <div key={key} className="manual-param-row" style={{ opacity: autoCalc ? 0.8 : 1, transition: 'opacity 0.2s' }}>
                <div className="manual-param-header flex justify-between items-center">
                  <span className="manual-param-label font-semibold text-slate-200 text-sm" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    {label} {autoCalc && <span style={{ fontSize: '10px', background: '#3b82f620', color: '#60a5fa', padding: '1px 4px', borderRadius: '4px', border: '1px solid #3b82f630' }}>Auto</span>}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      min={min}
                      max={max}
                      step={step}
                      disabled={autoCalc}
                      value={params[key] !== undefined ? params[key] : 0}
                      onChange={e => handleEngineeredChange(key, e.target.value)}
                      className={`w-20 bg-slate-800/80 border rounded px-2 py-0.5 text-xs font-bold text-right outline-none focus:border-blue-500/50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${autoCalc ? 'text-blue-400 border-slate-700/30 cursor-not-allowed opacity-80' : 'text-amber-400 border-amber-500/30'}`}
                    />
                    <span className="text-xs text-slate-400 font-medium">{unit}</span>
                  </div>
                </div>
                <p className="manual-param-desc">{desc}</p>
                <input type="range" min={min} max={max} step={step} value={params[key] !== undefined ? params[key] : 0}
                  disabled={autoCalc}
                  onChange={e => handleEngineeredChange(key, e.target.value)}
                  className={`manual-slider mt-2 ${autoCalc ? 'opacity-50 cursor-not-allowed' : ''}`} />
                <div className="manual-slider-bounds flex justify-between text-[10px] text-slate-500 mt-1"><span>{min}{unit}</span><span>{max}{unit}</span></div>
              </div>
            ))}
          </div>
 
          <button id="landslide-manual-predict-btn" className="gps-btn" style={{ marginTop: '1.5rem', width: '100%' }}
            onClick={handleSubmit} disabled={loading}>
            {loading ? <><div className="spinner-sm" /> Running Model...</> : <><Mountain size={18} /> Predict Landslide Risk</>}
          </button>
        </div>
      </div>

      <div className="manual-result-panel">
        {error && <div className="error-card">{error}</div>}
        {!result && !loading && (
          <div className="empty-card empty-card-lg">
            <Mountain size={48} className="empty-icon" />
            <p>Set landslide parameters on the left and click <strong>Predict Landslide Risk</strong>.</p>
            <p style={{ marginTop: '0.5rem', fontSize: '13px', opacity: 0.6 }}>Passes all 24 training features directly to the ML model for evaluation.</p>
          </div>
        )}
        {loading && (
          <div className="loading-card loading-card-lg">
            <div className="spinner" />
            <p className="loading-text">Running landslide model...</p>
            <p className="loading-sub">Passing 24 training features directly to ML model</p>
          </div>
        )}
        {result && (
          <>
            <div className="glass-card" style={{ marginBottom: '1rem' }}>
              <div className="manual-summary-title"><Mountain size={16} className="icon-amber" /> Landslide Prediction Result</div>
              <div style={{ marginTop: '0.75rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <span className="manual-result-big" style={{ color: getRiskColor(result.landslide_risk_pct) }}>{result.landslide_risk_pct}%</span>
                <span className="pill" style={{ background: getRiskColor(result.landslide_risk_pct) + '33', color: getRiskColor(result.landslide_risk_pct), borderColor: getRiskColor(result.landslide_risk_pct) + '66', fontSize: '15px', padding: '6px 14px' }}>
                  {getRiskLabel(result.landslide_risk_pct)}
                </span>
              </div>
            </div>
            <div className="glass-card" style={{ marginBottom: '1rem' }}>
              <ManualResultBar label="Landslide Risk Details" mlPct={result.raw_ml_probability} capPct={result.physics_cap}
                finalPct={result.landslide_risk_pct} color={getRiskColor(result.landslide_risk_pct)}
                icon={<Mountain size={18} className="icon-amber" />} />
            </div>
            <div className="glass-card live-factors-card">
              <div className="live-factors-title">Evaluation Logic</div>
              <div style={{ fontSize: '13px', color: '#94a3b8', lineHeight: 1.7 }}>
                <p>① <span style={{ color: '#60a5fa' }}>Raw ML ({result.raw_ml_probability}%)</span> — Naive Bayes Model evaluated directly on the 24 input features.</p>
                <p>② <span style={{ color: '#a78bfa' }}>Physics Cap ({result.physics_cap}%)</span> — Calculated using rain, slope (elevation), and soil moisture.</p>
                <p>③ <span style={{ color: '#e2e8f0' }}>Final Risk ({result.landslide_risk_pct}%)</span> — Capped by physical feasibility: min(ML, Physics Cap).</p>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ── Tab wrapper with Flood / Landslide sub-tabs ──
export default function TabManualTest() {
  const [subTab, setSubTab] = useState('flood');

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Sub-tab navigation */}
      <div className="manual-subtabs">
        <button className={`manual-subtab ${subTab === 'flood' ? 'manual-subtab-active manual-subtab-flood' : ''}`}
          onClick={() => setSubTab('flood')}>
          <Droplets size={16} /> Flood Prediction
        </button>
        <button className={`manual-subtab ${subTab === 'landslide' ? 'manual-subtab-active manual-subtab-landslide' : ''}`}
          onClick={() => setSubTab('landslide')}>
          <Mountain size={16} /> Landslide Prediction
        </button>
      </div>
      {/* Sub-tab content */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        {subTab === 'flood' && <FloodManualTest />}
        {subTab === 'landslide' && <LandslideManualTest />}
      </div>
    </div>
  );
}

