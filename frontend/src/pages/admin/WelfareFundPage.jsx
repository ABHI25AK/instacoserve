import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { adminApi } from '../../services/api';
import StatCard from '../../components/StatCard';
import { Sparkles, HeartPulse, GraduationCap, AlertTriangle, CheckCircle, ShieldCheck } from 'lucide-react';

export default function WelfareFundPage() {
  const { t } = useLanguage();
  const [fundData, setFundData] = useState(null);
  const [trainingFlags, setTrainingFlags] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      adminApi.getWelfareFund(),
      adminApi.getTrainingFlags()
    ])
      .then(([fundRes, flagRes]) => {
        setFundData(fundRes.data);
        setTrainingFlags(flagRes.data.flags || []);
      })
      .catch((err) => console.warn('Welfare fund load error:', err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '40px' }}>Loading welfare fund ledger...</div>;
  }

  const { federation, contributions = [] } = fundData || {};

  return (
    <div style={{ maxWidth: '1100px', margin: '20px auto' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '1.75rem', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Sparkles size={28} color="#02C39A" />
          <span>Federation Worker Welfare & Quality Governance</span>
        </h1>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
          2% automatic deduction on every paid booking goes directly into this federation-governed social security & training pool.
        </p>
      </div>

      {/* Metric Cards */}
      <div className="grid-3" style={{ marginBottom: '28px' }}>
        <StatCard
          title={t('welfareBalance')}
          value={`₹${federation?.welfare_fund_balance || '0.00'}`}
          icon={Sparkles}
          color="#02C39A"
          subtitle="Available for health, insurance & upskilling"
        />
        <StatCard
          title="Total Contributions Logged"
          value={contributions.length}
          icon={CheckCircle}
          color="#028090"
          subtitle="From completed gig bookings"
        />
        <StatCard
          title="Workers in Upskilling / Review"
          value={trainingFlags.length}
          icon={GraduationCap}
          color="#C0392B"
          subtitle="Quality governance alerts"
        />
      </div>

      {/* Welfare-Fund Linked Training & Quality Governance Alerts */}
      {trainingFlags.length > 0 && (
        <div className="card" style={{ marginBottom: '28px', background: '#FFFDF5', borderColor: '#F59E0B' }}>
          <div className="card-header" style={{ borderColor: '#FDE68A' }}>
            <h3 style={{ fontSize: '1.2rem', color: '#B45309', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertTriangle size={20} />
              <span>Welfare-Fund Linked Upskilling Flagged Members ({trainingFlags.length})</span>
            </h3>
            <span style={{ fontSize: '0.8rem', color: '#92400E' }}>
              Supportive Governance (Not Silent Deactivation)
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {trainingFlags.map((flag) => (
              <div key={flag.id} className="card" style={{ padding: '14px 18px', background: '#ffffff' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <strong>{flag.worker_name} ({flag.skill_category}) · 📞 {flag.worker_phone}</strong>
                  <span className="badge badge-emergency">{flag.status.toUpperCase()}</span>
                </div>
                <p style={{ fontSize: '0.88rem', color: 'var(--color-navy)', marginBottom: '8px' }}>
                  {flag.reason}
                </p>
                <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                  Current Rating: ⭐ {flag.rating_avg} / 5 · Total Jobs: {flag.jobs_completed} · Action: Sponsored 2-day technical refresher module funded via welfare balance.
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Detailed Ledger Table */}
      <div className="card">
        <h3 style={{ fontSize: '1.2rem', marginBottom: '16px' }}>
          Welfare Contribution Transaction Ledger
        </h3>

        {contributions.length === 0 ? (
          <p style={{ color: 'var(--color-text-muted)', padding: '16px 0' }}>No welfare contributions recorded yet.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--color-border)', textAlign: 'left', color: 'var(--color-text-muted)' }}>
                  <th style={{ padding: '10px 8px' }}>Date</th>
                  <th style={{ padding: '10px 8px' }}>Booking ID</th>
                  <th style={{ padding: '10px 8px' }}>Trade</th>
                  <th style={{ padding: '10px 8px' }}>Worker</th>
                  <th style={{ padding: '10px 8px' }}>Gross Value</th>
                  <th style={{ padding: '10px 8px', color: '#02C39A', fontWeight: 700 }}>2% Welfare Credit</th>
                </tr>
              </thead>
              <tbody>
                {contributions.map((c) => (
                  <tr key={c.payment_id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <td style={{ padding: '10px 8px' }}>{new Date(c.created_at).toLocaleDateString()}</td>
                    <td style={{ padding: '10px 8px' }}>#{c.booking_id}</td>
                    <td style={{ padding: '10px 8px' }}>{c.category}</td>
                    <td style={{ padding: '10px 8px' }}>{c.worker_name}</td>
                    <td style={{ padding: '10px 8px' }}>₹{c.gross_booking_value}</td>
                    <td style={{ padding: '10px 8px', color: '#02C39A', fontWeight: 700 }}>+₹{c.welfare_fund_cut}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
