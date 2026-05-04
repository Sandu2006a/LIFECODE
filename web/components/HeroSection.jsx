'use client';

import { useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { gsap } from 'gsap';

const BOX_G = 'linear-gradient(135deg, #FF8A00 0%, #C62828 40%, #7C3AED 70%, #1D4ED8 100%)';

export default function HeroSection() {
  useEffect(() => {
    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
    tl.fromTo('.hs-tag',  { opacity: 0, y: -10 }, { opacity: 1, y: 0, duration: 0.8, delay: 0.3 })
      .fromTo('.hs-h1',   { opacity: 0, y: 40 },  { opacity: 1, y: 0, duration: 1,   stagger: 0.12 }, '-=0.4')
      .fromTo('.hs-sub',  { opacity: 0, y: 20 },  { opacity: 1, y: 0, duration: 0.9 }, '-=0.5')
      .fromTo('.hs-btm',  { opacity: 0, y: 16 },  { opacity: 1, y: 0, duration: 0.7 }, '-=0.4')
      .fromTo('.hs-img',  { opacity: 0, scale: 0.94, y: 30 }, { opacity: 1, scale: 1, y: 0, duration: 1.3, ease: 'power4.out' }, '-=1.2');
  }, []);

  return (
    <section className="relative min-h-[88vh] bg-white flex items-center overflow-hidden px-6 md:px-16 pt-32 pb-10">

      {/* Background glows — left side only */}
      <div className="pointer-events-none absolute top-[10%] left-[-8%] w-[40vw] h-[60vh] opacity-[0.07]"
        style={{ background: 'linear-gradient(135deg, #FF8A00, #C62828)', filter: 'blur(90px)', borderRadius: '50%' }} />
      <div className="pointer-events-none absolute bottom-[0%] left-[5%] w-[25vw] h-[35vh] opacity-[0.05]"
        style={{ background: 'linear-gradient(135deg, #FFD54F, #FF8A00)', filter: 'blur(70px)', borderRadius: '50%' }} />

      <div className="relative z-10 max-w-[1440px] mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-20 items-center">

        {/* Text */}
        <div className="flex flex-col gap-8">
          <div className="hs-tag flex items-center gap-3 opacity-0">
            <div className="w-6 h-[1.5px]" style={{ background: BOX_G }} />
            <span className="font-body text-[14px] tracking-widest3 text-[#999] uppercase">Performance Nutrition System</span>
          </div>

          <div>
            <h1 className="hs-h1 font-sans font-700 text-[#111] leading-[0.88] tracking-tight opacity-0"
              style={{ fontSize: 'clamp(3.4rem, 7vw, 7.5rem)' }}>
              Train harder.
            </h1>
            <h1 className="hs-h1 font-sans font-700 leading-[0.88] tracking-tight opacity-0"
              style={{ fontSize: 'clamp(3.4rem, 7vw, 7.5rem)', color: '#6D28D9' }}>
              Recover faster.
            </h1>
            <h1 className="hs-h1 font-sans font-700 text-[#111] leading-[0.88] tracking-tight opacity-0"
              style={{ fontSize: 'clamp(3.4rem, 7vw, 7.5rem)' }}>
              Track everything.
            </h1>
          </div>

          <p className="hs-sub font-body font-300 text-[#888] text-base md:text-lg leading-loose max-w-xs opacity-0">
            Two precision formulas. One AI app.
            A complete system built for athletes who measure results.
          </p>

          <div className="hs-btm flex flex-wrap items-center gap-4 opacity-0">
            <Link href="/pricing"
              className="inline-flex items-center gap-3 px-7 py-3.5 rounded-full text-white font-sans font-600 text-[13px] tracking-widest uppercase group hover:opacity-88 transition-opacity duration-300"
              style={{ background: '#6D28D9' }}>
              <span>Start your protocol</span>
              <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center group-hover:translate-x-1 transition-transform duration-300">
                <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
                  <path d="M1.5 4.5h6M4.5 2L7 4.5 4.5 7" stroke="white" strokeWidth="1.2" strokeLinecap="round"/>
                </svg>
              </span>
            </Link>
            <a href="#morning" className="font-body text-[13px] tracking-widest text-[#999] uppercase hover:text-[#444] transition-colors duration-300">
              See the system ↓
            </a>
          </div>

          <div className="hs-btm flex gap-8 pt-5 border-t border-[#f2f2f2] opacity-0">
            {[['2', 'Formulas'], ['21', 'Compounds'], ['0', 'Fillers']].map(([v, l]) => (
              <div key={l}>
                <p className="font-sans font-700 text-[2rem] leading-none"
                  style={{ color: '#6D28D9' }}>{v}</p>
                <p className="font-body text-[12px] tracking-widest text-[#ccc] uppercase mt-1">{l}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Box image — seamless, no border */}
        <div className="hs-img opacity-0 flex items-center justify-center">
          <Image
            src="/Cutie_deschisa.png"
            alt="LIFECODE"
            width={1200}
            height={1200}
            className="w-full h-auto object-contain"
            priority
          />
        </div>

      </div>
    </section>
  );
}
