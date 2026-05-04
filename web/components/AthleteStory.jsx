'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

const RED    = '#C62828';
const PURPLE = '#7C3AED';

export default function AthleteStory() {
  const sectionRef = useRef(null);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const ctx = gsap.context(() => {
      gsap.fromTo('.as-el',
        { opacity: 0, y: 22 },
        { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out', stagger: 0.06,
          scrollTrigger: { trigger: sectionRef.current, start: 'top 92%' } }
      );
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="py-16 md:py-24 px-6 md:px-16 overflow-hidden"
      style={{ background: 'linear-gradient(160deg, #F8F5FF 0%, #ffffff 50%, #FFF9F5 100%)' }}
    >
      <div className="max-w-[1440px] mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 md:gap-16 items-start">

          {/* Left — Story */}
          <div>
            <div className="as-el flex items-center gap-3 mb-8 opacity-0">
              <div className="w-5 h-[1.5px]" style={{ background: RED }} />
              <span className="font-body text-[9px] tracking-widest3 text-[#999] uppercase">The story</span>
            </div>

            <h2
              className="as-el font-sans font-700 text-[#111] leading-[0.9] tracking-tight mb-8 opacity-0"
              style={{ fontSize: 'clamp(2.2rem, 4.5vw, 4.8rem)' }}
            >
              Built by athletes.<br />
              <span style={{ color: RED }}>
                For athletes.
              </span>
            </h2>

            <p className="as-el font-body font-300 text-[#777] text-sm md:text-base leading-loose mb-6 opacity-0">
              We&apos;ve been competing for over a decade — triathlons, sprints, climbing. Every discipline
              had the same problem: supplements built for people who don&apos;t really train.
            </p>

            <p className="as-el font-body font-300 text-[#777] text-sm md:text-base leading-loose mb-6 opacity-0">
              Pharmacy shelves full of products designed for someone who walks 20 minutes on a Tuesday.
              Nothing for someone training twice daily. Nothing for real output.
            </p>

            <p className="as-el font-body font-300 text-[#777] text-sm md:text-base leading-loose mb-8 opacity-0">
              So we built it. LIFECODE is the system we needed but couldn&apos;t find. Two formulas.
              One app. Zero compromise.
            </p>

            <Link
              href="/about"
              className="as-el opacity-0 inline-flex items-center gap-3 px-7 py-3.5 rounded-full text-white font-sans font-600 text-[11px] tracking-widest uppercase hover:opacity-88 transition-all duration-300 hover:scale-[1.02] group"
              style={{ background: RED }}
            >
              <span>Meet the team</span>
              <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center group-hover:translate-x-1 transition-transform duration-300">
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                  <path d="M2 5h6M5.5 2.5L8 5l-2.5 2.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </span>
            </Link>
          </div>

          {/* Right — Quote + Facts */}
          <div className="flex flex-col gap-8">

            {/* Pull quote */}
            <div
              className="as-el opacity-0 p-px"
              style={{ borderRadius: '20px', background: RED }}
            >
              <div className="bg-white p-8 md:p-10" style={{ borderRadius: '18.5px' }}>
                <svg width="28" height="20" viewBox="0 0 28 20" fill="none" className="mb-5">
                  <path d="M0 20V12C0 8.667 0.833 5.833 2.5 3.5 4.167 1.167 6.5 0 9.5 0l1 2C8.833 2.667 7.5 3.833 6.5 5.5 5.5 7.167 5 9 5 11h4v9H0zm15 0V12c0-3.333.833-6.167 2.5-8.5C19.167 1.167 21.5 0 24.5 0l1 2c-1.667.667-3 1.833-4 3.5-1 1.667-1.5 3.5-1.5 5.5h4v9H15z"
                    fill="#C62828"/>
                </svg>
                <p className="font-sans font-600 text-[#222] text-base md:text-lg leading-relaxed tracking-tight mb-6">
                  &ldquo;Every product we tried was made for general health. We needed performance.
                  The system didn&apos;t exist, so we built it from scratch.&rdquo;
                </p>
                <p className="font-body text-[10px] tracking-widest text-[#bbb] uppercase">
                  — The LIFECODE founders
                </p>
              </div>
            </div>

            {/* 12+ years stat */}
            <div className="as-el opacity-0 flex items-center gap-5">
              <div className="flex-shrink-0">
                <p className="font-sans font-800 leading-none"
                  style={{ fontSize: 'clamp(3rem, 6vw, 5rem)', color: RED }}>
                  12+
                </p>
              </div>
              <div>
                <p className="font-sans font-700 text-[#111] text-lg tracking-tight leading-snug">Years of competing</p>
                <p className="font-body font-300 text-[#999] text-sm leading-relaxed mt-1">
                  Triathlons, sprints, climbing — every discipline shaped what went into the formula.
                </p>
              </div>
            </div>

          </div>
        </div>
      </div>
    </section>
  );
}
