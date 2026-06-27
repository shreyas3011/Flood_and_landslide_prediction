import L from 'leaflet';
import { ZONE_COLORS } from '../data/safeZones';

export const fmtDist = m => m >= 1000 ? `${(m / 1000).toFixed(1)} km` : `${m} m`;
export const fmtTime = s => { 
  const h = Math.floor(s / 3600); 
  const m = Math.floor((s % 3600) / 60); 
  return h > 0 ? `${h} hr ${m} min` : `${m} min`; 
};

export const ZONE_META = {
  hospital:    { emoji: '🏥', label: 'Hospital',      color: '#10b981' },
  clinic:      { emoji: '🩺', label: 'Clinic',        color: '#06b6d4' },
  pharmacy:    { emoji: '💊', label: 'Pharmacy',      color: '#8b5cf6' },
  fire_station:{ emoji: '🚒', label: 'Fire/Rescue',   color: '#ef4444' },
  police:      { emoji: '🚔', label: 'Police',        color: '#3b82f6' },
  shelter:     { emoji: '🏠', label: 'Shelter',       color: '#f59e0b' },
  relief_camp: { emoji: '⛺', label: 'Relief Camp',   color: '#378ADD' },
};


export function makeSafeZoneIcon(type) {
  const meta = ZONE_META[type] || ZONE_META.shelter;
  return L.divIcon({
    className: '',
    html: `<div style="
      width:30px;height:30px;border-radius:50% 50% 50% 0;
      background:${meta.color};border:2px solid #fff;
      transform:rotate(-45deg);display:flex;align-items:center;
      justify-content:center;box-shadow:0 2px 8px rgba(0,0,0,0.35)
    "><span style="transform:rotate(45deg);font-size:13px;line-height:1">${meta.emoji}</span></div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 30],
    popupAnchor: [0, -32],
  });
}
