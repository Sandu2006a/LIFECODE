'use client';

import { useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import IngredientChips from './IngredientChips';

const RG = 'linear-gradient(135deg, #7C3AED 0%, #5B21B6 45%, #1D4ED8 100%)';
const CHIPS = ['EAA', 'Creatine', 'Magnesium', 'Hydration', 'Recovery Blend'];

export default function RecoverySection() {
  const sectionRef = useRef(null);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const ctx = gsap.context(() => {
      gsap.fromTo('.rs-img',
        { opacity: 0, x: 25, scale: 0.97 },
        { opacity: 1, x: 0, scale: 1, duration: 0.65, ease: 'power3.out',
          scrollTrigger: { trigger: sectionRef.current, start: 'top 92%' } }
      );
      gsap.fromTo('.rs-text',
        { opacity: 0, x: -20 },
        { opacity: 1, x: 0, duration: 0.55, ease: 'power3.out', stagger: 0.05,
          scrollTrigger: { trigger: sectionRef.current, start: 'top 90%' } }
      );
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="recovery"
      className="py-14 md:py-20 px-6 md:px-16 overflow-hidden"
      style={{ background: 'linear-gradient(180deg, #FAFAFE 0%, #F8F5FF 100%)' }}
    >
      <div className="max-w-[1440px] mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 md:gap-14 items-center">

          {/* Text — left */}
          <div className="flex flex-col gap-7 order-2 lg:order-1">
            <div className="rs-text opacity-0">
              <div className="flex items-center gap-3 mb-5">
                <span
                  className="font-body text-[10px] tracking-widest3 uppercase font-600 px-3 py-1 rounded-full text-white"
                  style={{ background: RG }}
                >
                  PM
                </span>
              </div>
              <h2
                className="font-sans font-700 leading-[0.88] tracking-tight"
                style={{ fontSize: 'clamp(3rem, 6vw, 6.5rem)', color: '#6D28D9' }}
              >
                Recovery<br />Pack
              </h2>
            </div>

            <div className="rs-text opacity-0">
              <p className="font-sans font-600 text-[#222] text-xl md:text-2xl tracking-tight mb-4">
                Repair starts in the window.
              </p>
              <p className="font-body font-300 text-[#888] text-sm md:text-base leading-loose max-w-md">
                10 targeted compounds. EAA, creatine, magnesium, tart cherry. Everything your body needs
                within the 45-minute post-effort window to rebuild, rehydrate, and be ready for tomorrow.
              </p>
            </div>

            <div className="rs-text opacity-0">
              <IngredientChips chips={CHIPS} gradient={RG} />
            </div>

            <div className="rs-text opacity-0">
              <Link
                href="/products/recovery"
                className="inline-flex items-center gap-4 px-8 py-3.5 rounded-full text-white font-sans font-600 text-[11px] tracking-widest uppercase hover:opacity-85 transition-opacity duration-300 group"
                style={{ background: '#6D28D9' }}
              >
                <span>View ingredients</span>
                <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center group-hover:translate-x-1 transition-transform duration-300">
                  <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
                    <path d="M1.5 4.5h6M4.5 2L7 4.5 4.5 7" stroke="white" strokeWidth="1.2" strokeLinecap="round"/>
                  </svg>
                </span>
              </Link>
            </div>

            <div className="rs-text flex gap-10 pt-5 border-t border-[#eef0ff] opacity-0">
              {[['10', 'Compounds'], ['38g', 'Per Serving'], ['45min', 'Window']].map(([v, l]) => (
                <div key={l}>
                  <p className="font-sans font-700 text-2xl text-[#222] leading-none">{v}</p>
                  <p className="font-body text-[9px] tracking-widest text-[#bbb] uppercase mt-1">{l}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Image with full gradient border */}
          <div className="rs-img order-1 lg:order-2 opacity-0">
            <div className="relative">
              <div className="absolute inset-0 blur-3xl opacity-20 scale-95 pointer-events-none rounded-[28px]"
                style={{ background: RG }} />
              <div style={{ padding: '3px', borderRadius: '28px', background: RG }}>
                <div className="bg-white overflow-hidden" style={{ borderRadius: '25px' }}>
                  <Image
                    src="/Recov_deschis.png"
                    alt="Recovery Pack"
                    width={900}
                    height={1100}
                    className="w-full h-auto object-contain p-6 md:p-10"
                    sizes="(max-width: 1024px) 100vw, 50vw"
                  />
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
