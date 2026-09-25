import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import ServiceCategoryGrid from '../components/ServiceCategoryGrid';
import LiveDispatchRadar from '../components/LiveDispatchRadar';
import { Search, ShieldCheck, HeartHandshake, Percent, TrendingDown, ArrowRight, Sparkles, Activity } from 'lucide-react';

export default function LandingPage() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchPrompt, setSearchPrompt] = useState('');
  const [calcAmount, setCalcAmount] = useState(500);

  const handleSearch = (e) => {
    e.preventDefault();
    if (!searchPrompt.trim()) return;

    if (user) {
      navigate(`/customer/book?query=${encodeURIComponent(searchPrompt.trim())}`);
    } else {
      navigate(`/login?redirect=/customer/book?query=${encodeURIComponent(searchPrompt.trim())}`);
    }
  };

  const handleSelectCategory = (categoryId) => {
    if (user) {
      navigate(`/customer/book?category=${encodeURIComponent(categoryId)}`);
    } else {
      navigate(`/login?redirect=/customer/book?category=${encodeURIComponent(categoryId)}`);
    }
  };

  const workerCut = +(calcAmount * 0.96).toFixed(2);
  const welfareCut = +(calcAmount * 0.02).toFixed(2);
  const gatewayCut = +(calcAmount * 0.02).toFixed(2);

  return (
    <div>
      {/* Hero Section with Split Grid: Left = Value Prop + Search, Right = Floating Live Running Radar */}
      <section style={{ padding: '30px 0 20px' }}>
        <div className="hero-split-grid" style={{ display: 'grid', gridTemplateColumns: '1.15fr 0.85fr', gap: '32px', alignItems: 'center' }}>
          
          {/* Left Hero Column */}
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: '#E8F4F8', color: 'var(--color-teal)', padding: '6px 14px', borderRadius: '9999px', fontSize: '0.82rem', fontWeight: 600, marginBottom: '16px' }}>
              <Sparkles size={15} />
              <span>Smart India Hackathon 2026 · Ministry of Cooperation</span>
            </div>

            <h1 style={{ fontSize: '2.3rem', lineHeight: 1.2, marginBottom: '14px' }}>
              {t('heroTitle')}
            </h1>

            <p style={{ fontSize: '1.05rem', color: 'var(--color-text-muted)', marginBottom: '24px' }}>
              {t('heroSubtitle')}
            </p>

            {/* Natural Language Search Bar */}
            <form onSubmit={handleSearch} style={{ display: 'flex', gap: '8px', background: '#ffffff', padding: '8px', borderRadius: '14px', boxShadow: 'var(--shadow-md)', border: '1px solid var(--color-border)', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', paddingLeft: '10px', color: 'var(--color-teal)' }}>
                <Search size={22} />
              </div>
              <input
                type="text"
                className="form-input"
                style={{ border: 'none', boxShadow: 'none', fontSize: '0.98rem', flex: 1, padding: '8px' }}
                placeholder={t('searchPlaceholder')}
                value={searchPrompt}
                onChange={(e) => setSearchPrompt(e.target.value)}
              />
              <button type="submit" className="btn btn-primary">
                <span>{t('searchBtn')}</span>
                <ArrowRight size={18} />
              </button>
            </form>

            <div style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)' }}>
              ⚡ <em>Try asking:</em> "Leaking pipe under kitchen sink urgently", "Ceiling fan sparking", "Need caregiver for elder"
            </div>
          </div>

          {/* Right Hero Column: Floating Live Running Cooperative Radar */}
          <div>
            <LiveDispatchRadar onQuickBook={handleSelectCategory} />
          </div>

        </div>
      </section>

      {/* Trust Strip */}
      <section className="trust-strip">
        <div className="trust-item">
          <ShieldCheck size={22} color="#028090" />
          <span>{t('trust1')}</span>
        </div>
        <div className="trust-item">
          <Percent size={22} color="#00A896" />
          <span>{t('trust2')}</span>
        </div>
        <div className="trust-item">
          <HeartHandshake size={22} color="#02C39A" />
          <span>{t('trust3')}</span>
        </div>
        <div className="trust-item">
          <TrendingDown size={22} color="#16325C" />
          <span>{t('trust4')}</span>
        </div>
      </section>

      {/* Service Category Grid */}
      <section style={{ margin: '40px 0' }}>
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '1.75rem', marginBottom: '6px' }}>
            {t('categoryTitle')}
          </h2>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.92rem' }}>
            Direct booking with verified members of local Labour Cooperative Societies.
          </p>
        </div>

        <ServiceCategoryGrid onSelectCategory={handleSelectCategory} />
      </section>

      {/* Cooperative Revenue Model Callout with Interactive Floating Split Calculator */}
      <section className="card" style={{ background: 'linear-gradient(135deg, #16325C, #028090)', color: '#ffffff', marginTop: '40px', padding: '36px' }}>
        <div className="grid-2" style={{ alignItems: 'center' }}>
          <div>
            <h2 style={{ color: '#ffffff', fontSize: '1.8rem', marginBottom: '14px' }}>
              The Bharat Taxi Model, Extended to Household & Community Services
            </h2>
            <p style={{ fontSize: '0.95rem', opacity: 0.9, marginBottom: '20px', lineHeight: 1.6 }}>
              Unlike commercial aggregator platforms that deduct 20% to 30% commission on every job, 
              InstaCoServe is 100% cooperative-owned. Workers retain 96% of earnings, while 2% builds 
              their collective welfare, healthcare, and accident insurance fund.
            </p>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <button onClick={() => navigate('/register')} className="btn btn-mint">
                Join as Worker
              </button>
              <button onClick={() => navigate('/customer/dashboard')} className="btn btn-secondary" style={{ background: 'rgba(255,255,255,0.15)', color: '#ffffff', borderColor: 'transparent' }}>
                Explore Services
              </button>
            </div>
          </div>

          {/* Right side floating live interactive calculator */}
          <div style={{ background: 'rgba(255, 255, 255, 0.12)', padding: '24px', borderRadius: '16px', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.25)', boxShadow: '0 10px 30px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h3 style={{ color: '#02C39A', fontSize: '1.15rem' }}>Live Fair Wage Split:</h3>
              <span style={{ fontSize: '0.8rem', background: 'rgba(2, 195, 154, 0.25)', color: '#02C39A', padding: '2px 8px', borderRadius: '9999px', fontWeight: 600 }}>
                Interactive Live
              </span>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem', marginBottom: '6px' }}>
                <span>Booking Amount:</span>
                <strong style={{ fontSize: '1.1rem', color: '#ffffff' }}>₹{calcAmount}</strong>
              </div>
              <input
                type="range"
                min="200"
                max="2000"
                step="50"
                value={calcAmount}
                onChange={(e) => setCalcAmount(parseInt(e.target.value, 10))}
                style={{ width: '100%', accentColor: '#02C39A', cursor: 'pointer' }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.2)' }}>
              <span>👷 Worker Direct Payout (96%)</span>
              <strong style={{ color: '#02C39A', fontSize: '1.05rem' }}>₹{workerCut}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.2)' }}>
              <span>🏥 Worker Welfare & Insurance (2%)</span>
              <strong>₹{welfareCut}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.2)' }}>
              <span>💳 Payment Gateway Cost (2%)</span>
              <strong>₹{gatewayCut}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', color: '#02C39A', fontWeight: 700, marginTop: '4px' }}>
              <span>❌ Private Aggregator Commission</span>
              <strong>₹0.00 (ZERO COMMISSION)</strong>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
