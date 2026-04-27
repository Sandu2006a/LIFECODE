'use client';

import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

const PHASES = [
  {
    n: '01',
    title: 'Molecular Precision',
    body: 'Each compound dosed at the exact biochemical threshold where cellular response peaks — not rounded for convenience.',
  },
  {
    n: '02',
    title: 'Circadian Alignment',
    body: 'Three distinct nutrient profiles timed to your cortisol curve, anabolic window, and overnight repair cycle.',
  },
  {
    n: '03',
    title: 'Zero Compromise',
    body: 'No fillers. No proprietary blends. Every ingredient declared, third-party verified, evidence-mandated.',
  },
];

const STATS = [
  { value: '47',    label: 'Bioactive compounds per formulation' },
  { value: '99.3%', label: 'Absorption accuracy'                },
  { value: '0',     label: 'Fillers or artificial additives'    },
];

export default function ScienceSection() {
  const sectionRef = useRef(null);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const ctx = gsap.context(() => {

      gsap.fromTo('.sci-head',
        { opacity: 0, y: 50 },
        { opacity: 1, y: 0, duration: 1, ease: 'power4.out', stagger: 0.1,
          scrollTrigger: { trigger: '.sci-head', start: 'top 80%' } }
      );

      gsap.fromTo('.sci-stat',
        { opacity: 0, y: 40 },
        { opacity: 1, y: 0, duration: 0.9, ease: 'power3.out', stagger: 0.14,
          scrollTrigger: { trigger: '.sci-stat', start: 'top 82%' } }
      );

      gsap.fromTo('.sci-phase',
        { opacity: 0, y: 50 },
        { opacity: 1, y: 0, duration: 0.95, ease: 'power3.out', stagger: 0.16,
          scrollTrigger: { trigger: '.sci-phase', start: 'top 82%' } }
      );

    }, sectionRef);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} id="science" style={{ background: '#3A0008' }}>

      {/* Top: heading + stats */}
      <div className="px-6 md:px-16 pt-28 pb-20 max-w-[1440px] mx-auto">

        <div className="flex items-center gap-3 mb-12">
          <div className="w-6 h-px bg-lc-orange" />
          <span className="font-body text-[12px] tracking-widest3 text-lc-orange uppercase">The Science</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-end mb-24">
          <h2 className="sci-head font-sans font-700 text-white leading-tight tracking-tight opacity-0"
            style={{ fontSize: 'clamp(2.2rem,5vw,5.2rem)' }}>
            Biology runs on<br />
            <span style={{ color: '#E8631A' }}>precision inputs.</span><br />
            So do we.
          </h2>
          <p className="sci-head font-body font-300 text-white/50 text-base md:text-lg leading-loose opacity-0 self-end max-w-sm">
            We work at the intersection of clinical nutrition science and elite sports physiology —
            delivering compounds that work, at doses that matter.
          </p>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-1 md:grid-cols-3 border-t border-white/10 pt-12 gap-10 md:gap-0">
          {STATS.map((s, i) => (
            <div key={i} className="sci-stat opacity-0 md:border-r border-white/10 last:border-r-0 md:pr-12 md:pl-12 first:pl-0">
              <p className="font-sans font-700 text-white leading-none mb-2" style={{ fontSize: 'clamp(2.8rem,4.5vw,5rem)' }}>
                {s.value}
              </p>
              <p className="font-body text-[13px] tracking-widest text-white/40 uppercase">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Phases */}
      <div className="border-t border-white/10">
        <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-white/10">
          {PHASES.map(p => (
            <div key={p.n} className="sci-phase opacity-0 px-10 md:px-12 py-16 group hover:bg-white/[0.03] transition-colors duration-500">
              <span className="font-sans font-700 text-lc-orange/40 text-5xl leading-none block mb-8">{p.n}</span>
              <h3 className="font-sans font-600 text-white text-xl tracking-tight mb-5 group-hover:text-lc-orange transition-colors duration-400">
                {p.title}
              </h3>
              <p className="font-body font-300 text-white/45 text-base leading-loose">{p.body}</p>
            </div>
          ))}
        </div>
      </div>

    </section>
  );
}
