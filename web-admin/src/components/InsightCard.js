import React from 'react';

function sparklinePath(data = [], w = 120, h = 40, padding = 4) {
  if (!data || data.length === 0) return '';
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const step = (w - padding * 2) / (data.length - 1 || 1);
  const points = data.map((d, i) => {
    const x = padding + i * step;
    const y = padding + (1 - (d - min) / range) * (h - padding * 2);
    return [x, y];
  });
  return points.map((p, i) => (i === 0 ? `M ${p[0]} ${p[1]}` : `L ${p[0]} ${p[1]}`)).join(' ');
}

export default function InsightCard({ title, subtitle, value, change, data = [], color = '#6366f1', icon }) {
  const trendPath = sparklinePath(data, 140, 40, 6);
  const positive = typeof change === 'number' ? change >= 0 : true;

  return (
    <div className="hover-lift" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 16, padding: 16, minWidth: 240, display: 'flex', gap: 12, alignItems: 'center', boxShadow: 'var(--shadow-sm)', transition: 'transform 0.2s, box-shadow 0.2s' }}>
      <div style={{ width: 56, height: 56, borderRadius: 12, background: `linear-gradient(135deg, ${color}, rgba(0,0,0,0.06))`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: 20 }}>
        {icon || title.charAt(0)}
      </div>

      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>{title}</div>
            <div style={{ fontSize: 18, fontWeight: 900, color: 'var(--text-main)', marginTop: 6 }}>{value}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: positive ? 'var(--success)' : 'var(--danger)' }}>{positive ? `+${change}%` : `${change}%`}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{subtitle}</div>
          </div>
        </div>

        <div style={{ marginTop: 8 }}>
          <svg width="100%" viewBox="0 0 150 48" preserveAspectRatio="none" style={{ overflow: 'visible' }}>
            <path d={trendPath} fill="none" stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
            {data.length > 0 && (
              <circle cx={6 + (data.length - 1) * ((140 - 12) / (data.length - 1 || 1))} cy="20" r="0" fill={color} />
            )}
          </svg>
        </div>
      </div>
    </div>
  );
}
