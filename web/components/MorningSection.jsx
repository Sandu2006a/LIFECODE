'use client';

import { useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import IngredientChips from './IngredientChips';

const RED    = '#C62828';
const CHIPS = ['Citrus + CoQ10', 'Adaptogens', 'Focus Blend', 'Natural Energy'];

export default function MorningSection() {
  const sectionRef = useRef(null);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const ctx = gsap.context(() => {
      gsap.fromTo('.ms-img',
        { opacity: 0, x: -25, scale: 0.97 },
        { opacity: 1, x: 0, scale: 1, duration: 0.65, ease: 'power3.out',
          scrollTrigger: { trigger: sectionRef.current, start: 'top 92%' } }
      );
      gsap.fromTo('.ms-text',
        { opacity: 0, x: 20 },
        { opacity: 1, x: 0, duration: 0.55, ease: 'power3.out', stagger: 0.05,
          scrollTrigger: { trigger: sectionRef.current, start: 'top 90%' } }
      );
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} id="morning" className="bg-white py-14 md:py-20 px-6 md:px-16 overflow-hidden">
      <div className="max-w-[1440px] mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 md:gap-14 items-center">

          {/* Image with solid border */}
          <div className="ms-img opacity-0">
            {/* Soft glow behind the border */}
            <div className="relative">
              <div className="absolute inset-0 blur-3xl opacity-20 scale-95 pointer-events-none rounded-[28px]"
                style={{ background: RED }} />
              <div style={{ padding: '3px', borderRadius: '28px', background: RED }}>
                <div className="bg-white overflow-hidden" style={{ borderRadius: '25px' }}>
                  <Image
                    src="/Morning_deschis.png"
                    alt="Morning Pack"
                    width={900}
                    height={1100}
                    className="w-full h-auto object-contain p-6 md:p-10"
                    sizes="(max-width: 1024px) 100vw, 50vw"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Text */}
          <div className="flex flex-col gap-7">
            <div className="ms-text opacity-0">
              <div className="flex items-center gap-3 mb-5">
                <span
                  className="font-body text-[10px] tracking-widest3 uppercase font-600 px-3 py-1 rounded-full text-white"
                  style={{ background: RED }}
                >
                  AM
                </span>
              </div>
              <h2
                className="font-sans font-700 leading-[0.88] tracking-tight"
                style={{ fontSize: 'clamp(3rem, 6vw, 6.5rem)', color: RED }}
              >
                Morning<br />Pack
              </h2>
            </div>

            <div className="ms-text opacity-0">
              <p className="font-sans font-600 text-[#222] text-xl md:text-2xl tracking-tight mb-4">
                Activate. Focus. Perform.
              </p>
              <p className="font-body font-300 text-[#888] text-sm md:text-base leading-loose max-w-md">
                11 clinically-dosed compounds. No fillers. No fluff. Vitamins, adaptogens and CoQ10
                calibrated to ignite energy, sharpen focus, and prime your body from the first hour of the day.
              </p>
            </div>

            <div className="ms-text opacity-0">
              <IngredientChips chips={CHIPS} gradient={RED} />
            </div>

            <div className="ms-text opacity-0">
              <Link
                href="/products/morning"
                className="inline-flex items-center gap-4 px-8 py-3.5 rounded-full text-white font-sans font-600 text-[11px] tracking-widest uppercase hover:opacity-85 transition-opacity duration-300 group"
                style={{ background: RED }}
              >
                <span>View ingredients</span>
                <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center group-hover:translate-x-1 transition-transform duration-300">
                  <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
                    <path d="M1.5 4.5h6M4.5 2L7 4.5 4.5 7" stroke="white" strokeWidth="1.2" strokeLinecap="round"/>
                  </svg>
                </span>
              </Link>
            </div>

            <div className="ms-text flex gap-10 pt-5 border-t border-[#f5f5f5] opacity-0">
              {[['11', 'Compounds'], ['30', 'Day Supply'], ['0', 'Fillers']].map(([v, l]) => (
                <div key={l}>
                  <p className="font-sans font-700 text-2xl text-[#222] leading-none">{v}</p>
                  <p className="font-body text-[9px] tracking-widest text-[#bbb] uppercase mt-1">{l}</p>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
