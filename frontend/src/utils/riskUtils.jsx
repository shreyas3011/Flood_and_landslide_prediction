import React from 'react';
import { AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

export function getRiskColor(pct) {
  if (pct < 30) return '#10b981';
  if (pct < 60) return '#f59e0b';
  return '#ef4444';
}

export function getRiskTextClass(pct) {
  if (pct < 30) return 'text-emerald-500';
  if (pct < 60) return 'text-amber-500';
  return 'text-red-500';
}

export function getRiskBorderClass(pct) {
  if (pct < 30) return 'border-emerald-500/30';
  if (pct < 60) return 'border-amber-500/30';
  return 'border-red-500/30';
}

export function getRiskLabel(pct) {
  if (pct < 30) return 'Low Risk';
  if (pct < 60) return 'Moderate Risk';
  return 'High Risk';
}

export function getRiskAdvice(pct) {
  if (pct < 30) return 'Normal activity. No immediate concern.';
  if (pct < 60) return 'Monitor local weather. Stay informed.';
  return 'Immediate action recommended. Seek safe ground.';
}

export function getRiskIcon(pct) {
  if (pct < 30) return <CheckCircle size={20} className="text-emerald-500" />;
  if (pct < 60) return <AlertTriangle size={20} className="text-amber-500" />;
  return <XCircle size={20} className="text-red-500" />;
}
