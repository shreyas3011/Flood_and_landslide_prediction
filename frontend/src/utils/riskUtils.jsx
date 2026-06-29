import React from 'react';
import { AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

export function getRiskColor(pct) {
  if (pct <= 15) return '#10b981'; // Very Low: Emerald Green
  if (pct <= 35) return '#06b6d4'; // Low: Cyan
  if (pct <= 50) return '#f59e0b'; // Moderate: Amber
  if (pct <= 65) return '#f97316'; // High: Orange
  return '#ef4444';                // Very High: Red
}

export function getRiskTextClass(pct) {
  if (pct <= 15) return 'text-emerald-500';
  if (pct <= 35) return 'text-cyan-500';
  if (pct <= 50) return 'text-amber-500';
  if (pct <= 65) return 'text-orange-500';
  return 'text-red-500';
}

export function getRiskBorderClass(pct) {
  if (pct <= 15) return 'border-emerald-500/30';
  if (pct <= 35) return 'border-cyan-500/30';
  if (pct <= 50) return 'border-amber-500/30';
  if (pct <= 65) return 'border-orange-500/30';
  return 'border-red-500/30';
}

export function getRiskLabel(pct) {
  if (pct <= 15) return 'Very Low';
  if (pct <= 35) return 'Low';
  if (pct <= 50) return 'Moderate';
  if (pct <= 65) return 'High';
  return 'Very High';
}

export function getRiskAdvice(pct) {
  if (pct <= 15) return 'Normal activity. No immediate concern.';
  if (pct <= 35) return 'Keep an eye on weather. Low chance of event.';
  if (pct <= 50) return 'Monitor local weather. Stay informed.';
  if (pct <= 65) return 'Be prepared. High chance of event.';
  return 'Immediate action recommended. Seek safe ground.';
}

export function getRiskIcon(pct) {
  if (pct <= 15) return <CheckCircle size={20} className="text-emerald-500" />;
  if (pct <= 35) return <CheckCircle size={20} className="text-cyan-500" />;
  if (pct <= 50) return <AlertTriangle size={20} className="text-amber-500" />;
  if (pct <= 65) return <AlertTriangle size={20} className="text-orange-500" />;
  return <XCircle size={20} className="text-red-500" />;
}
