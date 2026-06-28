import React from 'react';
import { fmtDist, fmtTime, ZONE_META } from '../../utils/mapUtils';
import { MapPin, Clock, ShieldAlert } from 'lucide-react';
import { useSettings } from '../../context/SettingsContext';

export default function NearestSafeZonesPanel({ zones, loading }) {
  const { t } = useSettings();
  if (!loading && zones.length === 0) return null;
  return (
    <div className="glass p-4 rounded-2xl mt-3 border border-slate-200/10 dark:border-white/5 shadow-lg transition-all duration-300 hover:border-slate-300/20 dark:hover:border-white/10">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-500/20 shrink-0">
          <ShieldAlert size={18} className="text-white" />
        </div>
        <div>
          <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200">{t('nearestSafeZonesHeader')}</h3>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">{t('rankedByDriveTime')}</p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 py-3 text-slate-500 dark:text-slate-400 text-xs font-medium">
          <div className="w-4 h-4 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin shrink-0" />
          {t('findingNearestSafeZones')}
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {zones.map((item, i) => {
            const meta = ZONE_META[item.zone.type] || ZONE_META.shelter;
            const isNearest = i === 0;
            return (
              <div key={item.zone.id} className={`relative flex items-start gap-3 p-3 rounded-xl border transition-all duration-300 hover:scale-[1.01] ${isNearest ? 'bg-slate-100/50 dark:bg-white/5 border-slate-200 dark:border-white/10' : 'bg-transparent border-slate-200/30 dark:border-white/5 hover:bg-slate-100/30 dark:hover:bg-white/5'}`}>
                {isNearest && (
                  <div className="absolute -top-2 right-2 bg-indigo-500 text-white text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider shadow-md">
                    {t('nearestBadge')}
                  </div>
                )}
                
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0 border bg-slate-200/20 dark:bg-white/5 border-slate-300/30 dark:border-white/10 shadow-sm">
                  {meta.emoji}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-xs text-slate-800 dark:text-slate-200 truncate pr-8">
                    {item.zone.name}
                  </div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 capitalize font-medium">
                    {meta.label} · {item.zone.state}
                  </div>
                  <div className="flex gap-2 mt-2">
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-indigo-600 dark:text-indigo-300 bg-indigo-500/10 px-2 py-0.5 rounded-full border border-indigo-500/20">
                      <MapPin size={10} /> {fmtDist(item.distanceM)}
                    </span>
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-purple-600 dark:text-purple-300 bg-purple-500/10 px-2 py-0.5 rounded-full border border-purple-500/20">
                      <Clock size={10} /> {fmtTime(item.durationSec)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
