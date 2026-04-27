'use client';

import { useEffect, useRef } from 'react';
import Image from 'next/image';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

const MG = 'linear-gradient(135deg, #FFF5DC 0%, #FF8A00 60%, #C62828 100%)';
const BOX_G = 'linear-gradient(135deg, #FF8A00 0%, #C62828 40%, #7C3AED 70%, #1D4ED8 100%)';

const ROWS = [
  { label: 'System structure',   lifecode: 'Designed as one protocol', blend: 'Random products', multi: 'Multiple brands' },
  { label: 'Ingredient dosing',  lifecode: 'Clinical, transparent doses', blend: 'Proprietary blends', multi: 'Often underdosed' },
  { label: 'Tracking',           lifecode: 'Real-time AI app', blend: 'None', multi: 'Manual / none' },
  { label: 'Timing guidance',    lifecode: 'AM + PM protocol built-in', blend: 'None', multi: 'User guesses' },
  { label: 'Convenience',        lifecode: 'Two moments. Done.', blend: 'Varies', multi: '6+ products daily' },
  { label: 'App integration',    lifecode: 'Full AI nutrition coach', blend: '✗', multi: '✗' },
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
        { opacity: 1, y: 0, duration: 0.5, ease: 'power3.out', stagger: 0.08,
          scrollTrigger: { trigger: '.cs-table', start: 'top 94%' } }
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

        <div className="flex items-center gap-3 mb-6">
          <div className="h-px w-5" style={{ background: MG }} />
          <span className="font-body text-[14px] tracking-widest3 text-[#999] uppercase">The comparison</span>
        </div>

        <h2
          className="font-sans font-700 text-[#111] tracking-tight leading-[0.92] mb-14"
          style={{ fontSize: 'clamp(2.2rem, 4.5vw, 5rem)' }}
        >
          Why a system beats<br />a stack.
        </h2>

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

        {/* Comparison table */}
        <div className="cs-table overflow-x-auto">
          <table className="w-full min-w-[600px] border-collapse">
            <thead>
              <tr>
                <th className="text-left pb-5 pr-4 font-body text-[13px] tracking-widest text-[#ccc] uppercase font-400 w-[28%]"></th>
                {/* LIFECODE column header */}
                <th className="pb-5 px-4 w-[24%]">
                  <div className="cs-col opacity-0" style={{ padding: '1.5px', borderRadius: '12px', background: BOX_G }}>
                    <div className="bg-white py-3 px-4 rounded-[10.5px] text-center">
                      <p className="font-sans font-700 text-[#111] text-sm tracking-tight bg-clip-text text-transparent"
                        style={{ backgroundImage: BOX_G }}>
                        LIFECODE
                      </p>
                      <p className="font-body text-[13px] tracking-widest text-[#ccc] uppercase mt-0.5">System</p>
                    </div>
                  </div>
                </th>
                <th className="pb-5 px-4 w-[24%]">
                  <div className="cs-col opacity-0 border border-[#f0f0f0] rounded-xl py-3 px-4 text-center">
                    <p className="font-sans font-600 text-[#bbb] text-sm tracking-tight">Typical blend</p>
                    <p className="font-body text-[13px] tracking-widest text-[#ddd] uppercase mt-0.5">Single product</p>
                  </div>
                </th>
                <th className="pb-5 pl-4 w-[24%]">
                  <div className="cs-col opacity-0 border border-[#f0f0f0] rounded-xl py-3 px-4 text-center">
                    <p className="font-sans font-600 text-[#bbb] text-sm tracking-tight">Multiple brands</p>
                    <p className="font-body text-[13px] tracking-widest text-[#ddd] uppercase mt-0.5">DIY stack</p>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {ROWS.map((row, i) => (
                <tr
                  key={row.label}
                  className="cs-col border-t border-[#f5f5f5]"
                  style={{ opacity: 0 }}
                >
                  <td className="py-5 pr-4">
                    <p className="font-body text-[15px] tracking-widest text-[#aaa] uppercase">{row.label}</p>
                  </td>
                  {/* LIFECODE value */}
                  <td className="py-5 px-4">
                    <div className="flex items-start gap-2">
                      <div className="flex-shrink-0 mt-[5px] w-1.5 h-1.5 rounded-full" style={{ background: BOX_G }} />
                      <p className="font-sans font-600 text-[#222] text-[17px] leading-snug">{row.lifecode}</p>
                    </div>
                  </td>
                  {/* Blend value */}
                  <td className="py-5 px-4">
                    <p className="font-body text-[17px] text-[#bbb] leading-snug">{row.blend}</p>
                  </td>
                  {/* Multi value */}
                  <td className="py-5 pl-4">
                    <p className="font-body text-[17px] text-[#bbb] leading-snug">{row.multi}</p>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>
    </section>
  );
}
