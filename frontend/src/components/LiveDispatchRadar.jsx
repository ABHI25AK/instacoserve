import React, { useState, useEffect } from 'react';
import { Zap, Wrench, Hammer, HeartPulse, Sparkles, ShieldCheck, ArrowUpRight, Activity, MapPin, CheckCircle2 } from 'lucide-react';

const LIVE_EVENTS = [
  {
    id: 1,
    trade: 'Electrician',
    worker: 'Ramesh Kumar',
    rating: 4.8,
    location: 'Connaught Place, New Delhi',
    eta: '4 mins',
    payout: '₹384 (96%)',
    welfare: '₹8.00',
    type: 'emergency',
    icon: Zap,
    color: '#028090'
  },
  {
    id: 2,
    trade: 'Plumber',
    worker: 'Suresh Gupta',
    rating: 4.9,
    location: 'Lajpat Nagar III, New Delhi',
    eta: '7 mins',
    payout: '₹336 (96%)',
    welfare: '₹7.00',
    type: 'standard',
    icon: Wrench,
    color: '#00A896'
  },
  {
    id: 3,
    trade: 'Carpenter',
    worker: 'Vikram Singh',
    rating: 4.6,
    location: 'Saket Block B, New Delhi',
    eta: 'Job Completed',
    payout: '₹576 (96%)',
    welfare: '₹12.00',
    type: 'completed',
    icon: Hammer,
    color: '#16325C'
  },
  {
    id: 4,
    trade: 'Caregiver',
    worker: 'Anita Rao',
    rating: 4.7,
    location: 'RK Puram Sector 12, New Delhi',
    eta: '6 mins',
    payout: '₹576 (96%)',
    welfare: '₹12.00',
    type: 'standard',
    icon: HeartPulse,
    color: '#C0392B'
  },
  {
    id: 5,
    trade: 'Domestic Help',
    worker: 'Sunita Devi',
    rating: 5.0,
    location: 'Mayur Vihar Phase 1, New Delhi',
    eta: '9 mins',
    payout: '₹288 (96%)',
    welfare: '₹6.00',
    type: 'standard',
    icon: Sparkles,
    color: '#02C39A'
  }
];

export default function LiveDispatchRadar({ onQuickBook }) {
  const [feedIndex, setFeedIndex] = useState(0);
  const [liveEvents, setLiveEvents] = useState(LIVE_EVENTS.slice(0, 3));
  const [onlineCount, setOnlineCount] = useState(48);
  const [welfareTotal, setWelfareTotal] = useState(14250);
  const [pulseActive, setPulseActive] = useState(true);

  // Live timer simulating real-time incoming cooperative dispatches
  useEffect(() => {
    const interval = setInterval(() => {
      setFeedIndex((prev) => {
        const nextIdx = (prev + 1) % LIVE_EVENTS.length;
        const nextEvent = {
          ...LIVE_EVENTS[nextIdx],
          id: Date.now(),
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
        };
        
        setLiveEvents((curr) => [nextEvent, ...curr.slice(0, 2)]);
        setWelfareTotal((w) => w + (nextIdx % 2 === 0 ? 8 : 12));
        setOnlineCount((c) => 46 + Math.floor(Math.random() * 5));
        
        return nextIdx;
      });
    }, 3200);

    return () => clearInterval(interval);
  }, []);

  const handleSimulateDispatch = () => {
    const randomEvent = LIVE_EVENTS[Math.floor(Math.random() * LIVE_EVENTS.length)];
    const instantEvent = {
      ...randomEvent,
      id: Date.now(),
      timestamp: 'Just now'
    };
    setLiveEvents((curr) => [instantEvent, ...curr.slice(0, 2)]);
    setWelfareTotal((w) => w + 10);
  };

  return (
    <div className="floating-live-block">
      {/* Header with Pulsating Live Radar Indicator */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', borderBottom: '1px solid var(--color-border)', paddingBottom: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className="radar-dot" />
          <strong style={{ fontSize: '0.88rem', color: 'var(--color-navy)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
            Live Cooperative Radar
          </strong>
        </div>
        <span style={{ fontSize: '0.75rem', background: '#E8F8F5', color: '#0E6251', padding: '3px 8px', borderRadius: '9999px', fontWeight: 600 }}>
          ⚡ Real-time Dispatch
        </span>
      </div>

      {/* Live Metric Tickers */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '14px' }}>
        <div style={{ background: '#ffffff', border: '1px solid var(--color-border)', padding: '8px 10px', borderRadius: '8px', textAlign: 'center' }}>
          <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>Verified Online</div>
          <div style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--color-teal)' }}>
            {onlineCount} 👷
          </div>
        </div>

        <div style={{ background: '#ffffff', border: '1px solid var(--color-border)', padding: '8px 10px', borderRadius: '8px', textAlign: 'center' }}>
          <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>Welfare Pool</div>
          <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#02C39A' }}>
            ₹{welfareTotal.toLocaleString()}
          </div>
        </div>

        <div style={{ background: '#ffffff', border: '1px solid var(--color-border)', padding: '8px 10px', borderRadius: '8px', textAlign: 'center' }}>
          <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>Worker Retention</div>
          <div style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--color-navy)' }}>
            96% 🤝
          </div>
        </div>
      </div>

      {/* Dynamic Live Dispatches Feed */}
      <div style={{ marginBottom: '14px' }}>
        <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--color-text-muted)', marginBottom: '8px', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Activity size={14} color="#028090" />
          <span>Active Match & Payout Stream:</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {liveEvents.map((evt) => {
            const IconComp = evt.icon;
            return (
              <div key={evt.id} className="live-feed-item">
                <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: `${evt.color}15`, color: evt.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <IconComp size={18} />
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <strong style={{ fontSize: '0.85rem', color: 'var(--color-navy)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {evt.worker} ({evt.trade})
                    </strong>
                    <span style={{ fontSize: '0.72rem', color: '#D97706', fontWeight: 600 }}>
                      ⭐ {evt.rating}
                    </span>
                  </div>

                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <MapPin size={11} color="#028090" />
                    <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {evt.location}
                    </span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2px', fontSize: '0.72rem' }}>
                    <span style={{ color: 'var(--color-teal)', fontWeight: 600 }}>
                      Worker Payout: {evt.payout}
                    </span>
                    <span style={{ color: '#02C39A', fontWeight: 600 }}>
                      +{evt.welfare} Welfare
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Quick Interactive Button */}
      <div style={{ display: 'flex', gap: '8px' }}>
        <button
          type="button"
          onClick={handleSimulateDispatch}
          className="btn btn-secondary btn-sm btn-block"
          style={{ fontSize: '0.8rem', minHeight: '34px', background: '#ffffff', borderColor: 'var(--color-teal)', color: 'var(--color-teal)' }}
        >
          <span>⚡ Trigger Live Dispatch Demo</span>
        </button>
      </div>
    </div>
  );
}
