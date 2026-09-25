import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { workerApi } from '../../services/api';
import { 
  Users, 
  Check, 
  X, 
  Upload, 
  Filter, 
  Search, 
  ShieldCheck, 
  ShieldAlert, 
  Star, 
  Phone, 
  Mail,
  AlertTriangle
} from 'lucide-react';

export default function WorkerManagement() {
  const { t } = useLanguage();
  const [workers, setWorkers] = useState([]);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // Bulk Import Modal State
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkCsvText, setBulkCsvText] = useState(`Sunil Sharma,sunil.sharma@gmail.com,9811223344,Electrician\nMohan Lal,mohan.lal@gmail.com,9811223345,Plumber\nDeepak Kumar,deepak.kumar@gmail.com,9811223346,Carpenter`);
  const [bulkImporting, setBulkImporting] = useState(false);
  const [bulkResultMsg, setBulkResultMsg] = useState('');

  const fetchWorkers = () => {
    setLoading(true);
    const params = filterStatus !== 'all' ? { status: filterStatus } : {};
    workerApi.getWorkersList(params)
      .then((res) => setWorkers(res.data.workers || []))
      .catch((err) => console.warn('Could not fetch workers:', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchWorkers();
  }, [filterStatus]);

  const handleVerify = async (userId, verifyBool) => {
    try {
      await workerApi.verifyWorker(userId, verifyBool);
      fetchWorkers();
    } catch (err) {
      alert(err.response?.data?.error || 'Verification update failed');
    }
  };

  const handleBulkSubmit = async (e) => {
    e.preventDefault();
    setBulkImporting(true);
    setBulkResultMsg('');

    try {
      // Parse CSV rows: name, email, phone, skillCategory
      const lines = bulkCsvText.trim().split('\n');
      const parsedWorkers = lines.map(line => {
        const [name, email, phone, skillCategory] = line.split(',').map(s => s.trim());
        return { name, email, phone, skillCategory: skillCategory || 'Electrician' };
      }).filter(w => w.name && w.email);

      const res = await workerApi.bulkImport(parsedWorkers);
      setBulkResultMsg(res.data.message);
      fetchWorkers();
    } catch (err) {
      setBulkResultMsg(err.response?.data?.error || 'Bulk import failed');
    } finally {
      setBulkImporting(false);
    }
  };

  const filteredWorkers = workers.filter(w => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return w.name.toLowerCase().includes(q) || w.email.toLowerCase().includes(q) || w.skill_category.toLowerCase().includes(q);
  });

  const pendingList = filteredWorkers.filter(w => !w.verified);
  const verifiedList = filteredWorkers.filter(w => w.verified);

  return (
    <div style={{ maxWidth: '1100px', margin: '20px auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', marginBottom: '4px' }}>
            Cooperative Worker Roster Management
          </h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
            Verify registrations, maintain skill certifications, and onboard offline worker rosters.
          </p>
        </div>

        <button onClick={() => setShowBulkModal(true)} className="btn btn-primary btn-sm">
          <Upload size={16} />
          <span>{t('bulkImportBtn')}</span>
        </button>
      </div>

      {/* PRIORITIZED SECTION: Pending Worker Verification Queue */}
      {pendingList.length > 0 && (
        <div className="card" style={{ marginBottom: '28px', background: '#FFFDF5', borderColor: '#F59E0B' }}>
          <div className="card-header" style={{ borderColor: '#FDE68A' }}>
            <h3 style={{ fontSize: '1.15rem', color: '#B45309', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShieldAlert size={20} />
              <span>Pending Verification Queue ({pendingList.length})</span>
            </h3>
            <span style={{ fontSize: '0.8rem', color: '#92400E' }}>
              High-Priority Administrative Action
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {pendingList.map(w => (
              <div key={w.user_id} className="card" style={{ padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <h4 style={{ fontSize: '1.05rem', color: 'var(--color-navy)', marginBottom: '4px' }}>
                    {w.name} · <span style={{ color: 'var(--color-teal)' }}>{w.skill_category}</span>
                  </h4>
                  <div style={{ display: 'flex', gap: '16px', fontSize: '0.85rem', color: 'var(--color-text-muted)', flexWrap: 'wrap' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Mail size={14} /> {w.email}
                    </span>
                    {w.phone && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Phone size={14} /> {w.phone}
                      </span>
                    )}
                    <span>Registered: {new Date(w.registered_at).toLocaleDateString()}</span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={() => handleVerify(w.user_id, true)} className="btn btn-mint btn-sm">
                    <Check size={16} />
                    <span>Approve & Verify</span>
                  </button>
                  <button onClick={() => handleVerify(w.user_id, false)} className="btn btn-secondary btn-sm" style={{ color: 'var(--color-red)' }}>
                    <X size={16} />
                    <span>Reject</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* General Worker Roster List */}
      <div className="card">
        <div className="card-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <h3 style={{ fontSize: '1.2rem' }}>Verified Roster ({verifiedList.length})</h3>
            <div style={{ display: 'flex', gap: '6px' }}>
              <button onClick={() => setFilterStatus('all')} className={`btn btn-sm ${filterStatus === 'all' ? 'btn-primary' : 'btn-secondary'}`}>
                All
              </button>
              <button onClick={() => setFilterStatus('verified')} className={`btn btn-sm ${filterStatus === 'verified' ? 'btn-primary' : 'btn-secondary'}`}>
                Verified Only
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Search size={18} color="var(--color-text-muted)" />
            <input
              type="text"
              placeholder="Filter by name, trade..."
              className="form-input"
              style={{ minHeight: '36px', padding: '6px 12px', fontSize: '0.88rem', width: '200px' }}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <p style={{ color: 'var(--color-text-muted)', padding: '20px' }}>Loading worker roster...</p>
        ) : verifiedList.length === 0 ? (
          <p style={{ color: 'var(--color-text-muted)', padding: '20px' }}>No verified workers matched.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--color-border)', textAlign: 'left', color: 'var(--color-text-muted)' }}>
                  <th style={{ padding: '10px 8px' }}>Worker Name</th>
                  <th style={{ padding: '10px 8px' }}>Trade</th>
                  <th style={{ padding: '10px 8px' }}>Status</th>
                  <th style={{ padding: '10px 8px' }}>Rating</th>
                  <th style={{ padding: '10px 8px' }}>Completed Jobs</th>
                  <th style={{ padding: '10px 8px' }}>Quality / Upskilling</th>
                  <th style={{ padding: '10px 8px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {verifiedList.map(w => (
                  <tr key={w.user_id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <td style={{ padding: '10px 8px', fontWeight: 600 }}>
                      <div>{w.name}</div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', fontWeight: 400 }}>{w.email}</div>
                    </td>
                    <td style={{ padding: '10px 8px' }}>{w.skill_category}</td>
                    <td style={{ padding: '10px 8px' }}>
                      <span className={`badge ${w.available ? 'badge-completed' : 'badge-cancelled'}`}>
                        {w.available ? '● Online' : '○ Offline'}
                      </span>
                    </td>
                    <td style={{ padding: '10px 8px' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontWeight: 600, color: w.rating_avg < 3.5 ? 'var(--color-red)' : '#D97706' }}>
                        <Star size={14} fill="#D97706" color="#D97706" />
                        {w.rating_avg}
                      </span>
                    </td>
                    <td style={{ padding: '10px 8px' }}>{w.jobs_completed}</td>
                    <td style={{ padding: '10px 8px' }}>
                      {w.training_flag ? (
                        <span className="badge badge-emergency" style={{ fontSize: '0.75rem' }}>
                          <AlertTriangle size={12} /> Flagged for Training
                        </span>
                      ) : (
                        <span style={{ fontSize: '0.8rem', color: '#155724' }}>✓ Good Standing</span>
                      )}
                    </td>
                    <td style={{ padding: '10px 8px', textAlign: 'right' }}>
                      <button onClick={() => handleVerify(w.user_id, false)} className="btn btn-secondary btn-sm" style={{ color: 'var(--color-red)' }}>
                        Revoke
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Bulk Import Modal */}
      {showBulkModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: '16px' }}>
          <div className="card" style={{ maxWidth: '600px', width: '100%', animation: 'slideUp 0.2s ease' }}>
            <div className="card-header">
              <h3 style={{ fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Upload size={20} color="#028090" />
                <span>Bulk Onboard Federation Worker Roster</span>
              </h3>
              <button onClick={() => setShowBulkModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <p style={{ fontSize: '0.88rem', color: 'var(--color-text-muted)', marginBottom: '12px' }}>
              Paste CSV records in the format: <code>Full Name, Email, Phone, SkillCategory</code> (one worker per line).
            </p>

            <form onSubmit={handleBulkSubmit}>
              <div className="form-group">
                <textarea
                  className="form-textarea"
                  style={{ minHeight: '130px', fontFamily: 'monospace', fontSize: '0.85rem' }}
                  value={bulkCsvText}
                  onChange={(e) => setBulkCsvText(e.target.value)}
                  required
                />
              </div>

              {bulkResultMsg && (
                <div style={{ background: '#E8F8F5', color: '#0E6251', padding: '10px', borderRadius: '6px', marginBottom: '12px', fontSize: '0.85rem' }}>
                  {bulkResultMsg}
                </div>
              )}

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setShowBulkModal(false)} className="btn btn-secondary btn-sm">
                  Close
                </button>
                <button type="submit" className="btn btn-primary btn-sm" disabled={bulkImporting}>
                  <Check size={16} />
                  <span>{bulkImporting ? 'Processing Roster...' : 'Import & Auto-Verify'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
