import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { workerApi, bookingApi } from '../../services/api';
import BookingCard from '../../components/BookingCard';
import StatCard from '../../components/StatCard';
import { 
  Power, 
  Wallet, 
  CheckCircle, 
  Clock, 
  ShieldAlert, 
  Calendar, 
  RefreshCw,
  Sparkles
} from 'lucide-react';

export default function WorkerDashboard() {
  const { user, refreshUser } = useAuth();
  const { t } = useLanguage();

  const [available, setAvailable] = useState(true);
  const [earningsSummary, setEarningsSummary] = useState(null);
  const [assignedJobs, setAssignedJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toggleLoading, setToggleLoading] = useState(false);

  const fetchWorkerData = () => {
    setLoading(true);
    Promise.all([
      workerApi.getEarnings(),
      bookingApi.getMyBookings()
    ])
      .then(([earnRes, bookRes]) => {
        setEarningsSummary(earnRes.data.summary);
        if (earnRes.data.worker) {
          setAvailable(!!earnRes.data.worker.available);
        }
        setAssignedJobs(bookRes.data.bookings || []);
      })
      .catch((err) => console.warn('Worker load error:', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchWorkerData();
  }, []);

  const handleToggleAvailability = async () => {
    setToggleLoading(true);
    const newStatus = !available;
    try {
      await workerApi.toggleAvailability(newStatus);
      setAvailable(newStatus);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to toggle availability');
    } finally {
      setToggleLoading(false);
    }
  };

  const handleUpdateStatus = async (bookingId, status) => {
    try {
      await bookingApi.updateStatus(bookingId, status);
      fetchWorkerData();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to update job status');
    }
  };

  const activeJobs = assignedJobs.filter((j) => ['matched', 'in_progress'].includes(j.status));
  const completedJobs = assignedJobs.filter((j) => j.status === 'completed');

  return (
    <div style={{ maxWidth: '900px', margin: '20px auto' }}>
      {/* Verification notice if not verified */}
      {user?.workerProfile && !user.workerProfile.verified && (
        <div style={{ background: '#FFF3CD', border: '1px solid #FFEEBA', color: '#856404', padding: '16px', borderRadius: '12px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <ShieldAlert size={24} />
          <div>
            <strong>Cooperative Membership Under Review:</strong> Your profile has been submitted to your federation administrator for verification. You will be able to receive incoming bookings once approved.
          </div>
        </div>
      )}

      {/* TOP CONTROL: Large Unambiguous Availability Toggle */}
      <div 
        className="card" 
        style={{ 
          background: available ? '#E8F8F5' : '#FDEDEC', 
          borderColor: available ? '#A3E4D7' : '#FADBD8',
          marginBottom: '24px',
          padding: '24px',
          textAlign: 'center'
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '1.25rem', fontWeight: 700, color: available ? '#0E6251' : 'var(--color-red)' }}>
            <Power size={28} />
            <span>{available ? t('workerStatusOnline') : t('workerStatusOffline')}</span>
          </div>

          <p style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', maxWidth: '500px' }}>
            {available 
              ? 'You are active on the cooperative map and receiving immediate dispatch offers.' 
              : 'You will not receive new matching offers until toggled online.'}
          </p>

          <button
            onClick={handleToggleAvailability}
            disabled={toggleLoading}
            className={`btn ${available ? 'btn-danger' : 'btn-mint'}`}
            style={{ minHeight: '48px', minWidth: '220px', fontSize: '1rem' }}
          >
            <Power size={20} />
            <span>{toggleLoading ? 'Updating...' : t('toggleAvailability')}</span>
          </button>
        </div>
      </div>

      {/* Plain-Language Earnings & Subscription Summary Cards */}
      <div className="grid-3" style={{ marginBottom: '28px' }}>
        <StatCard
          title={t('totalEarned')}
          value={`₹${earningsSummary?.total_earned || '0.00'}`}
          icon={Wallet}
          color="#028090"
          subtitle="96% direct payout retained"
        />
        <StatCard
          title="Jobs Completed"
          value={earningsSummary?.paid_jobs_count || '0'}
          icon={CheckCircle}
          color="#02C39A"
          subtitle="Cooperative verified tasks"
        />
        <StatCard
          title={t('welfareContributed')}
          value={`₹${earningsSummary?.total_welfare_contributed || '0.00'}`}
          icon={Sparkles}
          color="#16325C"
          subtitle="2% pooled for medical/safety"
        />
      </div>

      {/* Assigned & Active Jobs Section */}
      <div style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h2 style={{ fontSize: '1.4rem' }}>{t('activeAssignedJobs')} ({activeJobs.length})</h2>
          <button onClick={fetchWorkerData} className="btn btn-secondary btn-sm">
            <RefreshCw size={15} />
            <span>Refresh</span>
          </button>
        </div>

        {activeJobs.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '36px', color: 'var(--color-text-muted)' }}>
            <Clock size={32} color="#028090" style={{ margin: '0 auto 12px' }} />
            <p>{t('noActiveJobs')}</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {activeJobs.map((job) => (
              <BookingCard
                key={job.id}
                booking={job}
                role="worker"
                onUpdateStatus={handleUpdateStatus}
              />
            ))}
          </div>
        )}
      </div>

      {/* Completed Jobs History */}
      {completedJobs.length > 0 && (
        <div>
          <h2 style={{ fontSize: '1.3rem', marginBottom: '14px' }}>Completed Jobs ({completedJobs.length})</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {completedJobs.slice(0, 5).map((job) => (
              <BookingCard key={job.id} booking={job} role="worker" />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
