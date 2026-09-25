import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { adminApi } from '../../services/api';
import StatCard from '../../components/StatCard';
import { 
  Users, 
  Calendar, 
  Wallet, 
  ShieldCheck, 
  AlertCircle, 
  TrendingUp, 
  UserCheck, 
  ArrowRight,
  Sparkles
} from 'lucide-react';

export default function AdminOverview() {
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi.getOverview()
      .then((res) => setOverview(res.data))
      .catch((err) => console.warn('Could not load overview stats:', err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '40px' }}>Loading federation dashboard...</div>;
  }

  const { federation, workers, bookings, finance, categories, openDisputesCount } = overview || {};

  return (
    <div style={{ maxWidth: '1100px', margin: '20px auto' }}>
      {/* Federation Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', marginBottom: '4px' }}>
            {federation?.name || t('adminTitle')}
          </h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
            Jurisdiction: {federation?.district}, {federation?.state} · Cooperative Readiness Score: <strong>{federation?.readiness_score || 85}/100</strong>
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={() => navigate('/admin/workers')} className="btn btn-primary btn-sm">
            <UserCheck size={16} />
            <span>Worker Roster</span>
          </button>
          <button onClick={() => navigate('/admin/forecast')} className="btn btn-secondary btn-sm">
            <TrendingUp size={16} />
            <span>AI Demand Forecast</span>
          </button>
        </div>
      </div>

      {/* Alert banner if pending workers or open disputes */}
      {((workers?.pending_workers > 0) || (openDisputesCount > 0)) && (
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '24px' }}>
          {workers?.pending_workers > 0 && (
            <div 
              className="card" 
              style={{ flex: 1, minWidth: '280px', background: '#FFF3CD', borderColor: '#FFEEBA', padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}
              onClick={() => navigate('/admin/workers?filter=pending')}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#856404' }}>
                <Users size={20} />
                <span><strong>{workers.pending_workers} Worker(s)</strong> Pending Verification</span>
              </div>
              <ArrowRight size={18} color="#856404" />
            </div>
          )}

          {openDisputesCount > 0 && (
            <div 
              className="card" 
              style={{ flex: 1, minWidth: '280px', background: '#FDEDEC', borderColor: '#FADBD8', padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}
              onClick={() => navigate('/admin/disputes')}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--color-red)' }}>
                <AlertCircle size={20} />
                <span><strong>{openDisputesCount} Open Dispute(s)</strong> Requiring Review</span>
              </div>
              <ArrowRight size={18} color="var(--color-red)" />
            </div>
          )}
        </div>
      )}

      {/* Top 4 Dashboard Metric Cards */}
      <div className="grid-4" style={{ marginBottom: '28px' }}>
        <StatCard
          title={t('totalWorkers')}
          value={workers?.total_workers || 0}
          icon={Users}
          color="#028090"
          subtitle={`${workers?.verified_workers || 0} verified · ${workers?.online_workers || 0} online`}
        />
        <StatCard
          title="Total Bookings"
          value={bookings?.total_bookings || 0}
          icon={Calendar}
          color="#00A896"
          subtitle={`${bookings?.active_bookings || 0} active · ${bookings?.emergency_bookings || 0} emergency`}
        />
        <StatCard
          title="Gross Service Volume"
          value={`₹${finance?.total_gross_volume || '0.00'}`}
          icon={Wallet}
          color="#16325C"
          subtitle={`₹${finance?.total_worker_earnings || '0.00'} paid to workers (96%)`}
        />
        <StatCard
          title={t('welfareBalance')}
          value={`₹${federation?.welfare_fund_balance || '0.00'}`}
          icon={Sparkles}
          color="#02C39A"
          subtitle="Collective insurance & upskilling"
        />
      </div>

      {/* Category Breakdown & Demand Volume */}
      <div className="card" style={{ marginBottom: '28px' }}>
        <div className="card-header">
          <h3 style={{ fontSize: '1.2rem' }}>Service Volume by Trade Category</h3>
          <button onClick={() => navigate('/admin/forecast')} className="btn btn-secondary btn-sm">
            View Predictive Forecasting
          </button>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--color-border)', textAlign: 'left', color: 'var(--color-text-muted)' }}>
                <th style={{ padding: '10px 8px' }}>Trade Category</th>
                <th style={{ padding: '10px 8px' }}>Completed Bookings</th>
                <th style={{ padding: '10px 8px' }}>Gross Revenue</th>
                <th style={{ padding: '10px 8px', color: 'var(--color-teal)' }}>Welfare Pool Contribution</th>
              </tr>
            </thead>
            <tbody>
              {categories && categories.map((cat) => (
                <tr key={cat.category} style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <td style={{ padding: '10px 8px', fontWeight: 600 }}>{cat.category}</td>
                  <td style={{ padding: '10px 8px' }}>{cat.count} bookings</td>
                  <td style={{ padding: '10px 8px' }}>₹{cat.volume.toFixed(2)}</td>
                  <td style={{ padding: '10px 8px', color: '#028090', fontWeight: 600 }}>
                    ₹{(cat.volume * 0.02).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
