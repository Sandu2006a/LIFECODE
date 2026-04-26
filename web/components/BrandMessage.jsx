'use client';

import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

const CARDS = [
  { n: '01', title: 'Performance driven',  body: 'Formulas built around measurable athletic output, not general wellness.' },
  { n: '02', title: 'Daily energy',         body: 'Sustained cellular energy through clinical-grade micronutrient dosing.' },
  { n: '03', title: 'Faster recovery',      body: 'Post-effort repair at the molecular level — ready for tomorrow.' },
  { n: '04', title: 'Simple system',        body: 'Two moments. Morning and Recovery. Nothing more, nothing less.' },
];

const CARD_GRADIENTS = [
  'linear-gradient(135deg, #FFD54F, #FF8A00)',
  'linear-gradient(135deg, #FF8A00, #C62828)',
  'linear-gradient(135deg, #C62828, #7C3AED)',
  'linear-gradient(135deg, #7C3AED, #1D4ED8)',
];

export default function BrandMessage() {
  const sectionRef = useRef(null);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const ctx = gsap.context(() => {
      gsap.fromTo('.bm-head',
        { opacity: 0, y: 25 },
        { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out', stagger: 0.06,
          scrollTrigger: { trigger: '.bm-head', start: 'top 92%' } }
      );
      gsap.fromTo('.bm-card',
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.5, ease: 'power3.out', stagger: 0.05,
          scrollTrigger: { trigger: '.bm-card', start: 'top 94%' } }
      );
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="py-28 md:py-40 px-6 md:px-16"
      style={{ background: 'linear-gradient(180deg, #FFF9F5 0%, #ffffff 50%, #F8F5FF 100%)' }}
    >
      <div className="max-w-[1440px] mx-auto">

        <div className="mb-20 md:mb-28">
          <div className="bm-head flex items-center gap-3 mb-8 opacity-0">
            <div className="w-5 h-px" style={{ background: 'linear-gradient(90deg, #FF8A00, #C62828)' }} />
            <span className="font-body text-[9px] tracking-widest3 uppercase" style={{ color: '#FF8A00' }}>
              The philosophy
            </span>
          </div>
          <h2
            className="bm-head font-sans font-700 text-[#111] leading-[0.92] tracking-tight opacity-0"
            style={{ fontSize: 'clamp(2.4rem, 5.5vw, 5.5rem)' }}
          >
            Built for performance,<br />
            <span className="bg-clip-text text-transparent"
              style={{ backgroundImage: 'linear-gradient(90deg, #FF8A00, #C62828, #7C3AED)' }}>
              not average health.
            </span>
          </h2>
          <p className="bm-head font-body font-300 text-[#999] text-sm md:text-base leading-loose max-w-lg mt-8 opacity-0">
            LIFECODE is designed for people who train, push limits and care about measurable results.
            Energy, recovery and focus are not optional — they are optimised.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
          {CARDS.map((c, i) => (
            <div
              key={c.n}
              className="bm-card group relative opacity-0"
              style={{ padding: '1.5px', borderRadius: '16px', background: CARD_GRADIENTS[i] }}
            >
              <div className="bg-white h-full p-7 flex flex-col" style={{ borderRadius: '14.5px' }}>
                <span
                  className="font-body text-[8px] tracking-widest3 uppercase block mb-5"
                  style={{ background: CARD_GRADIENTS[i], WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}
                >
                  {c.n}
                </span>
                <h3 className="font-sans font-600 text-[#222] text-base tracking-tight mb-3">
                  {c.title}
                </h3>
                <p className="font-body font-300 text-[#999] text-[13px] leading-loose">
                  {c.body}
                </p>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
