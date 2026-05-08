'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

const BOX_G  = 'linear-gradient(135deg, #FF8A00 0%, #E8445A 55%, #7C3AED 100%)';
const HEAT_G = 'linear-gradient(90deg, #FF8A00, #E8445A, #7C3AED)';

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('lc_cookie_consent');
    if (!consent) setTimeout(() => setVisible(true), 1200);
  }, []);

  const accept  = () => { localStorage.setItem('lc_cookie_consent', 'accepted');  setVisible(false); };
  const decline = () => { localStorage.setItem('lc_cookie_consent', 'declined');  setVisible(false); };

  if (!visible) return null;

  return (
    <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-[9999] w-[calc(100%-32px)] max-w-[620px]
      rounded-2xl overflow-hidden shadow-[0_8px_40px_rgba(0,0,0,0.12)]"
      style={{ background: 'linear-gradient(135deg, #FFFAF5 0%, #ffffff 50%, #FAF7FF 100%)',
               border: '1px solid #f0e8ff' }}>

      {/* Gradient top line */}
      <div className="h-[2px] w-full" style={{ background: HEAT_G }} />

      <div className="px-5 py-4 flex flex-wrap items-center gap-4">

        {/* Icon + text */}
        <div className="flex items-start gap-3 flex-1 min-w-[200px]">
          <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
            style={{ background: 'linear-gradient(135deg, #FFF3EC, #FAF0FF)' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="#E8445A" strokeWidth="1.5"/>
              <path d="M12 8v4M12 16h.01" stroke="#E8445A" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </div>
          <p className="font-body text-[13px] text-[#555] leading-relaxed">
            We use cookies to improve your experience.{' '}
            <Link href="/privacy"
              className="font-700 bg-clip-text text-transparent hover:opacity-80 transition-opacity"
              style={{ backgroundImage: HEAT_G }}>
              Privacy Policy
            </Link>
          </p>
        </div>

        {/* Buttons */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <button onClick={decline}
            className="px-4 py-2 rounded-full border border-[#e0e0e0] font-body text-[12px] tracking-widest uppercase text-[#888] hover:border-[#bbb] hover:text-[#444] transition-all duration-200">
            Decline
          </button>
          <button onClick={accept}
            className="px-5 py-2 rounded-full text-white font-sans font-700 text-[12px] tracking-[0.18em] uppercase hover:opacity-90 transition-opacity duration-200"
            style={{ background: BOX_G }}>
            Accept
          </button>
        </div>

      </div>
    </div>
  );
}
