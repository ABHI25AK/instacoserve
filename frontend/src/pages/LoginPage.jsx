import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { LogIn, User, ShieldCheck, Wrench, AlertCircle } from 'lucide-react';

export default function LoginPage() {
  const { login } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const from = location.state?.from?.pathname || null;

  const handleSubmit = async (e) => {
    e?.preventDefault();
    setError('');
    setLoading(true);

    try {
      const loggedInUser = await login(email, password);
      
      if (from) {
        navigate(from, { replace: true });
      } else if (loggedInUser.role === 'worker') {
        navigate('/worker/dashboard', { replace: true });
      } else if (loggedInUser.role === 'admin') {
        navigate('/admin/overview', { replace: true });
      } else {
        navigate('/customer/dashboard', { replace: true });
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  // Quick Demo Login Helper
  const handleQuickLogin = (demoEmail) => {
    setEmail(demoEmail);
    setPassword('password123');
  };

  return (
    <div style={{ maxWidth: '460px', margin: '40px auto' }}>
      <div className="card">
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '1.6rem', marginBottom: '6px' }}>{t('loginTitle')}</h2>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
            {t('loginSubtitle')}
          </p>
        </div>

        {error && (
          <div style={{ background: '#FDEDEC', border: '1px solid #FADBD8', color: 'var(--color-red)', padding: '10px 14px', borderRadius: '8px', marginBottom: '16px', fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">{t('email')}</label>
            <input
              type="email"
              required
              className="form-input"
              placeholder="e.g. customer@gmail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">{t('password')}</label>
            <input
              type="password"
              required
              className="form-input"
              placeholder="Enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button type="submit" className="btn btn-primary btn-block" disabled={loading} style={{ marginTop: '8px' }}>
            <LogIn size={18} />
            <span>{loading ? 'Authenticating...' : t('navLogin')}</span>
          </button>
        </form>

        {/* Quick Demo Credentials for Judges / Evaluators */}
        <div style={{ marginTop: '24px', paddingTop: '20px', borderTop: '1px solid var(--color-border)' }}>
          <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-text-muted)', marginBottom: '10px', textTransform: 'uppercase' }}>
            {t('quickDemoLogin')}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <button
              type="button"
              onClick={() => handleQuickLogin('customer@gmail.com')}
              className="btn btn-secondary btn-sm"
              style={{ justifyContent: 'flex-start' }}
            >
              <User size={15} color="#028090" />
              <span>Customer Demo: <strong>customer@gmail.com</strong></span>
            </button>
            <button
              type="button"
              onClick={() => handleQuickLogin('ramesh.electrician@gmail.com')}
              className="btn btn-secondary btn-sm"
              style={{ justifyContent: 'flex-start' }}
            >
              <Wrench size={15} color="#00A896" />
              <span>Worker Demo: <strong>ramesh.electrician@gmail.com</strong></span>
            </button>
            <button
              type="button"
              onClick={() => handleQuickLogin('admin@delhicoop.org')}
              className="btn btn-secondary btn-sm"
              style={{ justifyContent: 'flex-start' }}
            >
              <ShieldCheck size={15} color="#16325C" />
              <span>Federation Admin Demo: <strong>admin@delhicoop.org</strong></span>
            </button>
          </div>
        </div>

        <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '0.9rem' }}>
          <Link to="/register">{t('needAccount')}</Link>
        </div>
      </div>
    </div>
  );
}
