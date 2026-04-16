'use client';

import { useEffect, useRef } from 'react';
import { gsap }          from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Image             from 'next/image';

const PRODUCTS = [
  {
    id: 'morning',
    phase: '01',
    title: 'Morning Pack',
    tagline: 'Activate.',
    body: 'Precision-dosed micronutrients calibrated to your circadian rhythm. Activates cellular respiration and metabolic priming.',
    accent: 'rgba(180, 40, 40, 0.7)',
  },
  {
    id: 'training',
    phase: '02',
    title: 'Training Gel',
    tagline: 'Perform.',
    body: 'Adaptive energy delivery engineered for peak performance windows. Sustains ATP synthesis during maximum output.',
    accent: 'rgba(220, 220, 220, 0.7)',
  },
  {
    id: 'recovery',
    phase: '03',
    title: 'Recovery Pack',
    tagline: 'Rebuild.',
    body: 'Electrolyte matrix with targeted amino acid complexes. Initiates cellular repair and deep rehydration at the tissue level.',
    accent: 'rgba(30, 80, 180, 0.7)',
  },
];

export default function ProductSection() {
  const sectionRef  = useRef(null);
  const imgWrapRef  = useRef(null);
  const imgRef      = useRef(null);
  const eyebrowRef  = useRef(null);
  const cardRefs    = useRef([]);
  const glowRef     = useRef(null);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    const ctx = gsap.context(() => {

      /* ── Eyebrow label fades in as section enters ── */
      gsap.fromTo(eyebrowRef.current,
        { opacity: 0, y: 14 },
        {
          opacity: 1, y: 0, duration: 0.9, ease: 'power3.out',
          scrollTrigger: { trigger: sectionRef.current, start: 'top 75%' },
        }
      );

      /* ── Image: scale + fade in, then subtle parallax ── */
      gsap.fromTo(imgWrapRef.current,
        { opacity: 0, scale: 0.88, y: 40 },
        {
          opacity: 1, scale: 1, y: 0,
          duration: 1.2, ease: 'power4.out',
          scrollTrigger: { trigger: sectionRef.current, start: 'top 65%' },
        }
      );

      /* ── Slow parallax drift while scrolling ── */
      gsap.to(imgRef.current, {
        y: -60,
        ease: 'none',
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top bottom',
          end:   'bottom top',
          scrub: 1.5,
        },
      });

      /* ── Glow pulse on image ── */
      gsap.to(glowRef.current, {
        opacity: 0.5,
        duration: 2.4,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
        scrollTrigger: { trigger: sectionRef.current, start: 'top 65%' },
      });

      /* ── Product cards: staggered rise ── */
      gsap.fromTo(cardRefs.current,
        { opacity: 0, y: 50 },
        {
          opacity: 1, y: 0,
          duration: 0.9,
          ease: 'power3.out',
          stagger: 0.15,
          scrollTrigger: {
            trigger: cardRefs.current[0],
            start: 'top 85%',
          },
        }
      );

    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="product"
      className="relative bg-lc-black py-32 md:py-48 overflow-hidden"
    >

      {/* ── Background radial gradient — atmospheric depth ── */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse 70% 60% at 50% 40%, rgba(255,255,255,0.025) 0%, transparent 70%)',
        }}
      />

      {/* ── Eyebrow ── */}
      <div ref={eyebrowRef} className="text-center mb-16 opacity-0">
        <p className="font-body text-[10px] tracking-widest3 text-lc-dim uppercase">
          The Product
        </p>
      </div>

      {/* ── Product image ── */}
      <div ref={imgWrapRef} className="relative mx-auto opacity-0" style={{ maxWidth: 680 }}>

        {/* Glow behind image */}
        <div
          ref={glowRef}
          className="absolute inset-0 pointer-events-none opacity-30"
          style={{
            background: 'radial-gradient(ellipse 80% 60% at 50% 55%, rgba(255,255,255,0.12) 0%, transparent 70%)',
            filter: 'blur(32px)',
          }}
        />

        {/* Edge fade — makes image blend into black background */}
        <div
          className="absolute inset-0 pointer-events-none z-10"
          style={{
            background: `
              linear-gradient(to right,  #000 0%, transparent 18%, transparent 82%, #000 100%),
              linear-gradient(to bottom, #000 0%, transparent 12%, transparent 85%, #000 100%)
            `,
          }}
        />

        <div ref={imgRef} className="relative">
          <Image
            src="/products.png"
            alt="LIFECODE Products — Morning Pack, Training Gel, Recovery Pack"
            width={680}
            height={520}
            className="w-full h-auto object-contain select-none"
            priority
          />
        </div>
      </div>

      {/* ── Product cards ── */}
      <div className="mt-20 px-6 md:px-14 max-w-5xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          {PRODUCTS.map((p, i) => (
            <div
              key={p.id}
              ref={(el) => (cardRefs.current[i] = el)}
              className="relative group opacity-0"
            >
              {/* Accent line top */}
              <div
                className="h-px w-full mb-6 transition-all duration-500 group-hover:opacity-100 opacity-50"
                style={{ background: `linear-gradient(to right, transparent, ${p.accent}, transparent)` }}
              />

              {/* Phase + title */}
              <div className="mb-3 flex items-baseline gap-3">
                <span className="font-body text-[9px] tracking-widest2 text-lc-dim uppercase">
                  {p.phase}
                </span>
                <h3 className="font-sans font-600 text-white text-[15px] tracking-tight">
                  {p.title}
                </h3>
              </div>

              {/* Tagline */}
              <p className="font-sans font-700 text-white/40 text-[28px] leading-none tracking-tight mb-4">
                {p.tagline}
              </p>

              {/* Description */}
              <p className="font-body font-300 text-lc-dim text-[12px] leading-loose tracking-wide">
                {p.body}
              </p>
            </div>
          ))}
        </div>
      </div>

    </section>
  );
}
