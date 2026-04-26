'use client';

import { useEffect, useRef, useState } from 'react';
import { gsap }          from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Image             from 'next/image';
import Link              from 'next/link';
import { Lock }          from 'lucide-react';

/* ─── Ingredient toggle ──────────────────────────────────────────── */
function IngredientList({ ingredients, accentColor }) {
  const [open, setOpen] = useState(false);
  const listRef  = useRef(null);
  const innerRef = useRef(null);

  const toggle = () => {
    if (!listRef.current || !innerRef.current) return;
    if (!open) {
      gsap.fromTo(listRef.current,
        { height: 0, opacity: 0 },
        { height: innerRef.current.offsetHeight, opacity: 1, duration: 0.5, ease: 'power3.inOut' }
      );
    } else {
      gsap.to(listRef.current, { height: 0, opacity: 0, duration: 0.4, ease: 'power3.inOut' });
    }
    setOpen(v => !v);
  };

  return (
    <div>
      <button onClick={toggle} className="flex items-center gap-3 group mt-8">
        <span className="font-body text-[9px] tracking-widest2 uppercase transition-colors duration-300"
          style={{ color: open ? accentColor : '#8B4A52' }}>
          {open ? 'Hide ingredients' : 'Full ingredient list'}
        </span>
        <span className="w-4 h-px transition-all duration-300" style={{ background: open ? accentColor : '#EDE0E0' }} />
        <svg width="5" height="8" viewBox="0 0 5 8" fill="none"
          style={{ transform: open ? 'rotate(90deg)' : 'none', transition: 'transform 0.3s' }}>
          <path d="M1 1l3 3-3 3" stroke={open ? accentColor : '#8B4A52'} strokeWidth="1" strokeLinecap="round" />
        </svg>
      </button>

      <div ref={listRef} style={{ height: 0, opacity: 0, overflow: 'hidden' }}>
        <div ref={innerRef} className="mt-6 border-t border-lc-line-light">
          {ingredients.map((ing, j) => (
            <div key={j} className="flex items-start justify-between gap-4 py-3 border-b border-lc-line-light last:border-0">
              <div>
                <p className="font-sans font-500 text-lc-maroon text-[11px] tracking-wide">{ing.name}</p>
                <p className="font-body font-300 text-lc-maroon-dim text-[9.5px] tracking-wide mt-0.5 leading-snug">{ing.detail}</p>
              </div>
              <span className="font-sans font-600 text-[10px] tabular-nums shrink-0 mt-0.5" style={{ color: accentColor }}>
                {ing.dose}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── Featured Product (large editorial card) ────────────────────── */
function FeaturedProduct({ product, imageLeft, index }) {
  const ref = useRef(null);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    gsap.fromTo(ref.current,
      { opacity: 0, y: 60 },
      { opacity: 1, y: 0, duration: 1.1, ease: 'power3.out',
        scrollTrigger: { trigger: ref.current, start: 'top 82%' } }
    );
  }, []);

  return (
    <div ref={ref} className="grid grid-cols-1 lg:grid-cols-2 min-h-[520px] opacity-0">
      {/* Image side */}
      <div
        className={`relative overflow-hidden ${imageLeft ? 'lg:order-1' : 'lg:order-2'}`}
        style={{ background: '#FFF3EC', minHeight: 380 }}
      >
        {/* Accent bar */}
        <div className="absolute top-0 left-0 right-0 h-1" style={{ background: product.accentColor }} />
        <div className="absolute inset-0 flex items-center justify-center p-12">
          <div className="relative w-full max-w-xs" style={{
            filter: `drop-shadow(0 20px 60px ${product.accentColor}33)`,
          }}>
            <Image
              src={product.image}
              alt={product.title}
              width={400}
              height={480}
              className="w-full h-auto object-contain"
            />
          </div>
        </div>
        {/* Phase badge */}
        <div className="absolute top-6 left-6">
          <span className="font-body text-[9px] tracking-widest3 uppercase" style={{ color: product.accentColor }}>
            Phase {product.phase}
          </span>
        </div>
      </div>

      {/* Text side */}
      <div
        className={`flex flex-col justify-center px-10 md:px-16 py-14 bg-lc-white border border-lc-line-light ${imageLeft ? 'lg:order-2' : 'lg:order-1'}`}
      >
        <span className="font-body text-[9px] tracking-widest2 uppercase mb-4" style={{ color: product.accentColor }}>
          {String(index + 1).padStart(2, '0')} / {product.phase === '01' ? 'Morning' : 'Recovery'}
        </span>

        <h3 className="font-sans font-700 text-lc-maroon tracking-tight mb-3"
          style={{ fontSize: 'clamp(2rem, 3.5vw, 3.2rem)' }}>
          {product.title}
        </h3>

        <p className="font-sans font-700 tracking-tight mb-6 leading-none"
          style={{ fontSize: 'clamp(1.4rem, 2.5vw, 2.2rem)', color: product.accentColor, opacity: 0.45 }}>
          {product.tagline}
        </p>

        <p className="font-body font-300 text-lc-maroon-dim text-sm md:text-base leading-loose max-w-sm">
          {product.description}
        </p>

        <IngredientList ingredients={product.ingredients} accentColor={product.accentColor} />

        {product.slug && (
          <Link
            href={`/products/${product.slug}`}
            className="inline-flex items-center gap-3 mt-8 group"
          >
            <span className="font-body text-[9px] tracking-widest2 uppercase transition-colors duration-300 group-hover:opacity-70"
              style={{ color: product.accentColor }}>
              Full product profile
            </span>
            <span className="w-4 h-px transition-all duration-300 group-hover:w-6" style={{ background: product.accentColor }} />
            <svg width="5" height="8" viewBox="0 0 5 8" fill="none">
              <path d="M1 1l3 3-3 3" stroke={product.accentColor} strokeWidth="1" strokeLinecap="round" />
            </svg>
          </Link>
        )}
      </div>
    </div>
  );
}

/* ─── Locked mini card ───────────────────────────────────────────── */
function LockedCard({ product }) {
  const ref = useRef(null);
  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    gsap.fromTo(ref.current,
      { opacity: 0, y: 40 },
      { opacity: 1, y: 0, duration: 0.9, ease: 'power3.out',
        scrollTrigger: { trigger: ref.current, start: 'top 88%' } }
    );
  }, []);

  return (
    <div ref={ref} className="relative border border-lc-line-light bg-lc-white p-8 flex flex-col opacity-0">
      <div className="flex items-start justify-between mb-6">
        <span className="font-body text-[9px] tracking-widest2 text-lc-maroon/20 uppercase">{product.phase}</span>
        <div className="flex items-center gap-2 px-3 py-1 rounded-full border border-lc-line-light">
          <Lock className="w-2.5 h-2.5 text-lc-maroon/25" />
          <span className="font-body text-[8px] tracking-widest uppercase text-lc-maroon/25">Not added yet</span>
        </div>
      </div>
      <div className="flex-1 flex items-center justify-center py-8">
        <div className="w-16 h-16 rounded-full flex items-center justify-center border-2 border-dashed border-lc-line-light">
          <Lock className="w-6 h-6 text-lc-maroon/15" />
        </div>
      </div>
      <h4 className="font-sans font-600 text-lc-maroon/25 text-lg tracking-tight mt-4">{product.title}</h4>
      <p className="font-sans font-700 text-2xl tracking-tight mt-1" style={{ color: '#EDE0E0' }}>{product.tagline}</p>
      <p className="font-body text-[11px] text-lc-maroon/20 leading-relaxed mt-3">{product.teaser}</p>
    </div>
  );
}

/* ─── Data ─────────────────────────────────────────────────────── */
const ACTIVE = [
  {
    slug: 'morning',
    phase: '01',
    title: 'Morning Pack',
    tagline: 'Activate.',
    accentColor: '#8B0015',
    image: '/Morning2.png',
    description: 'Precision-dosed micronutrients calibrated to your circadian rhythm. Activates cellular respiration and metabolic priming at the molecular level.',
    ingredients: [
      { name: 'Vitamina A',   detail: 'Retinyl Palmitate (CWD)',  dose: '800 µg'   },
      { name: 'Vitamina C',   detail: 'Ascorbat de Calciu',       dose: '200 mg'   },
      { name: 'Vitamina D3',  detail: 'Colecalciferol (Vegan)',    dose: '25 µg'    },
      { name: 'Vitamina E',   detail: 'd-alpha-Tocopheryl',       dose: '12 mg'    },
      { name: 'Vitamina K2',  detail: 'Menaquinonă-7 (MK-7)',     dose: '50 µg'    },
      { name: 'Vitamina B12', detail: 'Metilcobalamină',           dose: '100 µg'   },
      { name: 'Complex B',    detail: 'Premix B-Complex Metilat',  dose: '100% RDR' },
      { name: 'Zinc',         detail: 'Bisglicinat de Zinc',       dose: '10 mg'    },
      { name: 'Cupru',        detail: 'Bisglicinat de Cupru',      dose: '0.5 mg'   },
      { name: 'Magneziu',     detail: 'Citrat de Magneziu',        dose: '350 mg'   },
      { name: 'Seleniu',      detail: 'Selenometionină',           dose: '50 µg'    },
    ],
  },
  {
    slug: 'recovery',
    phase: '04',
    title: 'Recovery Pack',
    tagline: 'Rebuild.',
    accentColor: '#E8631A',
    image: '/Recovery2.png',
    description: 'Master formula engineered for rapid post-effort repair. Anabolic shield, glycogen reloading, neuromuscular relaxation and gut recovery in a single 38g serving.',
    ingredients: [
      { name: 'Maltodextrin (Low DE)',  detail: 'Glycogen replenishment / Insulin-driven nutrient transport',    dose: '20 000 mg' },
      { name: 'EAA Complex',            detail: 'Full Spectrum / Instant protein synthesis',                      dose: '7 000 mg'  },
      { name: 'Creatine Monohydrate',   detail: 'ATP replenishment / Cell volumization (Clinical Dose)',          dose: '5 000 mg'  },
      { name: 'L-Glutamine',            detail: 'Immune system & gut barrier recovery post-stress',               dose: '3 000 mg'  },
      { name: 'HMB (Calcium Salt)',     detail: 'Anabolic shield / Stops post-workout muscle catabolism',         dose: '1 500 mg'  },
      { name: 'Tart Cherry Extract',    detail: 'Natural anti-inflammatory / Reduces DOMS',                       dose: '500 mg'    },
      { name: 'Himalayan Pink Salt',    detail: 'Electrolyte balance / Glucose co-transport',                     dose: '300 mg'    },
      { name: 'Magnesium Bisglycinate', detail: 'Neuromuscular relaxation / Post-effort stress reduction',        dose: '150 mg'    },
      { name: 'L-Theanine',             detail: 'CNS calm-down / Parasympathetic switch',                         dose: '100 mg'    },
      { name: 'AstraGin®',              detail: 'Maximizes absorption of aminos, creatine & nutrients',           dose: '50 mg'     },
    ],
  },
];

const LOCKED = [
  { phase: '02', title: 'Pure Pump',     tagline: 'Perform.', teaser: 'Pre-workout formula engineered for peak performance windows and sustained ATP synthesis.' },
  { phase: '03', title: 'Endurance Gel', tagline: 'Sustain.', teaser: 'Dual-carb matrix with 2:1 ratio for maximum absorption during long-duration efforts.' },
];

/* ─── Section ─────────────────────────────────────────────────── */
export default function ProductSection() {
  const headRef = useRef(null);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    gsap.fromTo(headRef.current,
      { opacity: 0, y: 40 },
      { opacity: 1, y: 0, duration: 1, ease: 'power3.out',
        scrollTrigger: { trigger: headRef.current, start: 'top 80%' } }
    );
  }, []);

  return (
    <section id="product" className="bg-lc-white">

      {/* Section header */}
      <div ref={headRef} className="px-6 md:px-16 pt-28 pb-16 opacity-0 max-w-[1440px] mx-auto">
        <div className="flex items-start justify-between flex-wrap gap-6">
          <div>
            <div className="flex items-center gap-3 mb-5">
              <div className="w-6 h-px bg-lc-orange" />
              <span className="font-body text-[10px] tracking-widest3 text-lc-orange uppercase">The Protocol</span>
            </div>
            <h2 className="font-sans font-700 text-lc-maroon tracking-tight" style={{ fontSize: 'clamp(2.2rem,5vw,5rem)' }}>
              Engineered for<br />every phase.
            </h2>
          </div>
          <p className="font-body font-300 text-lc-maroon-dim text-sm leading-loose max-w-xs self-end pb-2">
            Two active formulas. Two coming soon.
            Every compound declared. No proprietary blends.
          </p>
        </div>
      </div>

      {/* Active products — editorial large cards */}
      <div className="border-t border-lc-line-light">
        {ACTIVE.map((p, i) => (
          <div key={p.phase} className={i < ACTIVE.length - 1 ? 'border-b border-lc-line-light' : ''}>
            <FeaturedProduct product={p} imageLeft={i % 2 === 0} index={i} />
          </div>
        ))}
      </div>

      {/* Coming soon strip */}
      <div className="border-t border-lc-line-light px-6 md:px-16 py-16 max-w-[1440px] mx-auto">
        <div className="flex items-center gap-4 mb-10">
          <span className="font-body text-[9px] tracking-widest3 text-lc-maroon/30 uppercase">Expanding soon</span>
          <div className="flex-1 h-px bg-lc-line-light" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {LOCKED.map(p => <LockedCard key={p.phase} product={p} />)}
        </div>
      </div>

    </section>
  );
}
