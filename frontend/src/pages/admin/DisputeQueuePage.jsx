import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { adminApi } from '../../services/api';
import { AlertCircle, CheckCircle2, XCircle, FileText, Image as ImageIcon, X, Check } from 'lucide-react';

export default function DisputeQueuePage() {
  const { t } = useLanguage();
  const [disputes, setDisputes] = useState([]);
  const [loading, setLoading] = useState(true);

  // Resolution Modal State
  const [selectedDispute, setSelectedDispute] = useState(null);
  const [action, setAction] = useState('release_to_worker'); // 'release_to_worker' or 'refund_customer'
  const [resolutionNote, setResolutionNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchDisputes = () => {
    setLoading(true);
    adminApi.getDisputes()
      .then((res) => setDisputes(res.data.disputes || []))
      .catch((err) => console.warn('Dispute load error:', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchDisputes();
  }, []);

  const handleOpenResolve = (d) => {
    setSelectedDispute(d);
    setAction('release_to_worker');
    setResolutionNote('Federation committee inspected photographic evidence. Work completed per standards.');
  };

  const handleResolveSubmit = async (e) => {
    e.preventDefault();
    if (!selectedDispute) return;
    setSubmitting(true);

    try {
      await adminApi.resolveDispute(selectedDispute.id, {
        action,
        resolutionNote
      });
      setSelectedDispute(null);
      fetchDisputes();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to resolve dispute');
    } finally {
      setSubmitting(false);
    }
  };

  const openDisputes = disputes.filter(d => d.status === 'open');
  const resolvedDisputes = disputes.filter(d => d.status === 'resolved');

  return (
    <div style={{ maxWidth: '1000px', margin: '20px auto' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '1.75rem', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <AlertCircle size={26} color="var(--color-red)" />
          <span>{t('disputeQueueTitle')}</span>
        </h1>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
          Cooperative dispute adjudication · Payments held in escrow pending federation decision
        </p>
      </div>

      {/* Active Open Disputes */}
      <div style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '1.3rem', marginBottom: '14px', color: 'var(--color-navy)' }}>
          Active Dispute Cases ({openDisputes.length})
        </h2>

        {loading ? (
          <p style={{ color: 'var(--color-text-muted)' }}>Loading disputes...</p>
        ) : openDisputes.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '36px', color: '#155724', background: '#D4EDDA', borderColor: '#C3E6CB' }}>
            <CheckCircle2 size={32} style={{ margin: '0 auto 10px' }} />
            <p style={{ fontWeight: 600 }}>{t('noOpenDisputes')}</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {openDisputes.map(d => (
              <div key={d.id} className="card" style={{ borderColor: 'var(--color-red)', background: '#FFFAFA' }}>
                <div className="card-header" style={{ borderColor: '#FADBD8' }}>
                  <div>
                    <h3 style={{ fontSize: '1.15rem', color: 'var(--color-navy)' }}>
                      Dispute #{d.id} · Booking #{d.booking_id} ({d.category})
                    </h3>
                    <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                      Filed: {new Date(d.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                  <span className="badge badge-emergency">Escrow Payment Held</span>
                </div>

                <div className="grid-2" style={{ marginBottom: '14px' }}>
                  <div>
                    <p style={{ fontSize: '0.88rem', marginBottom: '6px' }}>
                      <strong>Customer:</strong> {d.customer_name} ({d.customer_phone})
                    </p>
                    <p style={{ fontSize: '0.88rem', marginBottom: '6px' }}>
                      <strong>Assigned Worker:</strong> {d.worker_name} ({d.worker_phone})
                    </p>
                    <p style={{ fontSize: '0.88rem', marginBottom: '6px' }}>
                      <strong>Service Location:</strong> {d.address}
                    </p>
                    <p style={{ fontSize: '0.88rem', color: 'var(--color-navy)' }}>
                      <strong>Disputed Amount:</strong> ₹{d.payment_amount || d.price || '400.00'}
                    </p>
                  </div>

                  <div style={{ background: '#ffffff', padding: '12px', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
                    <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--color-red)', marginBottom: '4px' }}>
                      Customer Claim & Reason:
                    </div>
                    <p style={{ fontSize: '0.9rem', color: 'var(--color-navy)', fontStyle: 'italic', marginBottom: '8px' }}>
                      "{d.reason}"
                    </p>
                    {d.evidence_url && (
                      <a href={d.evidence_url} target="_blank" rel="noreferrer" style={{ fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--color-teal)' }}>
                        <ImageIcon size={16} />
                        <span>View Uploaded Photographic Evidence</span>
                      </a>
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                  <button onClick={() => handleOpenResolve(d)} className="btn btn-primary btn-sm">
                    <span>{t('resolveDispute')}</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Resolved Disputes History */}
      {resolvedDisputes.length > 0 && (
        <div>
          <h2 style={{ fontSize: '1.3rem', marginBottom: '14px' }}>Resolved Disputes Archive</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {resolvedDisputes.map(d => (
              <div key={d.id} className="card" style={{ padding: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <strong>Dispute #{d.id} · Booking #{d.booking_id} ({d.category})</strong>
                  <span className="badge badge-completed">Resolved</span>
                </div>
                <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                  Resolution Note: {d.resolution_note || 'Settled per federation guidelines'} · Closed: {new Date(d.resolved_at || d.created_at).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Resolution Adjudication Modal */}
      {selectedDispute && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: '16px' }}>
          <div className="card" style={{ maxWidth: '520px', width: '100%', animation: 'slideUp 0.2s ease' }}>
            <div className="card-header">
              <h3 style={{ fontSize: '1.2rem' }}>Adjudicate Dispute #{selectedDispute.id}</h3>
              <button onClick={() => setSelectedDispute(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleResolveSubmit}>
              <div className="form-group">
                <label className="form-label">Adjudication Decision:</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.9rem' }}>
                    <input
                      type="radio"
                      name="decision"
                      checked={action === 'release_to_worker'}
                      onChange={() => setAction('release_to_worker')}
                    />
                    <span><strong>{t('releaseToWorker')}</strong> (Release held escrow payout)</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.9rem' }}>
                    <input
                      type="radio"
                      name="decision"
                      checked={action === 'refund_customer'}
                      onChange={() => setAction('refund_customer')}
                    />
                    <span><strong>{t('refundCustomer')}</strong> (Issue refund to customer wallet/UPI)</span>
                  </label>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Official Federation Resolution Note</label>
                <textarea
                  required
                  className="form-textarea"
                  value={resolutionNote}
                  onChange={(e) => setResolutionNote(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '16px' }}>
                <button type="button" onClick={() => setSelectedDispute(null)} className="btn btn-secondary btn-sm">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary btn-sm" disabled={submitting}>
                  <Check size={16} />
                  <span>{submitting ? 'Adjudicating...' : 'Submit Resolution'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
