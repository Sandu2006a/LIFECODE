'use client';

import { useEffect, useRef } from 'react';
import Image from 'next/image';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

const RED    = '#C62828';
const PURPLE = '#7C3AED';

const BLOCKS = [
  {
    tag: 'AM · Morning Pack',
    title: 'Daily activation.',
    body: '11 precision compounds. Vitamins, adaptogens, CoQ10. Everything your body needs to start at full capacity.',
    color: RED,
  },
  {
    tag: 'PM · Recovery Pack',
    title: 'Post-effort repair.',
    body: '10 targeted compounds. EAA, creatine, magnesium. Cellular rebuild starts within the 45-minute window.',
    color: PURPLE,
  },
  {
    tag: '24/7 · AI App',
    title: 'Biology tracked.',
    body: 'Log meals. Track micronutrients in real time. Get protocol advice built around your actual biology.',
    color: '#0F172A',
  },
];

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
    <section ref={sectionRef} className="bg-white py-14 md:py-20 px-6 md:px-16 overflow-hidden">
      <div className="max-w-[1440px] mx-auto">

        <div className="text-center mb-10">
          <div className="ss-text flex items-center justify-center gap-3 mb-6 opacity-0">
            <div className="h-px w-5 bg-[#222]" />
            <span className="font-body text-[9px] tracking-widest3 text-[#999] uppercase">The solution</span>
            <div className="h-px w-5 bg-[#222]" />
          </div>
          <h2
            className="ss-text font-sans font-700 text-[#111] tracking-tight leading-[0.92] opacity-0"
            style={{ fontSize: 'clamp(2.4rem, 5vw, 5.5rem)' }}
          >
            One system.<br />Built for performance.
          </h2>
          <p className="ss-text font-body font-300 text-[#999] text-sm md:text-base leading-loose max-w-md mx-auto mt-6 opacity-0">
            Not a stack. Not a collection. A designed system where every product works with the next.
          </p>
        </div>

        {/* 3 blocks */}
        <div className="ss-text grid grid-cols-1 md:grid-cols-3 gap-5 mb-10 opacity-0">
          {BLOCKS.map((b) => (
            <div key={b.tag} style={{ padding: '1.5px', borderRadius: '18px', background: b.color }}>
              <div className="bg-white h-full p-7 flex flex-col gap-4" style={{ borderRadius: '16.5px' }}>
                <span
                  className="font-body text-[8px] tracking-widest3 uppercase"
                  style={{ color: b.color }}
                >
                  {b.tag}
                </span>
                <h3 className="font-sans font-700 text-[#111] text-lg tracking-tight leading-tight">
                  {b.title}
                </h3>
                <p className="font-body font-300 text-[#999] text-[13px] leading-loose">
                  {b.body}
                </p>
              </div>
            </div>
          ))}
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
