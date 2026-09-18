import React, { useState, useEffect, useMemo } from 'react';
import { 
  BarChart3, TrendingUp, Users, Clock, MousePointer2, 
  Smartphone, Monitor, Globe, Activity, Zap, MapPin, 
  ArrowUpRight, Tablet, Sparkles, Target, Layers, 
  Signal, ShieldCheck, ChevronRight
} from 'lucide-react';

const VisitorAnalytics = ({ compact = false }) => {
  // --- STATE ---
  const [dailyVisitors, setDailyVisitors] = useState([45, 52, 38, 65, 88, 76, 92]);
  const [statsData, setStatsData] = useState([
    { value: '1.284', growth: '+12%' },
    { value: '14', growth: '+2' },
    { value: '3m 42s', growth: '-5s' },
    { value: '24.2%', growth: '-1.2%' },
  ]);

  const [realtimePulse, setRealtimePulse] = useState(Array.from({ length: 30 }, () => Math.floor(Math.random() * 40) + 10));

  const statsMeta = [
    { label: 'Total Pengunjung', icon: <Users size={20} />, color: '#6366f1' },
    { label: 'Sesi Aktif', icon: <Signal size={20} />, color: '#10b981' },
    { label: 'Avg. Durasi', icon: <Clock size={20} />, color: '#3b82f6' },
    { label: 'Bounce Rate', icon: <Target size={20} />, color: '#f59e0b' },
  ];

  const stats = statsData.map((d, i) => ({ ...d, ...statsMeta[i] }));

  // --- REAL-TIME SIMULATION ---
  useEffect(() => {
    const interval = setInterval(() => {
      setRealtimePulse(prev => {
        const next = [...prev.slice(1), Math.floor(Math.random() * 50) + 10];
        return next;
      });

      if (Math.random() > 0.7) {
        setStatsData(prev => {
          const newData = [...prev];
          const currentVal = parseInt(newData[1].value);
          const change = Math.random() > 0.5 ? 1 : -1;
          const nextVal = Math.max(5, currentVal + change);
          newData[1] = { ...newData[1], value: nextVal.toString() };
          return newData;
        });
      }
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  // --- PERSISTENCE ---
  useEffect(() => {
    const savedData = localStorage.getItem('porto_analytics_data');
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);

        if (parsed.dailyVisitors && Array.isArray(parsed.dailyVisitors)) setDailyVisitors(parsed.dailyVisitors);
        if (parsed.statsData && Array.isArray(parsed.statsData)) setStatsData(parsed.statsData);

      } catch (e) {
        localStorage.removeItem('porto_analytics_data');
      }
    }

    const handleReset = () => {
      const resetVisitors = [0, 0, 0, 0, 0, 0, 0];
      const resetData = [
        { value: '0', growth: '0%' },
        { value: '0', growth: '0' },
        { value: '0s', growth: '0s' },
        { value: '0%', growth: '0%' },
      ];
      setDailyVisitors(resetVisitors);
      setStatsData(resetData);
      localStorage.setItem('porto_analytics_data', JSON.stringify({ dailyVisitors: resetVisitors, statsData: resetData }));
    };

    window.addEventListener('porto_reset_analytics', handleReset);
    return () => window.removeEventListener('porto_reset_analytics', handleReset);
  }, []);

  const maxVisitors = Math.max(...dailyVisitors, 10);

  const devices = [
    { name: 'Smartphone', value: 68, icon: <Smartphone size={16} />, color: '#6366f1' },
    { name: 'Desktop', value: 28, icon: <Monitor size={16} />, color: '#3b82f6' },
    { name: 'Tablet', value: 4, icon: <Tablet size={16} />, color: '#10b981' },
  ];

  // --- SVG PATH GENERATOR ---
  const pulsePath = useMemo(() => {
    const width = 400;
    const height = 60;
    const step = width / (realtimePulse.length - 1);
    return realtimePulse.map((v, i) => `${i * step},${height - (v / 60) * height}`).join(' L ');
  }, [realtimePulse]);

  if (compact) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24, height: '100%', animation: 'cmsFadeIn 0.8s ease' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          {stats.slice(0, 2).map((s, i) => (
            <div key={i} className="analytics-mini-card">
              <div style={{ width: 40, height: 40, borderRadius: 12, background: `${s.color}15`, color: s.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {s.icon}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: 18, fontWeight: 950, color: 'var(--cms-text)', letterSpacing: '-0.02em' }}>{s.value}</span>
                <span style={{ fontSize: 10, fontWeight: 800, color: 'var(--cms-text-muted)', letterSpacing: '0.05em' }}>{s.label.split(' ')[1] || s.label}</span>
              </div>
              <div className={`mini-growth ${s.growth.startsWith('+') ? 'up' : 'down'}`} style={{ position: 'absolute', top: 12, right: 12, fontSize: 10, fontWeight: 900, color: s.growth.startsWith('+') ? '#10b981' : '#ef4444' }}>
                {s.growth}
              </div>
            </div>
          ))}
        </div>
        
        <div className="pulse-chart-container" style={{ flex: 1, padding: '24px', background: 'var(--cms-card-bg)', borderRadius: 28, border: '1px solid var(--glass-border)', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#10b981', fontSize: 11, fontWeight: 950, letterSpacing: '0.1em' }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981', boxShadow: '0 0 10px #10b981', animation: 'cmsPulse 2s infinite' }} />
              LIVE TRAFFIC
            </div>
            <Activity size={14} color="var(--cms-accent)" opacity={0.6} />
          </div>
          <svg viewBox="0 0 400 60" style={{ flex: 1, width: '100%', filter: 'drop-shadow(0 4px 12px rgba(var(--cms-accent-rgb), 0.2))' }}>
            <defs>
              <linearGradient id="pulseGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--cms-accent)" stopOpacity="0.3" />
                <stop offset="100%" stopColor="var(--cms-accent)" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path d={`M 0,60 L ${pulsePath} L 400,60 Z`} fill="url(#pulseGradient)" />
            <path d={`M ${pulsePath}`} fill="none" stroke="var(--cms-accent)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </div>
    );
  }

  return (
    <div className="visitor-analytics-container" style={{ padding: 0 }}>
      {/* Top Header Row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 40 }}>
        <div>
           <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
              <div style={{ width: 40, height: 40, borderRadius: 14, background: 'var(--cms-accent-soft)', color: 'var(--cms-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Activity size={20} />
              </div>
              <h3 style={{ fontSize: 24, fontWeight: 950, margin: 0, color: 'var(--cms-text)', letterSpacing: '-0.04em' }}>Intelligence Center</h3>
           </div>
           <p style={{ margin: 0, fontSize: 14, color: 'var(--cms-text-muted)', fontWeight: 600 }}>Pemantauan performa infrastruktur dan perilaku pengguna secara real-time.</p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
           <button 
             className="secondary-action-btn" 
             onClick={() => window.dispatchEvent(new Event('porto_reset_analytics'))}
           >
             PURGE LOGS
           </button>
           <div style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.2)', padding: '10px 18px', borderRadius: 100, fontSize: 11, fontWeight: 950, display: 'flex', alignItems: 'center', gap: 10 }}>
             <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981', boxShadow: '0 0 10px #10b981', animation: 'cmsPulse 2s infinite' }} />
             ACTIVE NODES
           </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 32 }}>
        {/* Left Column: Stats + Primary Chart */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20 }}>
            {stats.map((s, i) => (
              <div key={i} className="premium-card" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ width: 44, height: 44, borderRadius: 14, background: `${s.color}15`, color: s.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {s.icon}
                  </div>
                  <div style={{ fontSize: 11, fontWeight: 950, padding: '4px 10px', borderRadius: 100, background: s.growth.startsWith('+') ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', color: s.growth.startsWith('+') ? '#10b981' : '#ef4444' }}>
                    {s.growth}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 28, fontWeight: 950, color: 'var(--cms-text)', letterSpacing: '-0.02em', lineHeight: 1 }}>{s.value}</div>
                  <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--cms-text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: 8 }}>{s.label}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="premium-card" style={{ padding: 32 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 48 }}>
              <div>
                <h4 style={{ fontSize: 20, fontWeight: 950, color: 'var(--cms-text)', margin: 0 }}>Traffic Velocity</h4>
                <p style={{ fontSize: 12, color: 'var(--cms-text-muted)', fontWeight: 700, margin: '6px 0 0' }}>Data throughput dan request per cycle dalam 7 hari terakhir.</p>
              </div>
              <div style={{ display: 'flex', gap: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, fontWeight: 900, color: 'var(--cms-text-muted)' }}>
                  <span style={{ width: 12, height: 12, borderRadius: 4, background: 'var(--cms-accent)' }} /> Peak Load
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, fontWeight: 900, color: 'var(--cms-text-muted)' }}>
                  <span style={{ width: 12, height: 12, borderRadius: 4, background: 'var(--cms-accent-soft)' }} /> Standard
                </div>
              </div>
            </div>
            
            <div style={{ height: 280, display: 'flex', alignItems: 'flex-end', gap: 24 }}>
              {dailyVisitors.map((v, i) => (
                <div key={i} style={{ flex: 1, height: '100%', display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
                    <div 
                      className="bar-fill" 
                      style={{ 
                        width: '100%', 
                        height: `${Math.max((v / maxVisitors) * 100, 10)}%`,
                        background: i === dailyVisitors.length - 1 ? 'linear-gradient(to top, var(--cms-accent), #9333ea)' : 'var(--cms-accent-soft)',
                        borderRadius: '16px 16px 8px 8px',
                        position: 'relative',
                        transition: 'height 1.2s cubic-bezier(0.19, 1, 0.22, 1)',
                        boxShadow: i === dailyVisitors.length - 1 ? '0 15px 30px rgba(var(--cms-accent-rgb), 0.3)' : 'none'
                      }}
                    >
                      <div className="bar-val-popup" style={{ 
                        position: 'absolute', top: -40, left: '50%', transform: 'translateX(-50%)',
                        background: 'var(--cms-text)', color: 'var(--cms-bg)', padding: '6px 12px', borderRadius: 10,
                        fontSize: 11, fontWeight: 950, opacity: 0, transition: '0.3s', pointerEvents: 'none',
                        boxShadow: '0 10px 20px rgba(0,0,0,0.1)'
                      }}>{v}req</div>
                    </div>
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 950, color: i === dailyVisitors.length - 1 ? 'var(--cms-text)' : 'var(--cms-text-muted)', textAlign: 'center' }}>
                    {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'][i]}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Device + Location */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
           <div className="premium-card" style={{ padding: 32 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
                <h4 style={{ fontSize: 16, fontWeight: 950, margin: 0 }}>Device Ecosystem</h4>
                <Smartphone size={18} color="var(--cms-accent)" />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                {devices.map((d, i) => (
                  <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ width: 32, height: 32, borderRadius: 10, background: `${d.color}15`, color: d.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{d.icon}</div>
                        <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--cms-text)' }}>{d.name}</span>
                      </div>
                      <span style={{ fontSize: 13, fontWeight: 950, color: d.color }}>{d.value}%</span>
                    </div>
                    <div style={{ height: 8, background: 'var(--cms-switcher-bg)', borderRadius: 10, overflow: 'hidden' }}>
                      <div style={{ width: `${d.value}%`, height: '100%', background: d.color, borderRadius: 10, transition: 'width 1.5s cubic-bezier(0.19, 1, 0.22, 1)' }} />
                    </div>
                  </div>
                ))}
              </div>
           </div>

           <div className="premium-card" style={{ padding: 32, flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 32 }}>
                <Globe size={20} color="var(--cms-accent)" />
                <span style={{ fontSize: 16, fontWeight: 950 }}>Global Distribution</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                {[
                  { name: 'Jakarta, ID', pct: 85, color: 'var(--cms-accent)' },
                  { name: 'Surabaya, ID', pct: 12, color: '#3b82f6' },
                  { name: 'Singapore, SG', pct: 3, color: '#10b981' }
                ].map((loc, i) => (
                  <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontWeight: 800 }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--cms-text-muted)' }}><MapPin size={12} /> {loc.name}</span>
                      <span style={{ color: 'var(--cms-text)' }}>{loc.pct}%</span>
                    </div>
                    <div style={{ height: 4, background: 'var(--cms-switcher-bg)', borderRadius: 10, overflow: 'hidden' }}>
                      <div style={{ width: `${loc.pct}%`, height: '100%', background: loc.color, borderRadius: 10 }} />
                    </div>
                  </div>
                ))}
              </div>
              <button className="secondary-action-btn" style={{ width: '100%', marginTop: 32 }}>
                <ArrowUpRight size={14} /> ANALISA GEOGRAFIS
              </button>
           </div>
        </div>
      </div>
    </div>
  );
};

export default VisitorAnalytics;
