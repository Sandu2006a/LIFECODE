'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

const BOX_G = 'linear-gradient(135deg, #FF8A00 0%, #C62828 40%, #7C3AED 70%, #1D4ED8 100%)';

function SuccessContent() {
  const params = useSearchParams();
  const session_id = params.get('session_id');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setReady(true), 600);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-6 text-center">
      <div className="max-w-md w-full">
        {/* Animated check */}
        <div className="mx-auto mb-10 w-20 h-20 rounded-full flex items-center justify-center transition-all duration-700"
          style={{ background: BOX_G, opacity: ready ? 1 : 0, transform: ready ? 'scale(1)' : 'scale(0.8)' }}>
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
            <path d="M6 16l8 8 12-12" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>

        <div className="flex items-center justify-center gap-3 mb-6">
          <div className="w-5 h-[1.5px]" style={{ background: BOX_G }} />
          <span className="font-body text-[9px] tracking-widest3 text-[#aaa] uppercase">Protocol activated</span>
          <div className="w-5 h-[1.5px]" style={{ background: BOX_G }} />
        </div>

        <h1 className="font-sans font-700 text-[#111] leading-[0.9] tracking-tight mb-5"
          style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)' }}>
          Your protocol<br />
          <span className="bg-clip-text text-transparent" style={{ backgroundImage: BOX_G }}>
            is ready.
          </span>
        </h1>

        <p className="font-body font-300 text-[#888] text-[14px] leading-loose mb-10 max-w-sm mx-auto">
          Check your email for a confirmation. Download the LIFECODE app and log in
          with the same email to unlock your full protocol.
        </p>

        {/* Steps */}
        <div className="text-left space-y-4 mb-12">
          {[
            ['01', 'Download the LIFECODE app from App Store or Google Play'],
            ['02', 'Log in with the same email you used at checkout'],
            ['03', 'Your protocol unlocks automatically — start tracking'],
          ].map(([n, text]) => (
            <div key={n} className="flex items-start gap-4">
              <span className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-white font-body text-[9px]"
                style={{ background: BOX_G }}>
                {n}
              </span>
              <p className="font-body text-[13px] text-[#555] leading-snug pt-0.5">{text}</p>
            </div>
          ))}
        </div>

        <Link href="/"
          className="inline-flex items-center gap-3 px-8 py-3.5 rounded-full text-white font-sans font-600 text-[11px] tracking-widest uppercase hover:opacity-88 transition-opacity"
          style={{ background: BOX_G }}>
          Back to home
        </Link>
      </div>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <Suspense>
      <SuccessContent />
    </Suspense>
  );
}
