'use client';

import { useEffect, useRef } from 'react';
import { gsap }          from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Image             from 'next/image';

/* ─── Product data ─────────────────────────────────────────────── */
const PRODUCTS = [
  {
    id: 'morning',
    phase: '01',
    title: 'Morning Pack',
    tagline: 'Activate.',
    accent: 'rgba(180,40,40,0.8)',
    accentColor: '#b42828',
    coming: false,
    ingredients: [
      { name: 'Vitamina A',      detail: 'Retinyl Palmitate (CWD)',              dose: '800 µg'  },
      { name: 'Vitamina C',      detail: 'Ascorbat de Calciu',                   dose: '200 mg'  },
      { name: 'Vitamina D3',     detail: 'Colecalciferol (Vegan)',               dose: '25 µg'   },
      { name: 'Vitamina E',      detail: 'd-alpha-Tocopheryl',                   dose: '12 mg'   },
      { name: 'Vitamina K2',     detail: 'Menaquinonă-7 (MK-7)',                 dose: '50 µg'   },
      { name: 'Vitamina B12',    detail: 'Metilcobalamină',                      dose: '100 µg'  },
      { name: 'Complex B',       detail: 'Premix B-Complex Metilat',             dose: '100% RDR'},
      { name: 'Zinc',            detail: 'Bisglicinat de Zinc',                  dose: '10 mg'   },
      { name: 'Cupru',           detail: 'Bisglicinat de Cupru',                 dose: '0.5 mg'  },
      { name: 'Magneziu',        detail: 'Citrat de Magneziu',                   dose: '350 mg'  },
      { name: 'Seleniu',         detail: 'Selenometionină',                      dose: '50 µg'   },
    ],
  },
  {
    id: 'training',
    phase: '02',
    title: 'Training Gel',
    tagline: 'Perform.',
    accent: 'rgba(220,220,220,0.8)',
    accentColor: '#dcdcdc',
    coming: false,
    ingredients: [
      { name: 'L-Citrulline',         detail: 'Maximum nitric oxide / Vasodilation',         dose: '5000 mg' },
      { name: 'Beta-Alanine',         detail: 'Carnosine booster / Lactic acid buffer',       dose: '3000 mg' },
      { name: 'Taurine',              detail: 'Cellular hydration / CNS neuro-protection',    dose: '2000 mg' },
      { name: 'Glycerol',             detail: 'Hyper-hydration / Intracellular pressure',     dose: '2000 mg' },
      { name: 'Caffeine Anhydrous',   detail: 'Metabolic stimulant / Cognitive alertness',    dose: '200 mg'  },
      { name: 'Himalayan Pink Salt',  detail: 'Trace minerals / Electrolyte balance',         dose: '250 mg'  },
      { name: 'Natural Menthol',      detail: 'Respiratory optimization (Airflow effect)',    dose: '10 mg'   },
      { name: 'Black Pepper Extract', detail: 'Bio-availability enhancer (95% Piperine)',     dose: '5 mg'    },
      { name: 'Vitamin B12',          detail: 'ATP production / Cellular energy (Thorne)',    dose: '500 mcg' },
      { name: 'Vitamin B6',           detail: 'Active co-enzyme / Neurotransmitter synthesis',dose: '10 mg'   },
    ],
  },
  {
    id: 'recovery',
    phase: '03',
    title: 'Recovery Pack',
    tagline: 'Rebuild.',
    accent: 'rgba(30,80,180,0.8)',
    accentColor: '#1e50b4',
    coming: true,
    ingredients: [],
  },
];

/* ─── Component ─────────────────────────────────────────────────── */
export default function ProductSection() {
  const sectionRef = useRef(null);
  const imgWrapRef = useRef(null);
  const imgRef     = useRef(null);
  const eyebrowRef = useRef(null);
  const glowRef    = useRef(null);
  const cardRefs   = useRef([]);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const ctx = gsap.context(() => {

      /* eyebrow */
      gsap.fromTo(eyebrowRef.current,
        { opacity: 0, y: 14 },
        { opacity: 1, y: 0, duration: 0.9, ease: 'power3.out',
          scrollTrigger: { trigger: sectionRef.current, start: 'top 78%' } }
      );

      /* image reveal */
      gsap.fromTo(imgWrapRef.current,
        { opacity: 0, scale: 0.9, y: 50 },
        { opacity: 1, scale: 1, y: 0, duration: 1.3, ease: 'power4.out',
          scrollTrigger: { trigger: sectionRef.current, start: 'top 68%' } }
      );

      /* parallax drift */
      gsap.to(imgRef.current, {
        y: -50, ease: 'none',
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top bottom', end: 'bottom top', scrub: 1.8,
        },
      });

      /* glow pulse */
      gsap.to(glowRef.current, {
        opacity: 0.55, duration: 2.6, repeat: -1, yoyo: true, ease: 'sine.inOut',
        scrollTrigger: { trigger: sectionRef.current, start: 'top 68%' },
      });

      /* cards staggered */
      if (cardRefs.current[0]) {
        gsap.fromTo(cardRefs.current,
          { opacity: 0, y: 60 },
          { opacity: 1, y: 0, duration: 1, ease: 'power3.out', stagger: 0.18,
            scrollTrigger: { trigger: cardRefs.current[0], start: 'top 88%' } }
        );
      }

    }, sectionRef);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} id="product" className="relative bg-lc-black py-28 md:py-44 overflow-hidden">

      {/* atmospheric bg glow */}
      <div className="pointer-events-none absolute inset-0"
        style={{ background: 'radial-gradient(ellipse 65% 55% at 50% 38%, rgba(255,255,255,0.022) 0%, transparent 70%)' }} />

      {/* eyebrow */}
      <div ref={eyebrowRef} className="text-center mb-14 opacity-0">
        <p className="font-body text-[10px] tracking-widest3 text-lc-dim uppercase">The Product</p>
      </div>

      {/* ── image ───────────────────────────────────────────────── */}
      <div ref={imgWrapRef} className="relative mx-auto opacity-0 px-6" style={{ maxWidth: 700 }}>

        {/* glow behind */}
        <div ref={glowRef} className="absolute inset-0 pointer-events-none opacity-25"
          style={{ background: 'radial-gradient(ellipse 75% 55% at 50% 58%, rgba(255,255,255,0.14) 0%, transparent 68%)', filter: 'blur(36px)' }} />

        {/* edge blend into bg */}
        <div className="absolute inset-0 pointer-events-none z-10"
          style={{ background: 'linear-gradient(to right, #000 0%, transparent 16%, transparent 84%, #000 100%), linear-gradient(to bottom, #000 0%, transparent 10%, transparent 88%, #000 100%)' }} />

        <div ref={imgRef}>
          <Image
            src="/produse.png"
            alt="LIFECODE — Morning Pack, Training Gel, Recovery Pack"
            width={700} height={520}
            className="w-full h-auto object-contain select-none"
            priority
          />
        </div>
      </div>

      {/* ── product cards ────────────────────────────────────────── */}
      <div className="mt-24 px-5 md:px-12 max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-white/[0.05]">

          {PRODUCTS.map((p, i) => (
            <div
              key={p.id}
              ref={(el) => (cardRefs.current[i] = el)}
              className="relative bg-lc-black opacity-0 px-7 py-8"
            >
              {/* top accent line */}
              <div className="h-px w-full mb-7"
                style={{ background: `linear-gradient(to right, transparent, ${p.accent}, transparent)` }} />

              {/* phase + title */}
              <div className="flex items-baseline gap-3 mb-2">
                <span className="font-body text-[9px] tracking-widest2 text-lc-dim uppercase">{p.phase}</span>
                <h3 className="font-sans font-600 text-white text-[14px] tracking-tight">{p.title}</h3>
              </div>

              {/* tagline */}
              <p className="font-sans font-700 leading-none tracking-tight mb-7"
                style={{ fontSize: 'clamp(2rem,3.5vw,2.8rem)', color: p.accentColor, opacity: 0.35 }}>
                {p.tagline}
              </p>

              {/* ── COMING SOON ── */}
              {p.coming ? (
                <div className="flex flex-col items-start gap-4 pt-2">
                  <div className="w-8 h-px" style={{ background: p.accentColor, opacity: 0.4 }} />
                  <p className="font-sans font-600 text-white/70 text-[13px] tracking-wider uppercase">
                    Coming Soon
                  </p>
                  <p className="font-body font-300 text-lc-dim/60 text-[11px] leading-loose tracking-wide max-w-[240px]">
                    Formula is still being perfected. Built around deep recovery, electrolyte replenishment, and cellular repair.
                  </p>
                  {/* pulsing dot */}
                  <div className="flex items-center gap-2 mt-2">
                    <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: p.accentColor }} />
                    <span className="font-body text-[9px] tracking-widest2 uppercase text-lc-dim/40">In development</span>
                  </div>
                </div>
              ) : (
                /* ── INGREDIENT LIST ── */
                <div className="space-y-0">
                  {p.ingredients.map((ing, j) => (
                    <div key={j}
                      className="flex items-start justify-between gap-3 py-[7px] border-b border-white/[0.045] last:border-0">
                      <div className="flex-1 min-w-0">
                        <p className="font-sans font-500 text-white/85 text-[11px] tracking-wide truncate">{ing.name}</p>
                        <p className="font-body font-300 text-lc-dim/55 text-[9.5px] tracking-wide leading-snug mt-0.5 line-clamp-1">{ing.detail}</p>
                      </div>
                      <span className="font-sans font-600 text-[10px] tracking-wider tabular-nums shrink-0 mt-0.5"
                        style={{ color: p.accentColor, opacity: 0.9 }}>
                        {ing.dose}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}

        </div>
      </div>

    </section>
  );
}
