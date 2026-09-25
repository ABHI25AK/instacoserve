import React from 'react';

export default function StatCard({ title, value, icon: Icon, subtitle, color = '#028090' }) {
  return (
    <div className="stat-card">
      {Icon && (
        <div className="stat-icon" style={{ color, background: `${color}15` }}>
          <Icon size={26} />
        </div>
      )}
      <div style={{ flex: 1 }}>
        <div className="stat-label">{title}</div>
        <div className="stat-value">{value}</div>
        {subtitle && (
          <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>
            {subtitle}
          </div>
        )}
      </div>
    </div>
  );
}
