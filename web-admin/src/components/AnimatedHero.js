import React from 'react';
import AnimatedStat from './AnimatedStat';

export default function AnimatedHero({ greeting = 'Welcome', name = '', company = '', stats = {} }) {
  return (
    <div style={{ position: 'relative' }} className="hero-entrance">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, position: 'relative', zIndex: 1 }}>
        <h1 style={{ fontSize: 38, fontWeight: 900, color: 'var(--text-main)', letterSpacing: -1, marginBottom: 8, textTransform: 'capitalize' }}>{greeting}, {name}.</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 16, fontWeight: 500, marginBottom: 12 }}>Your workforce at <strong style={{ color: 'var(--text-main)' }}>{company}</strong> is operating at peak efficiency today.</p>

        <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginTop: 8 }}>
          <div style={{ background: 'linear-gradient(90deg, rgba(255,255,255,0.03), rgba(255,255,255,0.02))', padding: 12, borderRadius: 12, display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 700 }}>Live Headcount</div>
            <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ fontSize: 28, fontWeight: 900 }}><AnimatedStat value={stats.total || 0} suffix="" duration={800} /></div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Updated now</div>
            </div>
          </div>

          <div style={{ background: 'linear-gradient(90deg, rgba(255,255,255,0.02), rgba(255,255,255,0.01))', padding: 12, borderRadius: 12, display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 700 }}>Present Today</div>
            <div style={{ marginTop: 6 }}><AnimatedStat value={stats.present || 0} suffix="" duration={800} /></div>
          </div>

          <div style={{ background: 'linear-gradient(90deg, rgba(255,255,255,0.02), rgba(255,255,255,0.01))', padding: 12, borderRadius: 12, display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 700 }}>Overtime (min)</div>
            <div style={{ marginTop: 6 }}><AnimatedStat value={stats.overtime_minutes || 0} suffix="m" duration={1000} /></div>
          </div>
        </div>
      </div>
    </div>
  );
}
