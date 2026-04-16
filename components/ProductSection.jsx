'use client';

import { useEffect, useRef, useState } from 'react';
import { gsap }          from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Image             from 'next/image';

/* ─── Product data — order: Morning, Pure Pump, Endurance, Recovery ─ */
const PRODUCTS = [
  {
    id: 'morning',
    phase: '01',
    title: 'Morning Pack',
    tagline: 'Activate.',
    accent: 'rgba(180,40,40,0.8)',
    accentColor: '#c23a3a',
    coming: false,
    description: 'Precision-dosed micronutrients calibrated to your circadian rhythm. Activates cellular respiration and metabolic priming at the molecular level.',
    ingredients: [
      { name: 'Vitamina A',    detail: 'Retinyl Palmitate (CWD)',         dose: '800 µg'   },
      { name: 'Vitamina C',    detail: 'Ascorbat de Calciu',              dose: '200 mg'   },
      { name: 'Vitamina D3',   detail: 'Colecalciferol (Vegan)',          dose: '25 µg'    },
      { name: 'Vitamina E',    detail: 'd-alpha-Tocopheryl',              dose: '12 mg'    },
      { name: 'Vitamina K2',   detail: 'Menaquinonă-7 (MK-7)',           dose: '50 µg'    },
      { name: 'Vitamina B12',  detail: 'Metilcobalamină',                 dose: '100 µg'   },
      { name: 'Complex B',     detail: 'Premix B-Complex Metilat',        dose: '100% RDR' },
      { name: 'Zinc',          detail: 'Bisglicinat de Zinc',             dose: '10 mg'    },
      { name: 'Cupru',         detail: 'Bisglicinat de Cupru',            dose: '0.5 mg'   },
      { name: 'Magneziu',      detail: 'Citrat de Magneziu',              dose: '350 mg'   },
      { name: 'Seleniu',       detail: 'Selenometionină',                 dose: '50 µg'    },
    ],
  },
  {
    id: 'purepump',
    phase: '02',
    title: 'Pure Pump',
    tagline: 'Perform.',
    accent: 'rgba(210,210,210,0.8)',
    accentColor: '#d4d4d4',
    coming: false,
    description: 'Adaptive energy delivery engineered for peak performance windows. Sustains ATP synthesis during maximum output without metabolic debt.',
    ingredients: [
      { name: 'L-Citrulline',          detail: 'Max nitric oxide / Vasodilation',            dose: '5000 mg'  },
      { name: 'Beta-Alanine',          detail: 'Carnosine booster / Lactic acid buffer',      dose: '3000 mg'  },
      { name: 'Taurine',               detail: 'Cellular hydration / CNS neuro-protection',   dose: '2000 mg'  },
      { name: 'Glycerol',              detail: 'Hyper-hydration / Intracellular pressure',    dose: '2000 mg'  },
      { name: 'Caffeine Anhydrous',    detail: 'Metabolic stimulant / Cognitive alertness',   dose: '200 mg'   },
      { name: 'Himalayan Pink Salt',   detail: 'Trace minerals / Electrolyte balance',        dose: '250 mg'   },
      { name: 'Natural Menthol',       detail: 'Respiratory optimization (Airflow effect)',   dose: '10 mg'    },
      { name: 'Black Pepper Extract',  detail: 'Bio-availability enhancer (95% Piperine)',    dose: '5 mg'     },
      { name: 'Vitamin B12',           detail: 'ATP production / Cellular energy (Thorne)',   dose: '500 mcg'  },
      { name: 'Vitamin B6',            detail: 'Co-enzyme / Neurotransmitter synthesis',      dose: '10 mg'    },
    ],
  },
  {
    id: 'endurance',
    phase: '03',
    title: 'Endurance Gel',
    tagline: 'Sustain.',
    accent: 'rgba(40,160,100,0.8)',
    accentColor: '#28a064',
    coming: false,
    description: 'Primary fuel source for long-duration efforts. Dual-carb matrix with 2:1 ratio for maximum absorption and sustained energy without GI distress.',
    ingredients: [
      { name: 'Maltodextrin (Low DE)',   detail: 'Primary glucose source / Low osmotic stress',       dose: '18 000 mg' },
      { name: 'Fructose',               detail: 'Secondary energy (GLUT5) / 2:1 ratio max absorption',dose: '9 000 mg'  },
      { name: 'Glycerol (Liquid)',       detail: 'Hyper-hydration / Smooth mouthfeel',                dose: '1 500 mg'  },
      { name: 'Sodium',                 detail: 'Himalayan Salt / Fluid balance / Anti-hyponatremia', dose: '250 mg'    },
      { name: 'Potassium Citrate',      detail: 'Muscle function / Intracellular hydration',          dose: '100 mg'    },
      { name: 'Magnesium Citrate',      detail: 'Cramp prevention / Metabolic cofactor',             dose: '100 mg'    },
      { name: 'L-Carnitine Tartrate',   detail: 'Fat metabolism support',                            dose: '500 mg'    },
      { name: 'Natural Menthol',        detail: 'Respiratory relief / Cooling effect',               dose: '10 mg'     },
      { name: 'Vitamin B12',            detail: 'Thorne Standard / Bioactive energy metabolism',      dose: '250 mcg'   },
    ],
  },
  {
    id: 'recovery',
    phase: '04',
    title: 'Recovery Pack',
    tagline: 'Rebuild.',
    accent: 'rgba(30,80,180,0.8)',
    accentColor: '#3a6fd4',
    coming: true,
    description: 'Formula still being perfected. Built around deep recovery, electrolyte replenishment, and cellular repair at the tissue level.',
    ingredients: [],
  },
];

/* ─── Card ─────────────────────────────────────────────────────── */
function ProductCard({ p, cardRef }) {
  const [open, setOpen] = useState(false);
  const listRef  = useRef(null);
  const innerRef = useRef(null);

  const toggle = () => {
    if (!listRef.current || !innerRef.current) return;
    if (!open) {
      const h = innerRef.current.offsetHeight;
      gsap.fromTo(listRef.current,
        { height: 0, opacity: 0 },
        { height: h, opacity: 1, duration: 0.5, ease: 'power3.inOut' }
      );
    } else {
      gsap.to(listRef.current, {
        height: 0, opacity: 0, duration: 0.4, ease: 'power3.inOut',
      });
    }
    setOpen(v => !v);
  };

  return (
    <div ref={cardRef} className="relative bg-lc-black opacity-0 px-6 py-8 flex flex-col">

      {/* top accent line */}
      <div className="h-px w-full mb-7"
        style={{ background: `linear-gradient(to right, transparent, ${p.accent}, transparent)` }} />

      {/* phase + title */}
      <div className="flex items-baseline gap-3 mb-2">
        <span className="font-body text-[9px] tracking-widest2 text-lc-dim uppercase">{p.phase}</span>
        <h3 className="font-sans font-600 text-white text-[14px] tracking-tight">{p.title}</h3>
      </div>

      {/* tagline */}
      <p className="font-sans font-700 leading-none tracking-tight mb-5"
        style={{ fontSize: 'clamp(1.7rem,2.8vw,2.4rem)', color: p.accentColor, opacity: 0.32 }}>
        {p.tagline}
      </p>

      {/* description */}
      <p className="font-body font-300 text-lc-dim/70 text-[11.5px] leading-loose tracking-wide mb-7">
        {p.description}
      </p>

      {/* See more button */}
      {!p.coming && (
        <button onClick={toggle} className="flex items-center gap-2.5 w-fit mb-4">
          <span className="font-body text-[9px] tracking-widest2 uppercase transition-colors duration-300"
            style={{ color: open ? p.accentColor : 'rgba(160,160,160,0.55)' }}>
            {open ? 'Hide' : 'See more'}
          </span>
          <div className="relative w-5 h-px"
            style={{ background: open ? p.accentColor : 'rgba(160,160,160,0.28)' }}>
            <div className="absolute right-0 top-1/2 -translate-y-1/2 transition-transform duration-300"
              style={{ transform: open ? 'translateY(-50%) rotate(90deg)' : 'translateY(-50%)' }}>
              <svg width="5" height="8" viewBox="0 0 5 8" fill="none">
                <path d="M1 1l3 3-3 3" stroke={open ? p.accentColor : 'rgba(160,160,160,0.5)'}
                  strokeWidth="1" strokeLinecap="round" />
              </svg>
            </div>
          </div>
        </button>
      )}

      {/* Collapsible ingredient list */}
      {!p.coming && (
        <div ref={listRef} style={{ height: 0, opacity: 0, overflow: 'hidden' }}>
          <div ref={innerRef} className="pt-2 border-t border-white/[0.06]">
            {p.ingredients.map((ing, j) => (
              <div key={j}
                className="flex items-start justify-between gap-3 py-[7px] border-b border-white/[0.04] last:border-0">
                <div className="flex-1 min-w-0">
                  <p className="font-sans font-500 text-white/85 text-[11px] tracking-wide">{ing.name}</p>
                  <p className="font-body font-300 text-lc-dim/50 text-[9.5px] tracking-wide leading-snug mt-0.5">
                    {ing.detail}
                  </p>
                </div>
                <span className="font-sans font-600 text-[10px] tracking-wider tabular-nums shrink-0 mt-0.5"
                  style={{ color: p.accentColor, opacity: 0.85 }}>
                  {ing.dose}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Coming Soon */}
      {p.coming && (
        <div className="flex flex-col gap-3 mt-auto pt-4 border-t border-white/[0.06]">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: p.accentColor }} />
            <span className="font-body text-[9px] tracking-widest2 uppercase text-lc-dim/40">In development</span>
          </div>
          <p className="font-sans font-600 text-white/50 text-[13px] tracking-wider uppercase">Coming Soon</p>
        </div>
      )}
    </div>
  );
}

/* ─── Section ───────────────────────────────────────────────────── */
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

      gsap.fromTo(eyebrowRef.current,
        { opacity: 0, y: 14 },
        { opacity: 1, y: 0, duration: 0.9, ease: 'power3.out',
          scrollTrigger: { trigger: sectionRef.current, start: 'top 78%' } }
      );

      gsap.fromTo(imgWrapRef.current,
        { opacity: 0, scale: 0.9, y: 50 },
        { opacity: 1, scale: 1, y: 0, duration: 1.3, ease: 'power4.out',
          scrollTrigger: { trigger: sectionRef.current, start: 'top 68%' } }
      );

      gsap.to(imgRef.current, {
        y: -50, ease: 'none',
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top bottom', end: 'bottom top', scrub: 1.8,
        },
      });

      gsap.to(glowRef.current, {
        opacity: 0.55, duration: 2.6, repeat: -1, yoyo: true, ease: 'sine.inOut',
        scrollTrigger: { trigger: sectionRef.current, start: 'top 68%' },
      });

      const validCards = cardRefs.current.filter(Boolean);
      if (validCards.length > 0) {
        gsap.fromTo(validCards,
          { opacity: 0, y: 55 },
          { opacity: 1, y: 0, duration: 1, ease: 'power3.out', stagger: 0.15,
            scrollTrigger: { trigger: validCards[0], start: 'top 88%' } }
        );
      }
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} id="product" className="relative bg-lc-black py-28 md:py-44 overflow-hidden">

      <div className="pointer-events-none absolute inset-0"
        style={{ background: 'radial-gradient(ellipse 65% 55% at 50% 38%, rgba(255,255,255,0.022) 0%, transparent 70%)' }} />

      {/* eyebrow */}
      <div ref={eyebrowRef} className="text-center mb-14 opacity-0">
        <p className="font-body text-[10px] tracking-widest3 text-lc-dim uppercase">The Product</p>
      </div>

      {/* image */}
      <div ref={imgWrapRef} className="relative mx-auto opacity-0 px-6" style={{ maxWidth: 740 }}>
        <div ref={glowRef} className="absolute inset-0 pointer-events-none opacity-25"
          style={{ background: 'radial-gradient(ellipse 75% 55% at 50% 58%, rgba(255,255,255,0.14) 0%, transparent 68%)', filter: 'blur(36px)' }} />
        <div className="absolute inset-0 pointer-events-none z-10"
          style={{ background: 'linear-gradient(to right, #000 0%, transparent 14%, transparent 86%, #000 100%), linear-gradient(to bottom, #000 0%, transparent 8%, transparent 88%, #000 100%)' }} />
        <div ref={imgRef}>
          <Image src="/products4.jpg" alt="LIFECODE Products" width={740} height={540}
            className="w-full h-auto object-contain select-none" priority />
        </div>
      </div>

      {/* cards — 4 col on desktop */}
      <div className="mt-24 px-5 md:px-10 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px bg-white/[0.05]">
          {PRODUCTS.map((p, i) => (
            <ProductCard
              key={p.id}
              p={p}
              cardRef={(el) => (cardRefs.current[i] = el)}
            />
          ))}
        </div>
      </div>

    </section>
  );
}
