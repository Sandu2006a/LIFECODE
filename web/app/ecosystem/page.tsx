'use client';

import React, { useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { gsap } from 'gsap';

const BOX_G = 'linear-gradient(135deg, #FF8A00 0%, #C62828 40%, #7C3AED 70%, #1D4ED8 100%)';

const APP_FEATURES = [
  { label: 'AI Nutrition Coach',         desc: 'Tell it what you ate — it calculates every micro and macro instantly.' },
  { label: 'Live Micronutrient Tracking', desc: 'Real-time progress bars for all 20+ compounds in your protocol.' },
  { label: 'Long-Term Memory',           desc: 'The AI remembers your preferences, feelings, and performance patterns.' },
  { label: 'Biomarker Dashboard',        desc: 'Upload bloodwork and track key athlete biomarkers over time.' },
  { label: 'Workout Sync',              desc: 'Schedule workouts and get nutrition timing advice automatically.' },
];

export default function EcosystemPage() {
  const appRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    gsap.fromTo(
      appRef.current!.querySelectorAll('.ap'),
      { opacity: 0, y: 24 },
      { opacity: 1, y: 0, duration: 0.65, stagger: 0.08, ease: 'power3.out' }
    );
  }, []);

  return (
    <div className="min-h-screen bg-white font-body">

      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 md:px-16 py-5 border-b border-[#f0f0f0] bg-white/95 backdrop-blur-md">
        <Link href="/" className="flex items-center gap-3 text-[#888] hover:text-[#333] transition-colors duration-300">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5"/><path d="M12 19l-7-7 7-7"/>
          </svg>
          <span className="font-body text-xs tracking-widest uppercase">Back</span>
        </Link>
        <span className="font-sans font-700 text-sm tracking-[0.3em] uppercase select-none bg-clip-text text-transparent" style={{ backgroundImage: BOX_G }}>
          LIFECODE
        </span>
        <Link href="/login" className="font-body text-[10px] tracking-widest text-[#888] hover:text-[#333] transition-colors duration-300 uppercase">
          Log In
        </Link>
      </nav>

      <div className="pt-28 md:pt-36 pb-24 md:pb-36">
        <div ref={appRef} className="px-6 md:px-16 max-w-[1440px] mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24 items-center">

            {/* Phone image */}
            <div className="ap order-2 lg:order-1 flex items-center justify-center" style={{ opacity: 0 }}>
              <div className="relative w-full max-w-[360px] mx-auto">
                <div className="absolute inset-[-10%] blur-3xl opacity-15 pointer-events-none rounded-full"
                  style={{ background: BOX_G }} />
                <div style={{ padding: '2px', borderRadius: '36px', background: BOX_G }}>
                  <div className="bg-white overflow-hidden" style={{ borderRadius: '34px' }}>
                    <Image
                      src="/PhoneApp.png"
                      alt="LIFECODE App"
                      width={680}
                      height={960}
                      className="w-full h-auto object-contain"
                      priority
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* App description */}
            <div className="order-1 lg:order-2 flex flex-col gap-8">
              <div className="ap" style={{ opacity: 0 }}>
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-5 h-[1.5px]" style={{ background: BOX_G }} />
                  <span className="font-body text-[9px] tracking-widest3 text-[#aaa] uppercase">Your AI Dashboard</span>
                </div>
                <h1
                  className="font-sans font-700 leading-[0.9] tracking-tight bg-clip-text text-transparent"
                  style={{ fontSize: 'clamp(2.4rem, 5vw, 5rem)', backgroundImage: BOX_G }}
                >
                  The app that<br />knows your body.
                </h1>
              </div>

              <p className="ap font-body font-300 text-[#888] text-sm md:text-base leading-loose max-w-md" style={{ opacity: 0 }}>
                Your personal AI nutrition architect. Log meals by talking naturally, track every micronutrient
                in real time, and get protocol advice built around your actual biology — not generic recommendations.
              </p>

              <div className="ap space-y-5" style={{ opacity: 0 }}>
                {APP_FEATURES.map((f) => (
                  <div key={f.label} className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-1.5 h-1.5 rounded-full mt-[7px]" style={{ background: BOX_G }} />
                    <div>
                      <p className="font-sans font-600 text-[13px] text-[#222] tracking-tight">{f.label}</p>
                      <p className="font-body text-[12px] text-[#aaa] leading-snug mt-0.5">{f.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="ap flex items-center gap-4 pt-2" style={{ opacity: 0 }}>
                <div className="w-1.5 h-1.5 rounded-full bg-[#22c55e]" />
                <span className="font-body text-[10px] tracking-widest text-[#aaa] uppercase">Available immediately after signup</span>
              </div>

              <div className="ap" style={{ opacity: 0 }}>
                <Link
                  href="/pricing"
                  className="inline-flex items-center gap-4 px-8 py-4 rounded-full text-white font-sans font-600 text-[11px] tracking-widest uppercase hover:opacity-88 transition-opacity duration-300 group"
                  style={{ background: BOX_G }}
                >
                  <span>Start your protocol</span>
                  <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center group-hover:translate-x-1 transition-transform duration-300">
                    <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
                      <path d="M1.5 4.5h6M4.5 2L7 4.5 4.5 7" stroke="white" strokeWidth="1.2" strokeLinecap="round"/>
                    </svg>
                  </span>
                </Link>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
