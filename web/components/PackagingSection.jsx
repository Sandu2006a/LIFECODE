'use client';

import { useEffect, useRef } from 'react';
import Image from 'next/image';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

export default function PackagingSection() {
  const sectionRef = useRef(null);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const ctx = gsap.context(() => {
      gsap.fromTo('.pk-title',
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.55, ease: 'power3.out',
          scrollTrigger: { trigger: sectionRef.current, start: 'top 92%' } }
      );
      gsap.fromTo('.pk-img',
        { opacity: 0, y: 22 },
        { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out', stagger: 0.1,
          scrollTrigger: { trigger: '.pk-grid', start: 'top 94%' } }
      );
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="bg-white py-24 md:py-36 px-6 md:px-16 overflow-hidden">
      <div className="max-w-[1440px] mx-auto">

        {/* Header */}
        <div className="pk-title flex flex-col items-center text-center mb-16 md:mb-20 opacity-0">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-5 h-px bg-[#888]" />
            <span className="font-body text-[9px] tracking-widest3 text-[#888] uppercase">Packaging</span>
            <div className="w-5 h-px bg-[#888]" />
          </div>
          <h2
            className="font-sans font-700 text-[#111] tracking-tight leading-[0.92] mb-5"
            style={{ fontSize: 'clamp(2.4rem, 5vw, 5rem)' }}
          >
            Premium packaging.<br />
            <span
              className="bg-clip-text text-transparent"
              style={{ backgroundImage: 'linear-gradient(90deg, #FF8A00, #C62828, #7C3AED, #1D4ED8)' }}
            >
              Built for routine.
            </span>
          </h2>
          <p className="font-body font-300 text-[#888] text-sm leading-loose max-w-md">
            Designed for your shelf, your bag, your protocol. Every detail considered.
          </p>
        </div>

        {/* Two images */}
        <div className="pk-grid grid grid-cols-1 md:grid-cols-2 gap-5">

          {/* Closed */}
          <div className="pk-img group relative rounded-2xl overflow-hidden bg-[#f8f8f8] aspect-square opacity-0">
            <Image
              src="/Cutie_inchisa.png"
              alt="LIFECODE Box Closed"
              fill
              className="object-contain p-8 transition-transform duration-700 group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, 50vw"
              loading="lazy"
            />
            <div className="absolute bottom-6 left-6">
              <span className="font-body text-[9px] tracking-widest text-[#aaa] uppercase">Closed</span>
            </div>
            {/* Gradient border on hover */}
            <div
              className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
              style={{ boxShadow: 'inset 0 0 0 1.5px #FF8A00' }}
            />
          </div>

          {/* Open */}
          <div className="pk-img group relative rounded-2xl overflow-hidden bg-[#f8f8f8] aspect-square opacity-0">
            <Image
              src="/Cutie_deschisa.png"
              alt="LIFECODE Box Open"
              fill
              className="object-contain p-8 transition-transform duration-700 group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, 50vw"
              loading="lazy"
            />
            <div className="absolute bottom-6 left-6">
              <span className="font-body text-[9px] tracking-widest text-[#aaa] uppercase">Open</span>
            </div>
            {/* Gradient border on hover */}
            <div
              className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
              style={{ boxShadow: 'inset 0 0 0 1.5px #7C3AED' }}
            />
          </div>

        </div>

        {/* Connecting arrow */}
        <div className="flex items-center justify-center gap-4 mt-8">
          <div className="h-px flex-1 max-w-[120px]" style={{ background: 'linear-gradient(90deg, transparent, #ddd)' }} />
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M3 8h10M9 4l4 4-4 4" stroke="#ccc" strokeWidth="1.2" strokeLinecap="round"/>
          </svg>
          <div className="h-px flex-1 max-w-[120px]" style={{ background: 'linear-gradient(90deg, #ddd, transparent)' }} />
        </div>

      </div>
    </section>
  );
}
