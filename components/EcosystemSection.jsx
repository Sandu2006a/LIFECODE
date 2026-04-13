'use client';

import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

const ITEMS = [
  {
    step:  '01',
    label: 'Choose your phases',
    desc:  'Select the protocols that match your training calendar — individual or all three.',
  },
  {
    step:  '02',
    label: 'Calibrate the dose',
    desc:  'Input your weight, activity level, and performance goals. We adjust every ratio.',
  },
  {
    step:  '03',
    label: 'Build the box',
    desc:  'Your custom formulation, packaged without surplus. Delivered monthly on your schedule.',
  },
];

export default function EcosystemSection() {
  const sectionRef = useRef(null);
  const headRef    = useRef(null);
  const stepsRef   = useRef(null);
  const ctaRef     = useRef(null);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    // Heading
    gsap.fromTo(
      headRef.current.querySelectorAll('.eco-line'),
      { opacity: 0, y: 50 },
      {
        opacity: 1,
        y: 0,
        duration: 1.1,
        ease: 'power4.out',
        stagger: 0.1,
        scrollTrigger: {
          trigger: headRef.current,
          start: 'top 80%',
          toggleActions: 'play none none none',
        },
      }
    );

    // Step items
    gsap.fromTo(
      stepsRef.current.querySelectorAll('.step-item'),
      { opacity: 0, y: 40 },
      {
        opacity: 1,
        y: 0,
        duration: 0.9,
        ease: 'power3.out',
        stagger: 0.15,
        scrollTrigger: {
          trigger: stepsRef.current,
          start: 'top 78%',
          toggleActions: 'play none none none',
        },
      }
    );

    // CTA
    gsap.fromTo(
      ctaRef.current,
      { opacity: 0, y: 30 },
      {
        opacity: 1,
        y: 0,
        duration: 1,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: ctaRef.current,
          start: 'top 85%',
          toggleActions: 'play none none none',
        },
      }
    );
  }, []);

  return (
    <section
      ref={sectionRef}
      id="ecosystem"
      className="relative min-h-screen flex flex-col justify-center py-40 px-6 md:px-16 overflow-hidden"
    >
      {/* Background: very subtle radial highlight */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 70% 50% at 50% 80%, rgba(229,229,229,0.03) 0%, transparent 70%)',
        }}
      />

      <div className="relative z-10 max-w-6xl mx-auto w-full">

        {/* ── Eyebrow */}
        <p className="font-body text-xs tracking-widest2 text-lc-dim uppercase mb-12">
          Create Your Ecosystem
        </p>

        {/* ── Heading */}
        <div ref={headRef} className="mb-28">
          <h2
            className="
              font-sans font-700 text-white leading-tight
              text-[clamp(2rem,5.5vw,5.5rem)] tracking-tight
            "
          >
            {[
              'Build the exact',
              'protocol your',
              'biology demands.',
            ].map((line, i) => (
              <span
                key={i}
                className="eco-line block"
                style={{ opacity: 0 }}
              >
                {line}
              </span>
            ))}
          </h2>
        </div>

        {/* ── Steps */}
        <div
          ref={stepsRef}
          className="grid grid-cols-1 md:grid-cols-3 gap-px bg-lc-line mb-28"
        >
          {ITEMS.map((item) => (
            <div
              key={item.step}
              className="
                step-item
                bg-lc-black p-10 md:p-14
                flex flex-col gap-5
                group
                hover:bg-[#080808] transition-colors duration-500
              "
              style={{ opacity: 0 }}
            >
              <span className="font-body text-xs tracking-widest2 text-lc-dim uppercase">
                {item.step}
              </span>
              <h3
                className="
                  font-sans font-600 text-lc-silver text-lg tracking-tight
                  group-hover:text-white transition-colors duration-500
                "
              >
                {item.label}
              </h3>
              <p className="font-body font-300 text-lc-dim text-sm leading-loose">
                {item.desc}
              </p>
            </div>
          ))}
        </div>

        {/* ── CTA block */}
        <div
          ref={ctaRef}
          className="flex flex-col md:flex-row items-start md:items-center justify-between gap-10"
          style={{ opacity: 0 }}
        >
          {/* Support text */}
          <p
            className="
              font-body font-300 text-lc-dim text-sm leading-loose
              max-w-xs tracking-wide
            "
          >
            Every box is made to order.
            <br />
            No standardised stack. No guesswork.
          </p>

          {/* Main CTA button */}
          <div className="relative group">
            {/* Glow ring */}
            <div
              className="
                absolute -inset-0.5 rounded-full
                bg-gradient-to-r from-lc-silver/20 via-white/10 to-lc-silver/20
                opacity-0 group-hover:opacity-100
                transition-opacity duration-700
                blur-sm
              "
            />
            <button
              className="
                relative
                inline-flex items-center gap-4
                px-10 py-5 rounded-full
                bg-white text-black
                font-sans font-600 text-sm tracking-widest uppercase
                transition-all duration-500
                group-hover:bg-lc-silver
                overflow-hidden
              "
              type="button"
            >
              {/* Shimmer sweep */}
              <span className="btn-shimmer absolute inset-0 rounded-full" />
              <span className="relative z-10">Create Your Ecosystem</span>
              <span
                className="
                  relative z-10
                  w-5 h-5 rounded-full bg-black/10
                  flex items-center justify-center
                  transition-transform duration-500
                  group-hover:translate-x-1
                "
              >
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                  <path
                    d="M2 5h6M5.5 2.5L8 5l-2.5 2.5"
                    stroke="currentColor"
                    strokeWidth="1.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
            </button>
          </div>
        </div>

      </div>
    </section>
  );
}
