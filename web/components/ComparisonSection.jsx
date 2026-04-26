'use client';

import { useEffect, useRef } from 'react';
import Image from 'next/image';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

const MG = 'linear-gradient(135deg, #FFF5DC 0%, #FF8A00 60%, #C62828 100%)';
const RG = 'linear-gradient(135deg, #7C3AED 0%, #5B21B6 45%, #1D4ED8 100%)';

const M_SPECS = [
  { label: 'Serving size', value: '7g' },
  { label: 'Portions',     value: '30' },
  { label: 'Total weight', value: '210g' },
  { label: 'Profile',      value: 'Energy & Focus' },
];
const R_SPECS = [
  { label: 'Serving size', value: '40g' },
  { label: 'Portions',     value: '30' },
  { label: 'Total weight', value: '1200g' },
  { label: 'Profile',      value: 'Recovery & Performance' },
];

export default function ComparisonSection() {
  const sectionRef = useRef(null);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const ctx = gsap.context(() => {
      gsap.fromTo('.cs-img',
        { opacity: 0, y: 20, scale: 0.98 },
        { opacity: 1, y: 0, scale: 1, duration: 0.65, ease: 'power3.out',
          scrollTrigger: { trigger: sectionRef.current, start: 'top 92%' } }
      );
      gsap.fromTo('.cs-col',
        { opacity: 0, y: 18 },
        { opacity: 1, y: 0, duration: 0.5, ease: 'power3.out', stagger: 0.1,
          scrollTrigger: { trigger: '.cs-cols', start: 'top 94%' } }
      );
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="py-24 md:py-36 px-6 md:px-16 overflow-hidden"
      style={{ background: 'linear-gradient(180deg, #F8F5FF 0%, #FFF9F5 100%)' }}
    >
      <div className="max-w-[1440px] mx-auto">

        <div className="flex items-center gap-3 mb-14">
          <div className="h-px w-5" style={{ background: MG }} />
          <span className="font-body text-[9px] tracking-widest3 text-[#999] uppercase">The products</span>
        </div>

        {/* Both products image */}
        <div className="cs-img relative rounded-2xl overflow-hidden aspect-[16/7] mb-16 opacity-0 bg-[#f8f8f8]">
          <Image
            src="/Cutii.png"
            alt="LIFECODE Products"
            fill
            className="object-contain p-6 md:p-10"
            sizes="100vw"
            loading="lazy"
          />
        </div>

        {/* Comparison */}
        <div className="cs-cols grid grid-cols-1 md:grid-cols-2 gap-5">

          <div className="cs-col opacity-0" style={{ padding: '1.5px', borderRadius: '20px', background: MG }}>
            <div className="bg-white h-full p-8 md:p-10" style={{ borderRadius: '18.5px' }}>
              <div className="flex items-center gap-3 mb-8">
                <span
                  className="font-body text-[8px] tracking-widest3 uppercase px-3 py-1 rounded-full text-white"
                  style={{ background: MG }}
                >
                  AM
                </span>
                <span className="font-sans font-700 text-[#222] text-lg tracking-tight">Morning Pack</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {M_SPECS.map(s => (
                  <div key={s.label} className="border border-[#f5f5f5] rounded-xl p-4">
                    <p className="font-body text-[9px] tracking-widest text-[#bbb] uppercase mb-2">{s.label}</p>
                    <p className="font-sans font-700 text-[#222] text-xl leading-tight">{s.value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="cs-col opacity-0" style={{ padding: '1.5px', borderRadius: '20px', background: RG }}>
            <div className="bg-white h-full p-8 md:p-10" style={{ borderRadius: '18.5px' }}>
              <div className="flex items-center gap-3 mb-8">
                <span
                  className="font-body text-[8px] tracking-widest3 uppercase px-3 py-1 rounded-full text-white"
                  style={{ background: RG }}
                >
                  PM
                </span>
                <span className="font-sans font-700 text-[#222] text-lg tracking-tight">Recovery Pack</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {R_SPECS.map(s => (
                  <div key={s.label} className="border border-[#f5f5f5] rounded-xl p-4">
                    <p className="font-body text-[9px] tracking-widest text-[#bbb] uppercase mb-2">{s.label}</p>
                    <p className="font-sans font-700 text-[#222] text-xl leading-tight">{s.value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
