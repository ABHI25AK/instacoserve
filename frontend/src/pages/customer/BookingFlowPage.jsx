import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { aiApi, bookingApi } from '../../services/api';
import ServiceCategoryGrid from '../../components/ServiceCategoryGrid';
import EmergencyBadge from '../../components/EmergencyBadge';
import { 
  Sparkles, 
  MapPin, 
  Navigation, 
  AlertTriangle, 
  User, 
  Star, 
  CheckCircle, 
  CreditCard, 
  ShieldCheck, 
  Building2, 
  Home,
  Check
} from 'lucide-react';

export default function BookingFlowPage() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Search params
  const initialCategory = searchParams.get('category') || 'Plumber';
  const initialQuery = searchParams.get('query') || '';

  // Form State
  const [step, setStep] = useState(1); // 1: Mode & Trade, 2: Location, 3: Urgency, 4: Match Preview & Confirm
  const [category, setCategory] = useState(initialCategory);
  const [mode, setMode] = useState('household'); // 'household' or 'community'
  const [isEmergency, setIsEmergency] = useState(false);
  const [address, setAddress] = useState('Connaught Place Block B, New Delhi');
  const [lat, setLat] = useState(28.6139);
  const [lng, setLng] = useState(77.2090);
  const [customPrompt, setCustomPrompt] = useState(initialQuery);

  const [aiIntent, setAiIntent] = useState(null);
  const [loadingIntent, setLoadingIntent] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);

  // Match Preview state
  const [matchedWorker, setMatchedWorker] = useState(null);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingError, setBookingError] = useState('');

  // Fixed Pricing table
  const priceMap = {
    'Electrician': 400.00,
    'Plumber': 350.00,
    'Carpenter': 450.00,
    'Domestic Help': 300.00,
    'Caregiver': 600.00,
    'Painter': 500.00
  };
  const price = (priceMap[category] || 400.00) * (isEmergency ? 1.25 : 1.0);
  const workerPayout = +(price * 0.96).toFixed(2);
  const welfareCut = +(price * 0.02).toFixed(2);
  const gatewayFee = +(price * 0.02).toFixed(2);

  // On mount or when query param changes, run AI Intent Extraction
  useEffect(() => {
    if (initialQuery) {
      setLoadingIntent(true);
      aiApi.searchIntent(initialQuery)
        .then((res) => {
          setAiIntent(res.data);
          if (res.data.category) setCategory(res.data.category);
          if (res.data.mode) setMode(res.data.mode);
          if (res.data.urgency === 'emergency') setIsEmergency(true);
        })
        .catch((e) => console.warn('Intent error:', e))
        .finally(() => setLoadingIntent(false));
    }
  }, [initialQuery]);

  // GPS Geolocation
  const handleUseGPS = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }
    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude);
        setLng(pos.coords.longitude);
        setAddress(`GPS (${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}) - Delhi NCR`);
        setGpsLoading(false);
      },
      (err) => {
        console.warn('GPS error:', err);
        setGpsLoading(false);
        alert('Could not acquire GPS coordinates. Please enter your address manually.');
      },
      { timeout: 8000 }
    );
  };

  const handleCreateBooking = async () => {
    setBookingLoading(true);
    setBookingError('');

    try {
      const payload = {
        category,
        mode,
        isEmergency,
        address,
        lat,
        lng,
        price
      };

      const res = await bookingApi.createBooking(payload);
      // Navigate to My Bookings
      navigate('/customer/bookings', { state: { newBookingId: res.data.bookingId } });
    } catch (err) {
      setBookingError(err.response?.data?.error || 'Failed to place booking');
    } finally {
      setBookingLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '20px auto' }}>
      <div className="card">
        <div className="card-header">
          <div>
            <h1 style={{ fontSize: '1.6rem', marginBottom: '4px' }}>{t('bookingFlowTitle')}</h1>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
              Cooperative matching engine · Transparent fair pricing · Zero middleman commission
            </p>
          </div>
          {isEmergency && <EmergencyBadge isEmergency={true} />}
        </div>

        {/* AI Intent Extraction Banner */}
        {aiIntent && (
          <div style={{ background: '#E8F4F8', border: '1px solid #BEE5EB', borderRadius: '8px', padding: '12px 16px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Sparkles size={20} color="#028090" />
            <div style={{ fontSize: '0.9rem' }}>
              <strong>AI Intent Recognized:</strong> Trade: <em>{aiIntent.category}</em> · Mode: <em>{aiIntent.mode}</em> · Urgency: <em>{aiIntent.urgency}</em> (Confidence: {Math.round(aiIntent.confidence * 100)}%)
              {aiIntent.clarifyingQuestion && (
                <div style={{ marginTop: '4px', color: 'var(--color-navy)', fontStyle: 'italic' }}>
                  ℹ️ {aiIntent.clarifyingQuestion}
                </div>
              )}
            </div>
          </div>
        )}

        {bookingError && (
          <div style={{ background: '#FDEDEC', border: '1px solid #FADBD8', color: 'var(--color-red)', padding: '12px', borderRadius: '8px', marginBottom: '16px' }}>
            {bookingError}
          </div>
        )}

        {/* STEP 1: Service Mode & Category */}
        <div style={{ marginBottom: '28px', borderBottom: '1px solid var(--color-border)', paddingBottom: '24px' }}>
          <h3 style={{ fontSize: '1.15rem', marginBottom: '12px' }}>{t('stepMode')}</h3>
          
          <div className="grid-2" style={{ marginBottom: '16px' }}>
            <div
              className={`card ${mode === 'household' ? 'selected' : ''}`}
              style={{ padding: '16px', cursor: 'pointer', borderColor: mode === 'household' ? 'var(--color-teal)' : 'var(--color-border)', background: mode === 'household' ? '#F0F9FA' : '#fff' }}
              onClick={() => setMode('household')}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                <Home size={20} color="#028090" />
                <strong style={{ color: 'var(--color-navy)' }}>{t('stepModeHousehold')}</strong>
              </div>
              <p style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)' }}>
                Individual resident home repair, plumbing, electrical, carpentry or domestic support.
              </p>
            </div>

            <div
              className={`card ${mode === 'community' ? 'selected' : ''}`}
              style={{ padding: '16px', cursor: 'pointer', borderColor: mode === 'community' ? 'var(--color-teal)' : 'var(--color-border)', background: mode === 'community' ? '#F0F9FA' : '#fff' }}
              onClick={() => setMode('community')}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                <Building2 size={20} color="#16325C" />
                <strong style={{ color: 'var(--color-navy)' }}>{t('stepModeCommunity')}</strong>
              </div>
              <p style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)' }}>
                Panchayat facility, school, housing society maintenance requiring official cooperative crew dispatch.
              </p>
            </div>
          </div>

          <h4 style={{ fontSize: '0.95rem', marginBottom: '8px' }}>Trade Category:</h4>
          <ServiceCategoryGrid selectedCategory={category} onSelectCategory={setCategory} />
        </div>

        {/* STEP 2: Location */}
        <div style={{ marginBottom: '28px', borderBottom: '1px solid var(--color-border)', paddingBottom: '24px' }}>
          <h3 style={{ fontSize: '1.15rem', marginBottom: '12px' }}>{t('stepLocation')}</h3>

          <div style={{ display: 'flex', gap: '10px', marginBottom: '12px' }}>
            <button
              type="button"
              onClick={handleUseGPS}
              className="btn btn-secondary btn-sm"
              disabled={gpsLoading}
            >
              <Navigation size={16} color="#028090" />
              <span>{gpsLoading ? 'Acquiring GPS...' : t('useGPS')}</span>
            </button>
          </div>

          <div className="form-group">
            <input
              type="text"
              className="form-input"
              placeholder={t('addressPlaceholder')}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
            📍 OpenStreetMap Nominatim zero-cost geocoding coordinates: Lat {lat.toFixed(4)}, Lng {lng.toFixed(4)}
          </div>
        </div>

        {/* STEP 3: Urgency & Matching Policy */}
        <div style={{ marginBottom: '28px', borderBottom: '1px solid var(--color-border)', paddingBottom: '24px' }}>
          <h3 style={{ fontSize: '1.15rem', marginBottom: '12px' }}>{t('stepUrgency')}</h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <label 
              className="card"
              style={{ 
                padding: '14px 18px', 
                cursor: 'pointer', 
                display: 'flex', 
                alignItems: 'center', 
                gap: '14px',
                borderColor: !isEmergency ? 'var(--color-teal)' : 'var(--color-border)',
                background: !isEmergency ? '#F0F9FA' : '#fff'
              }}
            >
              <input
                type="radio"
                name="urgency"
                checked={!isEmergency}
                onChange={() => setIsEmergency(false)}
              />
              <div>
                <strong style={{ color: 'var(--color-navy)' }}>{t('urgencyStandard')}</strong>
                <div style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)' }}>
                  Weighted formula balancing distance, worker rating avg, and current workload.
                </div>
              </div>
            </label>

            <label 
              className="card"
              style={{ 
                padding: '14px 18px', 
                cursor: 'pointer', 
                display: 'flex', 
                alignItems: 'center', 
                gap: '14px',
                borderColor: isEmergency ? 'var(--color-red)' : 'var(--color-border)',
                background: isEmergency ? '#FDEDEC' : '#fff'
              }}
            >
              <input
                type="radio"
                name="urgency"
                checked={isEmergency}
                onChange={() => setIsEmergency(true)}
              />
              <div>
                <strong style={{ color: 'var(--color-red)' }}>{t('urgencyEmergency')}</strong>
                <div style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)' }}>
                  {t('urgencyEmergencyHint')}
                </div>
              </div>
            </label>
          </div>
        </div>

        {/* STEP 4: Pricing & Final Confirmation */}
        <div>
          <h3 style={{ fontSize: '1.15rem', marginBottom: '12px' }}>{t('stepPayment')}</h3>

          <div style={{ background: '#F8FAFC', border: '1px solid var(--color-border)', borderRadius: '12px', padding: '18px', marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid var(--color-border)', marginBottom: '8px' }}>
              <span>{t('serviceFee')} ({category}):</span>
              <strong style={{ fontSize: '1.15rem', color: 'var(--color-navy)' }}>₹{price.toFixed(2)}</strong>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem', color: 'var(--color-teal)', marginBottom: '4px' }}>
              <span>{t('workerGets')}:</span>
              <strong>₹{workerPayout}</strong>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '4px' }}>
              <span>{t('welfareCut')}:</span>
              <span>₹{welfareCut}</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
              <span>{t('gatewayCut')}:</span>
              <span>₹{gatewayCut}</span>
            </div>
          </div>

          {mode === 'community' ? (
            <div style={{ background: '#FFF3CD', border: '1px solid #FFEEBA', padding: '12px 16px', borderRadius: '8px', marginBottom: '20px', fontSize: '0.88rem', color: '#856404' }}>
              🏛️ <strong>Community Booking:</strong> Your request will be reviewed by the Labour Cooperative Federation Admin to assign an official crew based on skill-matrix verification.
            </div>
          ) : null}

          <button
            onClick={handleCreateBooking}
            disabled={bookingLoading}
            className={`btn ${isEmergency ? 'btn-danger' : 'btn-primary'} btn-block`}
            style={{ fontSize: '1.05rem', minHeight: '50px' }}
          >
            <Check size={20} />
            <span>{bookingLoading ? 'Dispatching Cooperative Match...' : t('confirmAndBook')} (₹{price.toFixed(2)})</span>
          </button>
        </div>
      </div>
    </div>
  );
}
