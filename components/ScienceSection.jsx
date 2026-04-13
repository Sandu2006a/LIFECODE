'use client';

import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

/* ─── Data ─────────────────────────────────────────────────────── */
const METRICS = [
  { value: '47',  unit: 'bioactive compounds', label: 'per formulation' },
  { value: '99.3', unit: '%',                   label: 'absorption accuracy' },
  { value: '3',   unit: 'phase protocol',       label: 'circadian-aligned' },
];

const PILLARS = [
  {
    index: '01',
    title: 'Molecular Precision',
    body:
      'Each compound is dosed at the exact threshold where biochemical response peaks — not rounded for convenience. We work at the intersection of clinical nutrition science and elite sports physiology.',
  },
  {
    index: '02',
    title: 'Circadian Alignment',
    body:
      'Your endocrine system follows a 24-hour rhythm. Our three-phase protocol delivers specific nutrient profiles timed to your cortisol curve, anabolic window, and overnight cellular repair cycle.',
  },
  {
    index: '03',
    title: 'Zero Compromise Stack',
    body:
      'No fillers, no proprietary blend obscurement, no artificial colouring. Every ingredient is declared, third-party verified, and selected because the evidence mandates it — nothing else.',
  },
];

/* ─── Component ─────────────────────────────────────────────────── */
export default function ScienceSection() {
  const sectionRef  = useRef(null);
  const headingRef  = useRef(null);
  const metricsRef  = useRef(null);
  const pillarsRef  = useRef(null);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    // ── Heading fade-up
    gsap.fromTo(
      headingRef.current.querySelectorAll('.reveal-line'),
      { opacity: 0, y: 50 },
      {
        opacity: 1,
        y: 0,
        duration: 1.1,
        ease: 'power4.out',
        stagger: 0.12,
        scrollTrigger: {
          trigger: headingRef.current,
          start: 'top 80%',
          toggleActions: 'play none none none',
        },
      }
    );

    // ── Metrics counter-reveal
    const metricEls = metricsRef.current.querySelectorAll('.metric-item');
    gsap.fromTo(
      metricEls,
      { opacity: 0, y: 40 },
      {
        opacity: 1,
        y: 0,
        duration: 0.9,
        ease: 'power3.out',
        stagger: 0.15,
        scrollTrigger: {
          trigger: metricsRef.current,
          start: 'top 78%',
          toggleActions: 'play none none none',
        },
      }
    );

    // ── Pillar cards slide up
    const pillarEls = pillarsRef.current.querySelectorAll('.pillar-card');
    gsap.fromTo(
      pillarEls,
      { opacity: 0, y: 60 },
      {
        opacity: 1,
        y: 0,
        duration: 1,
        ease: 'power3.out',
        stagger: 0.18,
        scrollTrigger: {
          trigger: pillarsRef.current,
          start: 'top 78%',
          toggleActions: 'play none none none',
        },
      }
    );

    // ── Vertical grid lines grow down
    const lines = sectionRef.current.querySelectorAll('.grid-line');
    gsap.fromTo(
      lines,
      { scaleY: 0, transformOrigin: 'top' },
      {
        scaleY: 1,
        duration: 1.6,
        ease: 'power4.inOut',
        stagger: 0.1,
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top 85%',
          toggleActions: 'play none none none',
        },
      }
    );
  }, []);

  return (
    <section
      ref={sectionRef}
      id="science"
      className="relative py-36 px-6 md:px-16 overflow-hidden"
    >
      {/* Decorative vertical grid lines */}
      <div className="pointer-events-none absolute inset-0 flex justify-between px-16 md:px-32">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="grid-line h-full" style={{ scaleY: 0 }} />
        ))}
      </div>

      <div className="relative z-10 max-w-6xl mx-auto">

        {/* ── Eyebrow */}
        <p className="font-body text-xs tracking-widest2 text-lc-dim uppercase mb-12">
          The Science Behind
        </p>

        {/* ── Heading */}
        <div ref={headingRef} className="mb-24 max-w-3xl">
          <h2
            className="
              font-sans font-700 text-white leading-tight
              text-[clamp(2rem,5vw,5rem)] tracking-tight
            "
          >
            {[
              'Biology runs on',
              'precision inputs.',
              'So do we.',
            ].map((line, i) => (
              <span
                key={i}
                className="reveal-line block"
                style={{ opacity: 0 }}
              >
                {line}
              </span>
            ))}
          </h2>
        </div>

        {/* ── Metrics bar */}
        <div
          ref={metricsRef}
          className="
            grid grid-cols-1 md:grid-cols-3
            border-t border-b border-lc-line
            py-10 mb-28 gap-10 md:gap-0
          "
        >
          {METRICS.map((m, i) => (
            <div
              key={i}
              className="
                metric-item
                flex flex-col gap-1
                md:border-r last:border-r-0 border-lc-line
                md:pl-10 first:pl-0
              "
              style={{ opacity: 0 }}
            >
              <div className="flex items-baseline gap-2">
                <span className="font-sans font-700 text-white text-5xl tracking-tight">
                  {m.value}
                </span>
                <span className="font-body text-xs text-lc-dim uppercase tracking-wider">
                  {m.unit}
                </span>
              </div>
              <span className="font-body text-xs text-lc-dim tracking-widest uppercase">
                {m.label}
              </span>
            </div>
          ))}
        </div>

        {/* ── Pillar cards */}
        <div
          ref={pillarsRef}
          className="grid grid-cols-1 md:grid-cols-3 gap-0 md:gap-px bg-lc-line"
        >
          {PILLARS.map((pillar) => (
            <div
              key={pillar.index}
              className="
                pillar-card
                bg-lc-black p-10 md:p-14
                flex flex-col gap-6
                group
                transition-colors duration-500
                hover:bg-[#0A0A0A]
              "
              style={{ opacity: 0 }}
            >
              <span className="font-body text-xs tracking-widest2 text-lc-dim uppercase">
                {pillar.index}
              </span>
              <h3
                className="
                  font-sans font-600 text-lc-silver
                  text-xl tracking-tight leading-snug
                  group-hover:text-white transition-colors duration-500
                "
              >
                {pillar.title}
              </h3>
              <p className="font-body font-300 text-lc-dim text-sm leading-loose tracking-wide">
                {pillar.body}
              </p>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
