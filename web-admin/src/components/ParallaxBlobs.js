import React, { useEffect, useRef } from 'react';

export default function ParallaxBlobs({ className, animate = true }) {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!animate) {
      // no listeners when animations disabled
      return;
    }
    const el = containerRef.current;
    if (!el) return;

    const handleMove = (e) => {
      const rect = el.getBoundingClientRect();
      const cx = (e.clientX - rect.left) / rect.width - 0.5;
      const cy = (e.clientY - rect.top) / rect.height - 0.5;
      const blobs = el.querySelectorAll('.parallax-blob');
      blobs.forEach((b) => {
        const depth = parseFloat(b.dataset.depth) || 0.5;
        const moveX = cx * 30 * depth;
        const moveY = cy * 30 * depth;
        b.style.transform = `translate3d(${moveX}px, ${moveY}px, 0) scale(${1 + depth * 0.02})`;
      });
    };

    const handleTouch = (ev) => {
      if (!ev.touches || !ev.touches[0]) return;
      handleMove(ev.touches[0]);
    };

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('touchmove', handleTouch, { passive: true });

    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('touchmove', handleTouch);
    };
  }, [animate]);

  return (
    <div ref={containerRef} className={className || 'parallax-container'} aria-hidden="true">
      <div className="parallax-blob" data-depth="0.9" style={{ position: 'absolute', top: '-10%', left: '-5%', width: 600, height: 600, background: 'var(--primary)', borderRadius: '50%', opacity: 0.15, transform: 'none' }}></div>
      <div className="parallax-blob" data-depth="0.6" style={{ position: 'absolute', bottom: '-12%', right: '-6%', width: 500, height: 500, background: '#ec4899', borderRadius: '50%', opacity: 0.15, transform: 'none' }}></div>
      <div className="parallax-blob" data-depth="0.4" style={{ position: 'absolute', top: '40%', left: '40%', width: 400, height: 400, background: '#0ea5e9', borderRadius: '50%', opacity: 0.1, transform: 'none' }}></div>
    </div>
  );
}
