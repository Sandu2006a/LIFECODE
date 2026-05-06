'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

const LAUNCH   = new Date('2026-08-03T00:00:00Z');
const BOX_G    = 'linear-gradient(135deg, #FF8A00 0%, #C62828 40%, #7C3AED 70%, #1D4ED8 100%)';
const HEAT_G   = 'linear-gradient(90deg, #FF8A00, #C62828, #7C3AED)';

function pad(n) { return String(n).padStart(2, '0'); }

export default function CountdownBanner() {
  const [t, setT] = useState({ days: 92, hours: 0, mins: 0, secs: 0 });

  useEffect(() => {
    function tick() {
      const diff = Math.max(0, LAUNCH.getTime() - Date.now());
      setT({
        days:  Math.floor(diff / 86400000),
        hours: Math.floor(diff / 3600000) % 24,
        mins:  Math.floor(diff / 60000) % 60,
        secs:  Math.floor(diff / 1000) % 60,
      });
    }
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div
      className="w-full z-[100] sticky top-0"
      style={{ background: '#0F172A', borderBottom: '1px solid rgba(255,138,0,0.2)' }}
    >
      <div className="max-w-[1440px] mx-auto px-4 md:px-8 py-2.5 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-6 text-center">

        {/* Label */}
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#C62828' }} />
          <span className="font-sans font-700 text-[10px] md:text-[11px] tracking-[0.28em] uppercase bg-clip-text text-transparent"
            style={{ backgroundImage: HEAT_G }}>
            Coming Soon
          </span>
        </div>

        {/* Separator */}
        <span className="hidden sm:block w-px h-3 bg-[#333]" />

        {/* Offer */}
        <p className="font-body text-[11px] md:text-[12px] text-white/70">
          First <span className="font-700 text-white">100</span> founders get{' '}
          <span className="font-800 bg-clip-text text-transparent" style={{ backgroundImage: HEAT_G }}>
            70% OFF
          </span>{' '}
          their first month
        </p>

        {/* Separator */}
        <span className="hidden sm:block w-px h-3 bg-[#333]" />

        {/* Timer */}
        <div className="flex items-center gap-1.5">
          {[
            { v: t.days,  l: 'd' },
            { v: t.hours, l: 'h' },
            { v: t.mins,  l: 'm' },
            { v: t.secs,  l: 's' },
          ].map(({ v, l }, i) => (
            <div key={l} className="flex items-center gap-1.5">
              <div className="flex items-center gap-0.5">
                <span className="font-sans font-800 text-[13px] md:text-[14px] tabular-nums bg-clip-text text-transparent"
                  style={{ backgroundImage: HEAT_G }}>
                  {pad(v)}
                </span>
                <span className="font-body text-[9px] text-white/40">{l}</span>
              </div>
              {i < 3 && <span className="font-sans font-700 text-[11px] text-white/25">:</span>}
            </div>
          ))}
        </div>

        {/* Separator */}
        <span className="hidden sm:block w-px h-3 bg-[#333]" />

        {/* CTA */}
        <Link href="/#preorder"
          className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-white font-sans font-700 text-[10px] tracking-[0.18em] uppercase hover:opacity-88 transition-opacity group"
          style={{ background: BOX_G }}>
          <span>Pre-order</span>
          <span className="group-hover:translate-x-0.5 transition-transform duration-200">→</span>
        </Link>

      </div>
    </div>
  );
}
