'use client';

import { useEffect, useRef } from 'react';
import Image from 'next/image';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

const MG = 'linear-gradient(135deg, #FF8A00, #C62828)';
const RG = 'linear-gradient(135deg, #7C3AED, #1D4ED8)';

export default function SystemSection() {
  const sectionRef = useRef(null);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const ctx = gsap.context(() => {
      gsap.fromTo('.ss-img',
        { opacity: 0, scale: 1.02 },
        { opacity: 1, scale: 1, duration: 0.75, ease: 'power2.out',
          scrollTrigger: { trigger: sectionRef.current, start: 'top 92%' } }
      );
      gsap.fromTo('.ss-text',
        { opacity: 0, y: 18 },
        { opacity: 1, y: 0, duration: 0.55, ease: 'power3.out', stagger: 0.06,
          scrollTrigger: { trigger: sectionRef.current, start: 'top 90%' } }
      );
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="bg-white py-24 md:py-36 px-6 md:px-16 overflow-hidden">
      <div className="max-w-[1440px] mx-auto">

        <div className="text-center mb-14">
          <div className="ss-text flex items-center justify-center gap-3 mb-6 opacity-0">
            <div className="h-px w-5" style={{ background: MG }} />
            <span className="font-body text-[9px] tracking-widest3 text-[#999] uppercase">The system</span>
            <div className="h-px w-5" style={{ background: RG }} />
          </div>
          <h2
            className="ss-text font-sans font-700 text-[#111] tracking-tight leading-[0.92] opacity-0"
            style={{ fontSize: 'clamp(2.4rem, 5vw, 5.5rem)' }}
          >
            One system.<br />Two moments.
          </h2>
        </div>

        {/* Labels */}
        <div className="ss-text grid grid-cols-2 gap-4 max-w-sm mx-auto mb-12 opacity-0">
          <div style={{ padding: '1.5px', borderRadius: '14px', background: MG }}>
            <div className="bg-white text-center py-4 px-5" style={{ borderRadius: '12.5px' }}>
              <p className="font-sans font-700 text-[#222] text-sm tracking-tight">Morning Pack</p>
              <p className="font-body text-[9px] text-[#aaa] tracking-widest uppercase mt-1">AM · Before activity</p>
            </div>
          </div>
          <div style={{ padding: '1.5px', borderRadius: '14px', background: RG }}>
            <div className="bg-white text-center py-4 px-5" style={{ borderRadius: '12.5px' }}>
              <p className="font-sans font-700 text-[#222] text-sm tracking-tight">Recovery Pack</p>
              <p className="font-body text-[9px] text-[#aaa] tracking-widest uppercase mt-1">PM · After effort</p>
            </div>
          </div>
        </div>

        {/* Image */}
        <div className="ss-img relative rounded-2xl overflow-hidden aspect-[16/7] opacity-0">
          <Image
            src="/Pachetelele_masa.png"
            alt="LIFECODE System"
            fill
            className="object-cover"
            sizes="100vw"
            loading="lazy"
          />
        </div>

      </div>
    </section>
  );
}
