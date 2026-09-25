import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { workerApi } from '../../services/api';
import StatCard from '../../components/StatCard';
import { Wallet, Sparkles, Calendar, ShieldCheck, Check, ArrowUpRight } from 'lucide-react';

export default function EarningsPage() {
  const { t } = useLanguage();
  const [earningsData, setEarningsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState(false);
  const [subMsg, setSubMsg] = useState('');

  const fetchEarnings = () => {
    setLoading(true);
    workerApi.getEarnings()
      .then((res) => setEarningsData(res.data))
      .catch((err) => console.warn('Could not load earnings:', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchEarnings();
  }, []);

  const handleBuySubscription = async (days = 1) => {
    setSubscribing(true);
    setSubMsg('');
    try {
      const res = await workerApi.buySubscription(days);
      setSubMsg(res.data.message);
      fetchEarnings();
    } catch (err) {
      alert(err.response?.data?.error || 'Subscription purchase failed');
    } finally {
      setSubscribing(false);
    }
  };

  return (
    <div style={{ maxWidth: '900px', margin: '20px auto' }}>
      <h1 style={{ fontSize: '1.75rem', marginBottom: '8px' }}>
        {t('navEarnings')}
      </h1>
      <p style={{ color: 'var(--color-text-muted)', fontSize: '0.95rem', marginBottom: '24px' }}>
        Cooperative transparent ledger · Zero hidden deductions · Collective welfare fund
      </p>

      {/* Top Stat Cards */}
      <div className="grid-3" style={{ marginBottom: '28px' }}>
        <StatCard
          title={t('totalEarned')}
          value={`₹${earningsData?.summary?.total_earned || '0.00'}`}
          icon={Wallet}
          color="#028090"
          subtitle="96% direct net payout"
        />
        <StatCard
          title={t('welfareContributed')}
          value={`₹${earningsData?.summary?.total_welfare_contributed || '0.00'}`}
          icon={Sparkles}
          color="#02C39A"
          subtitle="2% emergency welfare pool"
        />
        <StatCard
          title="Completed Jobs"
          value={earningsData?.summary?.paid_jobs_count || '0'}
          icon={Calendar}
          color="#16325C"
          subtitle="Direct cooperative bookings"
        />
      </div>

      {/* Flat Subscription Plan Card */}
      <div className="card" style={{ background: '#F0F9FA', borderColor: 'var(--color-teal)', marginBottom: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-teal)', fontWeight: 700, marginBottom: '4px' }}>
              <ShieldCheck size={20} />
              <span>{t('subscriptionStatus')}</span>
            </div>
            <p style={{ fontSize: '0.9rem', color: 'var(--color-navy)' }}>
              Active Through: <strong>{earningsData?.worker?.daily_subscription_paid_through ? new Date(earningsData.worker.daily_subscription_paid_through).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Free Grace Period'}</strong>
            </p>
            <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '4px' }}>
              Flat ₹20/day subscription model (no 25% commissions extracted from your bookings).
            </div>
          </div>

          <button
            onClick={() => handleBuySubscription(1)}
            disabled={subscribing}
            className="btn btn-primary"
          >
            <Check size={18} />
            <span>{subscribing ? 'Activating...' : t('renewSub')}</span>
          </button>
        </div>

        {subMsg && (
          <div style={{ marginTop: '12px', color: '#155724', background: '#D4EDDA', padding: '8px 12px', borderRadius: '6px', fontSize: '0.85rem' }}>
            {subMsg}
          </div>
        )}
      </div>

      {/* Detailed Payout Ledger */}
      <div className="card">
        <h3 style={{ fontSize: '1.25rem', marginBottom: '16px' }}>
          Recent Payouts & Welfare Contributions
        </h3>

        {loading ? (
          <p style={{ color: 'var(--color-text-muted)' }}>Loading payout history...</p>
        ) : !earningsData?.payouts || earningsData.payouts.length === 0 ? (
          <p style={{ color: 'var(--color-text-muted)', padding: '16px 0' }}>
            No payouts logged yet. Completed jobs will appear here automatically.
          </p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--color-border)', textAlign: 'left', color: 'var(--color-text-muted)' }}>
                  <th style={{ padding: '10px 8px' }}>Date</th>
                  <th style={{ padding: '10px 8px' }}>Trade</th>
                  <th style={{ padding: '10px 8px' }}>Customer</th>
                  <th style={{ padding: '10px 8px' }}>Gross Value</th>
                  <th style={{ padding: '10px 8px', color: 'var(--color-teal)' }}>Your Payout (96%)</th>
                  <th style={{ padding: '10px 8px' }}>Welfare (2%)</th>
                </tr>
              </thead>
              <tbody>
                {earningsData.payouts.map((p) => (
                  <tr key={p.payment_id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <td style={{ padding: '10px 8px' }}>{new Date(p.paid_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</td>
                    <td style={{ padding: '10px 8px' }}>{p.category}</td>
                    <td style={{ padding: '10px 8px' }}>{p.customer_name}</td>
                    <td style={{ padding: '10px 8px' }}>₹{p.gross_amount}</td>
                    <td style={{ padding: '10px 8px', fontWeight: 700, color: 'var(--color-teal)' }}>₹{p.worker_payout}</td>
                    <td style={{ padding: '10px 8px', color: 'var(--color-text-muted)' }}>₹{p.welfare_fund_cut}</td>
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
