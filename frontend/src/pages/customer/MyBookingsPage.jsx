import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { bookingApi } from '../../services/api';
import BookingCard from '../../components/BookingCard';
import { Star, AlertCircle, X, Check, Upload, Calendar } from 'lucide-react';

export default function MyBookingsPage() {
  const { t } = useLanguage();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  // Rate Modal State
  const [ratingBooking, setRatingBooking] = useState(null);
  const [stars, setStars] = useState(5);
  const [ratingComment, setRatingComment] = useState('');
  const [evidenceUrl, setEvidenceUrl] = useState('');
  const [ratingError, setRatingError] = useState('');
  const [submittingRating, setSubmittingRating] = useState(false);

  // Dispute Modal State
  const [disputeBooking, setDisputeBooking] = useState(null);
  const [disputeReason, setDisputeReason] = useState('');
  const [disputeEvidence, setDisputeEvidence] = useState('');
  const [disputeError, setDisputeError] = useState('');
  const [submittingDispute, setSubmittingDispute] = useState(false);

  const fetchBookings = () => {
    setLoading(true);
    bookingApi.getMyBookings()
      .then((res) => setBookings(res.data.bookings || []))
      .catch((err) => console.warn('Fetch bookings failed:', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const handleUpdateStatus = async (bookingId, status) => {
    try {
      await bookingApi.updateStatus(bookingId, status);
      fetchBookings();
    } catch (err) {
      alert(err.response?.data?.error || 'Status update failed');
    }
  };

  const handleOpenRateModal = (booking) => {
    setRatingBooking(booking);
    setStars(5);
    setRatingComment('');
    setEvidenceUrl('');
    setRatingError('');
  };

  const handleSubmitRating = async (e) => {
    e.preventDefault();
    if (!ratingBooking) return;
    setRatingError('');

    if (stars < 3 && (!evidenceUrl.trim() && (!ratingComment || ratingComment.trim().length < 10))) {
      setRatingError(t('evidenceRequired'));
      return;
    }

    setSubmittingRating(true);
    try {
      await bookingApi.rateBooking(ratingBooking.id, {
        stars,
        comment: ratingComment,
        evidenceUrl: evidenceUrl.trim() || undefined
      });
      setRatingBooking(null);
      fetchBookings();
    } catch (err) {
      setRatingError(err.response?.data?.error || 'Failed to submit rating');
    } finally {
      setSubmittingRating(false);
    }
  };

  const handleOpenDisputeModal = (booking) => {
    setDisputeBooking(booking);
    setDisputeReason('');
    setDisputeEvidence('');
    setDisputeError('');
  };

  const handleSubmitDispute = async (e) => {
    e.preventDefault();
    if (!disputeBooking) return;
    setDisputeError('');

    if (!disputeReason.trim() || disputeReason.trim().length < 5) {
      setDisputeError('Please provide a detailed explanation of the defect or issue.');
      return;
    }

    setSubmittingDispute(true);
    try {
      await bookingApi.raiseDispute(disputeBooking.id, {
        reason: disputeReason,
        evidenceUrl: disputeEvidence.trim() || undefined
      });
      setDisputeBooking(null);
      fetchBookings();
    } catch (err) {
      setDisputeError(err.response?.data?.error || 'Failed to raise dispute');
    } finally {
      setSubmittingDispute(false);
    }
  };

  return (
    <div style={{ maxWidth: '850px', margin: '20px auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1 style={{ fontSize: '1.75rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Calendar size={24} color="#028090" />
          <span>{t('navBookings')}</span>
        </h1>
        <button onClick={fetchBookings} className="btn btn-secondary btn-sm">
          Refresh List
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--color-text-muted)' }}>
          Loading your bookings...
        </div>
      ) : bookings.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
          <p style={{ color: 'var(--color-text-muted)', marginBottom: '16px' }}>
            You have no active or completed bookings yet.
          </p>
          <a href="/customer/book" className="btn btn-primary">
            Book Your First Service
          </a>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {bookings.map((b) => (
            <BookingCard
              key={b.id}
              booking={b}
              role="customer"
              onUpdateStatus={handleUpdateStatus}
              onOpenRateModal={handleOpenRateModal}
              onOpenDisputeModal={handleOpenDisputeModal}
            />
          ))}
        </div>
      )}

      {/* Rate & Review Modal */}
      {ratingBooking && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: '16px' }}>
          <div className="card" style={{ maxWidth: '480px', width: '100%', animation: 'slideUp 0.2s ease' }}>
            <div className="card-header">
              <h3 style={{ fontSize: '1.2rem' }}>{t('rateJob')} (Booking #{ratingBooking.id})</h3>
              <button onClick={() => setRatingBooking(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            {ratingError && (
              <div style={{ background: '#FDEDEC', border: '1px solid #FADBD8', color: 'var(--color-red)', padding: '10px', borderRadius: '8px', marginBottom: '14px', fontSize: '0.85rem' }}>
                {ratingError}
              </div>
            )}

            <form onSubmit={handleSubmitRating}>
              <div className="form-group">
                <label className="form-label">{t('starCount')}:</label>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
                  {[1, 2, 3, 4, 5].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setStars(num)}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: num <= stars ? '#F59E0B' : '#D1D5DB'
                      }}
                    >
                      <Star size={32} fill={num <= stars ? '#F59E0B' : 'none'} />
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Review Comment</label>
                <textarea
                  className="form-textarea"
                  placeholder="Share feedback on worker punctuality and quality..."
                  value={ratingComment}
                  onChange={(e) => setRatingComment(e.target.value)}
                />
              </div>

              {stars < 3 && (
                <div style={{ background: '#FDEDEC', padding: '12px', borderRadius: '8px', marginBottom: '14px', border: '1px solid #FADBD8' }}>
                  <label className="form-label" style={{ color: 'var(--color-red)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Upload size={16} />
                    <span>{t('evidenceUrl')}</span>
                  </label>
                  <input
                    type="url"
                    className="form-input"
                    placeholder="https://example.com/photo_evidence.jpg"
                    value={evidenceUrl}
                    onChange={(e) => setEvidenceUrl(e.target.value)}
                  />
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                    Per cooperative bylaws, sub-3-star reviews require evidence or a detailed comment to prevent unfair penalties against workers.
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '16px' }}>
                <button type="button" onClick={() => setRatingBooking(null)} className="btn btn-secondary btn-sm">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary btn-sm" disabled={submittingRating}>
                  <Check size={16} />
                  <span>{submittingRating ? 'Submitting...' : t('submitRating')}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Raise Dispute Modal */}
      {disputeBooking && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: '16px' }}>
          <div className="card" style={{ maxWidth: '500px', width: '100%', animation: 'slideUp 0.2s ease' }}>
            <div className="card-header">
              <h3 style={{ fontSize: '1.2rem', color: 'var(--color-red)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertCircle size={20} />
                <span>{t('raiseDispute')}</span>
              </h3>
              <button onClick={() => setDisputeBooking(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            {disputeError && (
              <div style={{ background: '#FDEDEC', border: '1px solid #FADBD8', color: 'var(--color-red)', padding: '10px', borderRadius: '8px', marginBottom: '14px', fontSize: '0.85rem' }}>
                {disputeError}
              </div>
            )}

            <form onSubmit={handleSubmitDispute}>
              <div style={{ background: '#FFF3CD', padding: '10px 14px', borderRadius: '8px', marginBottom: '14px', fontSize: '0.85rem', color: '#856404' }}>
                ⚠️ Filing a dispute will immediately freeze payment in escrow. Your local Labour Cooperative Federation Admin will adjudicate the claim.
              </div>

              <div className="form-group">
                <label className="form-label">Dispute Reason & Description</label>
                <textarea
                  required
                  className="form-textarea"
                  placeholder={t('disputeReason')}
                  value={disputeReason}
                  onChange={(e) => setDisputeReason(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Photo/Document Evidence URL (Optional)</label>
                <input
                  type="url"
                  className="form-input"
                  placeholder="https://example.com/photo.jpg"
                  value={disputeEvidence}
                  onChange={(e) => setDisputeEvidence(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '16px' }}>
                <button type="button" onClick={() => setDisputeBooking(null)} className="btn btn-secondary btn-sm">
                  Cancel
                </button>
                <button type="submit" className="btn btn-danger btn-sm" disabled={submittingDispute}>
                  <span>{submittingDispute ? 'Freezing Escrow...' : 'File Dispute & Hold Payment'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
