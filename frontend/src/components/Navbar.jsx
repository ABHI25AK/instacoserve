import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import LanguageSwitcher from './LanguageSwitcher';
import { 
  HeartHandshake, 
  Home, 
  Calendar, 
  Wallet, 
  ShieldCheck, 
  Users, 
  TrendingUp, 
  AlertCircle, 
  LogOut, 
  LogIn, 
  UserPlus 
} from 'lucide-react';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <header className="navbar">
      <div className="nav-container">
        {/* Brand Logo & Name */}
        <Link to="/" className="nav-brand">
          <div className="brand-icon">
            <HeartHandshake size={22} />
          </div>
          <div>
            <div style={{ lineHeight: 1.1, fontFamily: 'var(--font-heading)' }}>{t('brandName')}</div>
            <div style={{ fontSize: '0.68rem', color: 'var(--color-text-muted)', fontWeight: 500 }}>
              {t('brandSub')}
            </div>
          </div>
        </Link>

        {/* Navigation Links based on role */}
        <nav className="nav-links">
          {user ? (
            <>
              {user.role === 'customer' && (
                <>
                  <Link to="/customer/dashboard" className={`nav-link ${isActive('/customer/dashboard') ? 'active' : ''}`}>
                    <Home size={18} />
                    <span>{t('navDashboard')}</span>
                  </Link>
                  <Link to="/customer/bookings" className={`nav-link ${isActive('/customer/bookings') ? 'active' : ''}`}>
                    <Calendar size={18} />
                    <span>{t('navBookings')}</span>
                  </Link>
                </>
              )}

              {user.role === 'worker' && (
                <>
                  <Link to="/worker/dashboard" className={`nav-link ${isActive('/worker/dashboard') ? 'active' : ''}`}>
                    <Home size={18} />
                    <span>{t('navDashboard')}</span>
                  </Link>
                  <Link to="/worker/earnings" className={`nav-link ${isActive('/worker/earnings') ? 'active' : ''}`}>
                    <Wallet size={18} />
                    <span>{t('navEarnings')}</span>
                  </Link>
                </>
              )}

              {user.role === 'admin' && (
                <>
                  <Link to="/admin/overview" className={`nav-link ${isActive('/admin/overview') ? 'active' : ''}`}>
                    <ShieldCheck size={18} />
                    <span>Overview</span>
                  </Link>
                  <Link to="/admin/workers" className={`nav-link ${isActive('/admin/workers') ? 'active' : ''}`}>
                    <Users size={18} />
                    <span>Workers</span>
                  </Link>
                  <Link to="/admin/forecast" className={`nav-link ${isActive('/admin/forecast') ? 'active' : ''}`}>
                    <TrendingUp size={18} />
                    <span>AI Forecast</span>
                  </Link>
                  <Link to="/admin/disputes" className={`nav-link ${isActive('/admin/disputes') ? 'active' : ''}`}>
                    <AlertCircle size={18} />
                    <span>Disputes</span>
                  </Link>
                  <Link to="/admin/welfare" className={`nav-link ${isActive('/admin/welfare') ? 'active' : ''}`}>
                    <Wallet size={18} />
                    <span>Welfare Fund</span>
                  </Link>
                </>
              )}

              {/* User badge and logout */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginLeft: '12px' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-navy)', background: '#F0F4F8', padding: '4px 10px', borderRadiu: '6px' }}>
                  {user.name.split(' ')[0]} ({user.role})
                </span>
                <button onClick={handleLogout} className="btn btn-secondary btn-sm" title="Logout">
                  <LogOut size={16} />
                  <span>{t('navLogout')}</span>
                </button>
              </div>
            </>
          ) : (
            <>
              <Link to="/login" className="btn btn-secondary btn-sm">
                <LogIn size={16} />
                <span>{t('navLogin')}</span>
              </Link>
              <Link to="/register" className="btn btn-primary btn-sm">
                <UserPlus size={16} />
                <span>{t('navRegister')}</span>
              </Link>
            </>
          )}

          {/* Language Switcher */}
          <LanguageSwitcher />
        </nav>
      </div>
    </header>
  );
}
