import React from 'react';
import { Droplets, Mountain, ThermometerSun, Waves, Wind } from 'lucide-react';
import { getRiskBorderClass, getRiskColor, getRiskTextClass, getRiskLabel, getRiskAdvice, getRiskIcon } from '../../utils/riskUtils';
import EvacuationMap from '../EvacuationMap';

export default function PredictionResult({ prediction }) {
  const fp = prediction.predictions.flood_risk_pct;
  const lp = prediction.predictions.landslide_risk_pct;
  const lf = prediction.live_factors;

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-3">
        {/* Flood Risk Card */}
        <div className={`glass-card-blue p-4 rounded-2xl border-l-4 transition-all duration-300 hover:-translate-y-1 ${getRiskBorderClass(fp)}`}>
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-blue-500/20 text-blue-400">
                <Droplets size={16} />
              </div>
              <div className="text-sm font-bold text-slate-200">Flood Risk</div>
            </div>
            <div className={`text-2xl font-extrabold tracking-tight ${getRiskTextClass(fp)}`}>
              {fp}%
            </div>
          </div>
          <div className="w-full h-1 bg-slate-800/50 rounded-full mb-2 overflow-hidden">
            <div 
              className="h-full rounded-full transition-all duration-1000 ease-out"
              style={{ width: `${fp}%`, backgroundColor: getRiskColor(fp) }} 
            />
          </div>
          <div className="flex items-start gap-1.5 text-xs text-slate-400 leading-snug">
            <div className="mt-0.5 shrink-0">{getRiskIcon(fp)}</div>
            <div>
              <span className="font-bold text-slate-200 mr-1">{getRiskLabel(fp)}:</span>
              {getRiskAdvice(fp)}
            </div>
          </div>
        </div>

        {/* Landslide Risk Card */}
        <div className={`glass-card-amber p-4 rounded-2xl border-l-4 transition-all duration-300 hover:-translate-y-1 ${getRiskBorderClass(lp)}`}>
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-amber-500/20 text-amber-400">
                <Mountain size={16} />
              </div>
              <div className="text-sm font-bold text-slate-200">Landslide</div>
            </div>
            <div className={`text-2xl font-extrabold tracking-tight ${getRiskTextClass(lp)}`}>
              {lp}%
            </div>
          </div>
          <div className="w-full h-1 bg-slate-800/50 rounded-full mb-2 overflow-hidden">
            <div 
              className="h-full rounded-full transition-all duration-1000 ease-out"
              style={{ width: `${lp}%`, backgroundColor: getRiskColor(lp) }} 
            />
          </div>
          <div className="flex items-start gap-1.5 text-xs text-slate-400 leading-snug">
            <div className="mt-0.5 shrink-0">{getRiskIcon(lp)}</div>
            <div>
              <span className="font-bold text-slate-200 mr-1">{getRiskLabel(lp)}:</span>
              {getRiskAdvice(lp)}
            </div>
          </div>
        </div>
      </div>

      {/* Live Factors */}
      <div className="glass p-4 rounded-2xl shadow-xl relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent pointer-events-none" />
        <h4 className="text-[10px] font-bold text-slate-300 uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          Live Satellite Factors
        </h4>
        <div className="grid grid-cols-2 gap-2">
          <FactorItem icon={<Droplets size={13}/>} label="Daily Rain" value={`${lf.rainfall_mm} mm`} />
          <FactorItem icon={<Waves size={13}/>} label="7-Day Rain" value={`${lf.antecedent_7day_mm} mm`} />
          <FactorItem icon={<Mountain size={13}/>} label="Elevation" value={`${lf.elevation_m} m`} />
          <FactorItem icon={<ThermometerSun size={13}/>} label="Soil Moist." value={`${(lf.soil_moisture * 100).toFixed(1)}%`} />
          <FactorItem icon={<Waves size={13}/>} label="Discharge" value={`${lf.river_discharge} m³/s`} />
          <FactorItem icon={<Wind size={13}/>} label="Humidity" value={`${lf.humidity_pct}%`} />
        </div>
      </div>

      {/* Explainable AI (XAI) Feature Contributions */}
      {prediction.xai && (prediction.xai.flood_factors.length > 0 || prediction.xai.landslide_factors.length > 0) && (
        <div className="glass p-5 rounded-2xl border border-white/5 shadow-lg">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xl">🧠</span>
            <span className="font-semibold text-sm text-slate-200">AI Decision Drivers (XAI)</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {prediction.xai.flood_factors.length > 0 && (
              <div>
                <h5 className="text-xs font-semibold text-blue-400 mb-3 uppercase tracking-wider">Flood Risk Factors</h5>
                <div className="flex flex-col gap-2">
                  {prediction.xai.flood_factors.map((f, i) => (
                    <div key={i} className="flex justify-between items-center px-3 py-2 bg-blue-500/10 rounded-lg text-xs border border-blue-500/10 transition-colors hover:bg-blue-500/20">
                      <span className="text-slate-300">{f.feature}</span>
                      <span className="font-bold text-blue-300">{f.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {prediction.xai.landslide_factors.length > 0 && (
              <div>
                <h5 className="text-xs font-semibold text-amber-400 mb-3 uppercase tracking-wider">Landslide Risk Factors</h5>
                <div className="flex flex-col gap-2">
                  {prediction.xai.landslide_factors.map((f, i) => (
                    <div key={i} className="flex justify-between items-center px-3 py-2 bg-amber-500/10 rounded-lg text-xs border border-amber-500/10 transition-colors hover:bg-amber-500/20">
                      <span className="text-slate-300">{f.feature}</span>
                      <span className="font-bold text-amber-300">{f.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Evacuation Map for High Risk */}
      {(fp > 70 || lp > 70) && (
        <div className="mt-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="flex items-center gap-3 mb-4 px-2">
            <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center animate-pulse-glow">
              <span className="text-lg">🚨</span>
            </div>
            <span className="font-extrabold text-sm text-red-400 uppercase tracking-[0.2em] drop-shadow-md">High Risk Detected — Evacuation Route</span>
          </div>
          <div className="rounded-3xl overflow-hidden shadow-[0_10px_40px_rgba(239,68,68,0.15)] border border-red-500/30 ring-1 ring-red-500/10">
            <EvacuationMap 
              floodRiskPoint={{ lat: prediction.coordinates.lat, lng: prediction.coordinates.lon }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function FactorItem({ icon, label, value }) {
  return (
    <div className="flex items-center gap-2 p-2 transition-all hover:bg-white/5 rounded-lg group/item cursor-default">
      <div className="w-6 h-6 flex-shrink-0 flex items-center justify-center rounded-md bg-slate-800 text-slate-400 group-hover/item:text-slate-200 group-hover/item:bg-slate-700 transition-colors">
        {icon}
      </div>
      <div className="flex flex-col min-w-0">
        <span className="text-[9px] font-semibold uppercase tracking-wider text-slate-500 truncate">{label}</span>
        <strong className="text-xs font-bold text-slate-200 truncate">{value}</strong>
      </div>
    </div>
  );
}
