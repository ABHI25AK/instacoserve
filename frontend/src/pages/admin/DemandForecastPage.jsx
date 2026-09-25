import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { adminApi } from '../../services/api';
import { TrendingUp, TrendingDown, Minus, Sparkles, Calendar, BarChart3 } from 'lucide-react';

export default function DemandForecastPage() {
  const { t } = useLanguage();
  const [forecasts, setForecasts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi.getForecast()
      .then((res) => setForecasts(res.data.forecasts || []))
      .catch((err) => console.warn('Could not load forecast:', err))
      .finally(() => setLoading(false));
  }, []);

  const getTrendBadge = (trend, slope) => {
    if (trend === 'rising') {
      return (
        <span className="badge" style={{ background: '#D4EDDA', color: '#155724', display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.85rem' }}>
          <TrendingUp size={16} />
          <strong>{t('trendRising')} (+{(slope * 100).toFixed(0)}%/day)</strong>
        </span>
      );
    }
    if (trend === 'falling') {
      return (
        <span className="badge" style={{ background: '#F8D7DA', color: '#721C24', display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.85rem' }}>
          <TrendingDown size={16} />
          <strong>{t('trendFalling')}</strong>
        </span>
      );
    }
    return (
      <span className="badge" style={{ background: '#E2E3E5', color: '#383D41', display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.85rem' }}>
        <Minus size={16} />
        <strong>{t('trendStable')}</strong>
      </span>
    );
  };

  return (
    <div style={{ maxWidth: '1100px', margin: '20px auto' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '1.75rem', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <TrendingUp size={28} color="#028090" />
          <span>{t('demandForecastTitle')}</span>
        </h1>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.95rem' }}>
          {t('forecastSubtitle')} · Mathematical OLS Regression (\hat{y} = \alpha + \beta x)
        </p>
      </div>

      {loading ? (
        <p style={{ color: 'var(--color-text-muted)', padding: '30px' }}>Computing mathematical linear regression trends...</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {forecasts.map((f) => (
            <div key={f.category} className="card">
              <div className="card-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <h3 style={{ fontSize: '1.25rem' }}>{f.category}</h3>
                  {getTrendBadge(f.trend_direction, f.growth_rate_per_day)}
                </div>
                <div style={{ fontSize: '0.9rem', color: 'var(--color-navy)', fontWeight: 600 }}>
                  Predicted Next 7 Days: <span style={{ color: 'var(--color-teal)', fontSize: '1.1rem' }}>{f.total_predicted_next_week} bookings</span>
                </div>
              </div>

              {/* 7-Day Visual Forecast Bars */}
              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Calendar size={15} />
                  <span>7-Day Ahead Daily Projections:</span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '10px' }}>
                  {f.forecast_7_days.map((day, idx) => (
                    <div 
                      key={idx} 
                      style={{ 
                        background: '#F8FAFC', 
                        border: '1px solid var(--color-border)', 
                        borderRadius: '8px', 
                        padding: '10px 6px', 
                        textAlign: 'center' 
                      }}
                    >
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '4px' }}>
                        {new Date(day.date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric' })}
                      </div>
                      <div style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--color-teal)' }}>
                        {day.predicted_bookings}
                      </div>
                      <div style={{ fontSize: '0.68rem', color: 'var(--color-text-muted)' }}>
                        bookings
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', background: '#F0F9FA', padding: '10px 14px', borderRadius: '6px' }}>
                💡 <strong>Federation Planning Recommendation:</strong> {f.trend_direction === 'rising' ? `Demand for ${f.category} is expanding (+${(f.growth_rate_per_day * 100).toFixed(0)}%/day). Onboard or mobilize 2-3 additional verified members to maintain sub-15-minute response times.` : `Current capacity for ${f.category} is balanced with steady weekly volume.`}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
