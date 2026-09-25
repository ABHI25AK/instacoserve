import React from 'react';
import { AlertTriangle } from 'lucide-react';

export default function EmergencyBadge({ isEmergency }) {
  if (!isEmergency) return null;

  return (
    <span className="badge badge-emergency" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
      <AlertTriangle size={14} color="#C0392B" />
      <span>EMERGENCY PROXIMITY-FIRST</span>
    </span>
  );
}
