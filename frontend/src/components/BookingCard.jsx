import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import EmergencyBadge from './EmergencyBadge';
import { 
  Clock, 
  MapPin, 
  User, 
  Phone, 
  CheckCircle, 
  Play, 
  Star, 
  AlertCircle, 
  Navigation, 
  CreditCard 
} from 'lucide-react';

export default function BookingCard({
  booking,
  role = 'customer',
  onUpdateStatus,
  onOpenRateModal,
  onOpenDisputeModal,
  onPay
}) {
  const { t } = useLanguage();

  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return <span className="badge badge-pending">⏳ Pending Match</span>;
      case 'matched':
        return <span className="badge badge-matched">🤝 Matched / Assigned</span>;
      case 'in_progress':
        return <span className="badge badge-in_progress">⚙️ In Progress</span>;
      case 'completed':
        return <span className="badge badge-completed">✅ Completed</span>;
      case 'cancelled':
        return <span className="badge badge-cancelled">❌ Cancelled</span>;
      default:
        return <span className="badge">{status}</span>;
    }
  };

  const formattedDate = booking.created_at 
    ? new Date(booking.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
    : 'Recent';

  return (
    <div className="card" style={{ marginBottom: '16px' }}>
      <div className="card-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <h3 style={{ fontSize: '1.15rem' }}>
            #{booking.id} · {booking.category}
          </h3>
          <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
            ({booking.mode === 'community' ? '🏛️ Community / Panchayat' : '🏠 Household'})
          </span>
          {booking.is_emergency === 1 && <EmergencyBadge isEmergency={true} />}
        </div>
        <div>
          {getStatusBadge(booking.status)}
        </div>
      </div>

      <div className="grid-2" style={{ marginBottom: '16px' }}>
        <div>
          <p style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', color: 'var(--color-text-muted)', marginBottom: '6px' }}>
            <MapPin size={16} color="#028090" />
            <strong style={{ color: 'var(--color-navy)' }}>Location:</strong> {booking.address || 'Central Area'}
          </p>

          <p style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', color: 'var(--color-text-muted)', marginBottom: '6px' }}>
            <Clock size={16} color="#028090" />
            <strong style={{ color: 'var(--color-navy)' }}>Requested:</strong> {formattedDate}
          </p>

          {role === 'customer' && booking.worker_name && (
            <p style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>
              <User size={16} color="#00A896" />
              <strong style={{ color: 'var(--color-navy)' }}>Worker:</strong> {booking.worker_name}
              {booking.worker_rating && <span>(⭐ {booking.worker_rating})</span>}
              {booking.worker_phone && <span>· 📞 {booking.worker_phone}</span>}
            </p>
          )}

          {role === 'worker' && booking.customer_name && (
            <p style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>
              <User size={16} color="#00A896" />
              <strong style={{ color: 'var(--color-navy)' }}>Customer:</strong> {booking.customer_name}
              {booking.customer_phone && <span>· 📞 {booking.customer_phone}</span>}
            </p>
          )}
        </div>

        {/* Pricing / Payout Split info */}
        <div style={{ background: '#F8FAFC', padding: '12px 16px', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>Booking Amount:</span>
            <strong style={{ color: 'var(--color-navy)', fontSize: '1.05rem' }}>₹{booking.price || '400.00'}</strong>
          </div>
          {role === 'worker' ? (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: '#028090' }}>
                <span>Your Payout (96%):</span>
                <strong>₹{booking.worker_payout || ((booking.price || 400) * 0.96).toFixed(2)}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                <span>Coop Welfare Cut (2%):</span>
                <span>₹{booking.welfare_fund_cut || ((booking.price || 400) * 0.02).toFixed(2)}</span>
              </div>
            </>
          ) : (
            <div style={{ fontSize: '0.8rem', color: '#00A896', marginTop: '4px' }}>
              ✓ 96% worker direct payout · 2% welfare fund contribution
            </div>
          )}
          {booking.rating_stars && (
            <div style={{ marginTop: '6px', fontSize: '0.85rem', color: '#D97706', fontWeight: 600 }}>
              ⭐ Rating Given: {booking.rating_stars} / 5
            </div>
          )}
        </div>
      </div>

      {/* Action Footer */}
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'flex-end', borderTop: '1px solid #EEF2F6', paddingTop: '12px' }}>
        {/* Worker Actions */}
        {role === 'worker' && (
          <>
            {booking.status === 'matched' && (
              <button 
                onClick={() => onUpdateStatus && onUpdateStatus(booking.id, 'in_progress')}
                className="btn btn-primary btn-sm"
              >
                <Play size={15} />
                <span>{t('btnStart')}</span>
              </button>
            )}

            {booking.status === 'in_progress' && (
              <button 
                onClick={() => onUpdateStatus && onUpdateStatus(booking.id, 'completed')}
                className="btn btn-mint btn-sm"
              >
                <CheckCircle size={15} />
                <span>{t('btnComplete')}</span>
              </button>
            )}

            <a 
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(booking.address || '')}`} 
              target="_blank" 
              rel="noreferrer"
              className="btn btn-secondary btn-sm"
            >
              <Navigation size={14} />
              <span>{t('btnNavigate')}</span>
            </a>
          </>
        )}

        {/* Customer Actions */}
        {role === 'customer' && (
          <>
            {booking.status === 'completed' && !booking.rating_stars && (
              <button 
                onClick={() => onOpenRateModal && onOpenRateModal(booking)}
                className="btn btn-primary btn-sm"
              >
                <Star size={15} />
                <span>{t('rateJob')}</span>
              </button>
            )}

            {booking.status === 'completed' && !booking.dispute_status && (
              <button 
                onClick={() => onOpenDisputeModal && onOpenDisputeModal(booking)}
                className="btn btn-secondary btn-sm"
                style={{ color: 'var(--color-red)' }}
              >
                <AlertCircle size={15} />
                <span>{t('raiseDispute')}</span>
              </button>
            )}

            {booking.status === 'pending' && (
              <button 
                onClick={() => onUpdateStatus && onUpdateStatus(booking.id, 'cancelled')}
                className="btn btn-secondary btn-sm"
                style={{ color: 'var(--color-red)' }}
              >
                Cancel Booking
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
