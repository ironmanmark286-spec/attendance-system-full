import React, { useEffect, useState } from 'react';

export default function AnimatedStat({ value = 0, suffix = '', duration = 1200, className = '' }) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    let start = 0;
    const end = Number(value) || 0;
    if (end === 0) { setDisplay(0); return; }
    const stepTime = Math.max(Math.floor(duration / end), 8);
    const timer = setInterval(() => {
      start += Math.max(1, Math.round(end / (duration / stepTime)));
      if (start >= end) {
        setDisplay(end);
        clearInterval(timer);
      } else {
        setDisplay(start);
      }
    }, stepTime);
    return () => clearInterval(timer);
  }, [value, duration]);

  return (
    <div className={`animated-stat ${className}`} aria-live="polite" style={{ display: 'inline-block' }}>
      {display}{suffix}
    </div>
  );
}
