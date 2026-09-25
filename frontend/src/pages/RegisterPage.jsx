import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { authApi } from '../services/api';
import { UserPlus, User, Wrench, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function RegisterPage() {
  const { register } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [role, setRole] = useState('customer'); // 'customer' or 'worker'
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [federationId, setFederationId] = useState('');
  const [skillCategory, setSkillCategory] = useState('Electrician');
  const [preferredLanguage, setPreferredLanguage] = useState('en');

  const [federations, setFederations] = useState([]);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    authApi.getFederations()
      .then((res) => {
        setFederations(res.data.federations || []);
        if (res.data.federations && res.data.federations.length > 0) {
          setFederationId(res.data.federations[0].id);
        }
      })
      .catch((err) => console.warn('Could not load federations:', err));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);

    try {
      const payload = {
        name,
        email,
        phone,
        password,
        role,
        preferredLanguage,
        ...(role === 'worker' && {
          federationId: parseInt(federationId, 10),
          skillCategory,
          lat: 28.6139,
          lng: 77.2090
        })
      };

      const res = await register(payload);
      setSuccessMsg(res.message);

      setTimeout(() => {
        if (role === 'worker') {
          navigate('/worker/dashboard');
        } else {
          navigate('/customer/dashboard');
        }
      }, 1200);
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed. Please check your details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '520px', margin: '30px auto' }}>
      <div className="card">
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '1.6rem', marginBottom: '6px' }}>{t('registerTitle')}</h2>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
            Empowering cooperative workers and direct household services
          </p>
        </div>

        {/* Role Toggle Selector */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '20px' }}>
          <button
            type="button"
            onClick={() => setRole('customer')}
            className={`btn ${role === 'customer' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ justifyContent: 'center' }}
          >
            <User size={18} />
            <span>{t('roleCustomer')}</span>
          </button>
          <button
            type="button"
            onClick={() => setRole('worker')}
            className={`btn ${role === 'worker' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ justifyContent: 'center' }}
          >
            <Wrench size={18} />
            <span>{t('roleWorker')}</span>
          </button>
        </div>

        {error && (
          <div style={{ background: '#FDEDEC', border: '1px solid #FADBD8', color: 'var(--color-red)', padding: '10px 14px', borderRadius: '8px', marginBottom: '16px', fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div style={{ background: '#D4EDDA', border: '1px solid #C3E6CB', color: '#155724', padding: '10px 14px', borderRadius: '8px', marginBottom: '16px', fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckCircle2 size={18} />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">{t('fullName')}</label>
            <input
              type="text"
              required
              className="form-input"
              placeholder="e.g. Ramesh Kumar"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">{t('email')}</label>
              <input
                type="email"
                required
                className="form-input"
                placeholder="name@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">{t('phone')}</label>
              <input
                type="tel"
                className="form-input"
                placeholder="10-digit mobile"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">{t('password')}</label>
            <input
              type="password"
              required
              minLength={6}
              className="form-input"
              placeholder="Create password (min 6 characters)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {/* Worker-Specific Fields */}
          {role === 'worker' && (
            <div style={{ background: '#F0F9FA', padding: '16px', borderRadius: '10px', border: '1px solid var(--color-border)', marginBottom: '16px' }}>
              <h4 style={{ color: 'var(--color-navy)', marginBottom: '12px', fontSize: '0.95rem' }}>
                Cooperative Society Verification Details
              </h4>

              <div className="form-group">
                <label className="form-label">{t('selectFederation')}</label>
                <select
                  className="form-select"
                  value={federationId}
                  onChange={(e) => setFederationId(e.target.value)}
                  required
                >
                  {federations.map((fed) => (
                    <option key={fed.id} value={fed.id}>
                      {fed.name} ({fed.state})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">{t('selectSkill')}</label>
                <select
                  className="form-select"
                  value={skillCategory}
                  onChange={(e) => setSkillCategory(e.target.value)}
                  required
                >
                  <option value="Electrician">Electrician</option>
                  <option value="Plumber">Plumber</option>
                  <option value="Carpenter">Carpenter</option>
                  <option value="Domestic Help">Domestic Help</option>
                  <option value="Caregiver">Caregiver</option>
                  <option value="Painter">Painter & Technician</option>
                </select>
              </div>

              <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                ℹ️ Note: Per cooperative bylaws, your registration will be reviewed and approved by your federation admin before live dispatching.
              </div>
            </div>
          )}

          <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
            <UserPlus size={18} />
            <span>{loading ? 'Registering...' : t('navRegister')}</span>
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '0.9rem' }}>
          <Link to="/login">{t('alreadyAccount')}</Link>
        </div>
      </div>
    </div>
  );
}
