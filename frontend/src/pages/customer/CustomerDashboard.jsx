import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { bookingApi } from '../../services/api';
import ServiceCategoryGrid from '../../components/ServiceCategoryGrid';
import BookingCard from '../../components/BookingCard';
import { Search, PlusCircle, Calendar, ArrowRight, ShieldCheck } from 'lucide-react';

export default function CustomerDashboard() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [searchPrompt, setSearchPrompt] = useState('');
  const [activeBookings, setActiveBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    bookingApi.getMyBookings()
      .then((res) => {
        const active = (res.data.bookings || []).filter(
          (b) => ['pending', 'matched', 'in_progress'].includes(b.status)
        );
        setActiveBookings(active);
      })
      .catch((err) => console.warn('Could not load active bookings:', err))
      .finally(() => setLoading(false));
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (!searchPrompt.trim()) return;
    navigate(`/customer/book?query=${encodeURIComponent(searchPrompt.trim())}`);
  };

  const handleCategorySelect = (categoryId) => {
    navigate(`/customer/book?category=${encodeURIComponent(categoryId)}`);
  };

  return (
    <div>
      {/* Welcome Banner */}
      <div className="card" style={{ background: 'linear-gradient(135deg, #16325C, #028090)', color: '#ffffff', marginBottom: '28px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1 style={{ color: '#ffffff', fontSize: '1.8rem', marginBottom: '6px' }}>
              Welcome back, {user?.name || 'Friend'}!
            </h1>
            <p style={{ opacity: 0.9, fontSize: '0.95rem' }}>
              Book cooperative-verified skilled trade workers with direct fair payouts.
            </p>
          </div>
          <button onClick={() => navigate('/customer/book')} className="btn btn-mint">
            <PlusCircle size={18} />
            <span>Book New Service</span>
          </button>
        </div>

        {/* NLP Search in Dashboard */}
        <form onSubmit={handleSearch} style={{ marginTop: '20px', display: 'flex', gap: '8px', background: '#ffffff', padding: '6px', borderRadius: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', paddingLeft: '10px', color: 'var(--color-teal)' }}>
            <Search size={20} />
          </div>
          <input
            type="text"
            className="form-input"
            style={{ border: 'none', boxShadow: 'none', color: 'var(--color-navy)', fontSize: '0.95rem' }}
            placeholder={t('searchPlaceholder')}
            value={searchPrompt}
            onChange={(e) => setSearchPrompt(e.target.value)}
          />
          <button type="submit" className="btn btn-primary btn-sm">
            <span>{t('searchBtn')}</span>
            <ArrowRight size={16} />
          </button>
        </form>
      </div>

      {/* Active Bookings Section */}
      {activeBookings.length > 0 && (
        <section style={{ marginBottom: '32px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <h2 style={{ fontSize: '1.4rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Calendar size={22} color="#028090" />
              <span>Active Bookings ({activeBookings.length})</span>
            </h2>
            <button onClick={() => navigate('/customer/bookings')} className="btn btn-secondary btn-sm">
              View All Bookings
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {activeBookings.map((b) => (
              <BookingCard key={b.id} booking={b} role="customer" />
            ))}
          </div>
        </section>
      )}

      {/* Service Category Grid */}
      <section>
        <h2 style={{ fontSize: '1.4rem', marginBottom: '6px' }}>{t('categoryTitle')}</h2>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', marginBottom: '16px' }}>
          Select a trade to instantly match with nearby verified cooperative members.
        </p>
        <ServiceCategoryGrid onSelectCategory={handleCategorySelect} />
      </section>
    </div>
  );
}
