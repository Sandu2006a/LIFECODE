'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Header from '@/components/Header';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

const BOX_G = 'linear-gradient(135deg, #FF8A00 0%, #C62828 40%, #7C3AED 70%, #1D4ED8 100%)';
const INK   = '#0F0A2A';
const INK2  = '#4A4570';
const BORDER = '#E0DCF0';
const CARD  = '#F7F5FF';

const MORNING = [
  {
    name: 'Vitamin A',
    form: 'Retinol Acetate',
    dose: '800 μg',
    img: '/ingrediente/vitamin-a.png',
    desc: 'Essential for immune function, vision, and cellular differentiation. Athletes require elevated Vitamin A to manage training-induced inflammation and support rapid tissue regeneration.',
  },
  {
    name: 'Vitamin C',
    form: 'Ascorbic Acid',
    dose: '200 mg',
    img: '/ingrediente/vitamin-c.png',
    desc: 'A frontline antioxidant that neutralises exercise-induced free radical damage. Critical for collagen synthesis — the structural protein in tendons, ligaments, and cartilage under daily mechanical load.',
  },
  {
    name: 'Vitamin D3',
    form: 'Cholecalciferol',
    dose: '25 μg (1000 IU)',
    img: '/ingrediente/vitamin-d3.png',
    desc: 'The athlete\'s hormone precursor. Regulates calcium absorption, skeletal muscle contractility, and immune defence. Studies show over 70% of indoor-training athletes are clinically deficient.',
  },
  {
    name: 'Vitamin E',
    form: 'd-Alpha Tocopherol',
    dose: '12 mg',
    img: '/ingrediente/vitamin-e.png',
    desc: 'The primary fat-soluble antioxidant guarding cell membranes against oxidative damage during high-intensity training. Works synergistically with Vitamin C to recycle free radical defence.',
  },
  {
    name: 'Vitamin K2',
    form: 'Menaquinone MK-7',
    dose: '50 μg',
    img: '/ingrediente/vitamin-k2.png',
    desc: 'Directs calcium to bones and away from arterial walls. The MK-7 form has a 72-hour half-life — far superior bioavailability to K1. Essential for stress fracture prevention and long-term cardiovascular health.',
  },
  {
    name: 'Vitamin B12',
    form: 'Methylcobalamin',
    dose: '100 μg',
    img: '/ingrediente/vitamin-b12.png',
    desc: 'We use the methylated form — not the cheap cyanocobalamin found in mass-market multivitamins. Directly bioavailable without conversion. Critical for red blood cell production, nerve conduction velocity, and energy metabolism.',
  },
  {
    name: 'B Complex',
    form: 'Full Spectrum B-Vitamins',
    dose: '100% RDA',
    img: '/ingrediente/vitamin-b-complex.png',
    desc: 'B1, B2, B3, B5, B6, B7, B9 — the full spectrum. B-vitamins are the co-enzymes behind every energy-producing reaction. Endurance athletes deplete them faster than any other demographic.',
  },
  {
    name: 'Zinc',
    form: 'Zinc Bisglycinate',
    dose: '10 mg',
    img: '/ingrediente/zinc.png',
    desc: 'Lost significantly in sweat during hard training. Bisglycinate chelation ensures 3x better absorption than the zinc oxide used by most competitors. Governs testosterone production, protein synthesis, and immune response.',
  },
  {
    name: 'Copper',
    form: 'Copper Gluconate',
    dose: '0.5 mg',
    img: '/ingrediente/copper.png',
    desc: 'Zinc\'s metabolic partner. Maintains the zinc-to-copper ratio essential for collagen cross-linking, iron metabolism, and the superoxide dismutase antioxidant system. Often omitted from underdosed multivitamins.',
  },
  {
    name: 'Magnesium Citrate',
    form: 'Magnesium Citrate',
    dose: '350 mg',
    img: '/ingrediente/magnesium.png',
    desc: 'The most consistently depleted mineral in hard-training athletes. Governs over 300 enzymatic reactions including muscle relaxation, ATP synthesis, nervous system recovery, and sleep architecture. Citrate form absorbs without digestive disruption.',
  },
  {
    name: 'Selenium',
    form: 'Selenomethionine',
    dose: '50 μg',
    img: '/ingrediente/selenium.png',
    desc: 'A trace mineral with outsized impact. Selenomethionine activates glutathione peroxidase — the body\'s master antioxidant enzyme. Supports thyroid hormone conversion, immune system integrity, and DNA repair after training stress.',
  },
];

const RECOVERY = [
  {
    name: 'Maltodextrin',
    form: 'Fast-Release Carbohydrate',
    dose: '20 g',
    img: '/ingrediente/maltodextrin.jpeg',
    desc: 'A fast-absorbing polysaccharide that spikes insulin and drives glycogen resynthesis in the critical 30-minute post-workout window. The fuel for tomorrow\'s session starts immediately after today\'s.',
  },
  {
    name: 'EAA Complex',
    form: 'Free-Form Essential Amino Acids',
    dose: '7 g',
    img: '/ingrediente/eaa.jpeg',
    desc: 'All 9 essential amino acids in free form — including leucine, the primary trigger of muscle protein synthesis. Unlike food protein, free-form EAAs bypass digestion and reach muscle tissue within minutes of ingestion.',
  },
  {
    name: 'Creatine Monohydrate',
    form: 'Creapure® Grade',
    dose: '5 g',
    img: '/ingrediente/creatine.jpeg',
    desc: 'The most studied performance compound in sports science — over 500 peer-reviewed trials. 5g daily maintains full muscle creatine phosphate saturation, directly increasing ATP regeneration capacity for strength, power, and high-intensity repeat efforts.',
  },
  {
    name: 'L-Glutamine',
    form: 'Free-Form L-Glutamine',
    dose: '3 g',
    img: '/ingrediente/l-glutamine.jpeg',
    desc: 'The most abundant amino acid in skeletal muscle, and the first to be depleted under heavy training loads. Maintains gut barrier integrity, fuels immune cells, and accelerates muscle glycogen resynthesis alongside carbohydrates.',
  },
  {
    name: 'HMB',
    form: 'β-Hydroxy β-Methylbutyrate',
    dose: '1.5 g',
    img: '/ingrediente/hmb.jpeg',
    desc: 'A metabolite of leucine that directly inhibits muscle protein breakdown. Most effective during high-volume training phases where muscle damage accumulates. Peer-reviewed evidence supports reduced DOMS and accelerated strength gain.',
  },
  {
    name: 'Tart Cherry Extract',
    form: 'Montmorency Cherry Concentrate',
    dose: '500 mg',
    img: '/ingrediente/tart-cherry.jpeg',
    desc: 'Rich in anthocyanins and quercetin — potent anti-inflammatory polyphenols that reduce exercise-induced muscle damage markers. Clinical trials show 500mg significantly reduces post-exercise soreness and restores strength faster than rest alone.',
  },
  {
    name: 'Himalayan Salt',
    form: 'Electrolyte Complex',
    dose: '116 mg sodium',
    img: '/ingrediente/himalayan-salt.jpeg',
    desc: 'Replenishes the electrolytes lost in sweat — particularly sodium, which drives water into muscle cells and sustains nerve signal transmission. Added to the recovery window to re-establish fluid balance after training.',
  },
  {
    name: 'Magnesium Bisglycinate',
    form: 'Chelated Bisglycinate Form',
    dose: '150 mg',
    img: '/ingrediente/magnesium-bisglycinate.jpeg',
    desc: 'The most bioavailable magnesium form. Chelated to glycine, it absorbs independently of digestive factors that limit other forms. Combined with the morning Magnesium Citrate, this delivers the total daily dose required for full neuromuscular recovery and sleep quality.',
  },
  {
    name: 'L-Theanine',
    form: 'Suntheanine® Grade',
    dose: '100 mg',
    img: '/ingrediente/l-theanine-recovery.jpeg',
    desc: 'Promotes calm alertness by modulating alpha brain wave activity. In the recovery window, L-Theanine blunts the cortisol response to training stress and significantly improves sleep onset latency — the most undervalued recovery variable.',
  },
  {
    name: 'AstraGin®',
    form: 'Astragalus + Panax Notoginseng',
    dose: '50 mg',
    img: '/ingrediente/astragin.png',
    desc: 'A patented absorption amplifier derived from Astragalus membranaceus and Panax notoginseng. Upregulates SGLT-1 transporters in the gut lining, increasing amino acid absorption by up to 67% and creatine uptake by up to 33%. It makes everything else in the formula work harder.',
  },
];

function IngredientCard({ item, i }) {
  const ref = useRef(null);

  useEffect(() => {
    gsap.fromTo(ref.current,
      { opacity: 0, y: 28 },
      { opacity: 1, y: 0, duration: 0.7, ease: 'power3.out',
        scrollTrigger: { trigger: ref.current, start: 'top 88%', once: true },
        delay: (i % 3) * 0.08,
      }
    );
  }, [i]);

  return (
    <div ref={ref}
      className="rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
      style={{ background: '#fff', border: `1px solid ${BORDER}` }}>
      <div className="relative w-full h-52 overflow-hidden bg-[#F0EDF8]">
        <Image
          src={item.img}
          alt={item.name}
          fill
          className="object-cover transition-transform duration-500 hover:scale-105"
          sizes="(max-width: 768px) 100vw, 33vw"
        />
      </div>
      <div className="p-6">
        <p className="font-body text-[11px] tracking-[0.25em] uppercase mb-1" style={{ color: INK2 }}>
          {item.form}
        </p>
        <h3 className="font-sans font-700 text-[20px] mb-3 leading-tight" style={{ color: INK }}>
          {item.name}
        </h3>
        <p className="font-body text-[14px] leading-relaxed mb-4" style={{ color: INK2 }}>
          {item.desc}
        </p>
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full"
          style={{ background: CARD, border: `1px solid ${BORDER}` }}>
          <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: BOX_G }} />
          <span className="font-sans font-700 text-[12px] tracking-wide"
            style={{ color: '#6D28D9' }}>
            {item.dose} per serving
          </span>
        </div>
      </div>
    </div>
  );
}

export default function IngredientsPage() {
  const [tab, setTab] = useState('morning');
  const heroRef = useRef(null);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const els = heroRef.current?.querySelectorAll('[data-h]');
    if (els?.length) {
      gsap.fromTo(els,
        { opacity: 0, y: 36 },
        { opacity: 1, y: 0, duration: 1, ease: 'power3.out', stagger: 0.12, delay: 0.3 }
      );
    }
    return () => ScrollTrigger.getAll().forEach(t => t.kill());
  }, []);

  const items = tab === 'morning' ? MORNING : RECOVERY;

  return (
    <>
      <Header />
      <main style={{ background: '#FAFAFA', color: INK, minHeight: '100vh' }}>

        {/* ─── HERO ─────────────────────────────────────────── */}
        <section ref={heroRef} className="pt-40 pb-16 px-8 md:px-16 max-w-[1200px] mx-auto">
          <div data-h className="inline-flex items-center gap-3 mb-5">
            <span className="h-px w-8" style={{ background: BOX_G }} />
            <span className="font-body text-[11px] tracking-[0.32em] uppercase"
              style={{ color: '#6D28D9' }}>
              Full Transparency
            </span>
          </div>
          <h1 data-h className="font-sans font-700 text-[44px] md:text-[68px] leading-[0.95] tracking-tight mb-5" style={{ color: INK }}>
            Every ingredient.<br />
            <span style={{ color: '#6D28D9' }}>
              Every dose. Every reason.
            </span>
          </h1>
          <p data-h className="font-body text-[17px] max-w-xl leading-relaxed" style={{ color: INK2 }}>
            No proprietary blends. No hidden amounts. Every ingredient listed with its exact dose and the science behind why it's there.
          </p>
        </section>

        <div className="h-px mx-8 md:mx-16" style={{ background: BORDER }} />

        {/* ─── TABS ─────────────────────────────────────────── */}
        <section className="px-8 md:px-16 max-w-[1200px] mx-auto pt-10 pb-6">
          <div className="flex gap-3 flex-wrap">
            {[
              { id: 'morning',  label: 'Morning Pak',       count: MORNING.length },
              { id: 'recovery', label: 'Anabolic Recovery', count: RECOVERY.length },
            ].map(({ id, label, count }) => (
              <button
                key={id}
                onClick={() => setTab(id)}
                className="inline-flex items-center gap-2.5 px-5 py-3 rounded-full font-body text-[13px] tracking-wide transition-all duration-300"
                style={tab === id
                  ? { background: BOX_G, color: '#fff', border: '1.5px solid transparent' }
                  : { background: 'transparent', color: INK2, border: `1.5px solid ${BORDER}` }
                }
              >
                {label}
                <span
                  className="text-[11px] font-700 w-5 h-5 rounded-full flex items-center justify-center"
                  style={tab === id
                    ? { background: 'rgba(255,255,255,0.25)', color: '#fff' }
                    : { background: CARD, color: INK2 }
                  }
                >
                  {count}
                </span>
              </button>
            ))}
          </div>
        </section>

        {/* ─── PACK HEADER ──────────────────────────────────── */}
        <section className="px-8 md:px-16 max-w-[1200px] mx-auto pb-8">
          <div className="flex items-end justify-between flex-wrap gap-4">
            <div>
              <h2 className="font-sans font-700 text-[28px] md:text-[36px] leading-tight" style={{ color: INK }}>
                {tab === 'morning' ? 'Morning Pak' : 'Anabolic Recovery'}
              </h2>
              <p className="font-body text-[14px] mt-1" style={{ color: INK2 }}>
                {tab === 'morning'
                  ? 'Daily vitamins, minerals & micronutrients — taken every morning'
                  : 'Post-training performance recovery — taken within 30 min after training'}
              </p>
            </div>
            <span className="font-body text-[12px] tracking-widest uppercase px-4 py-2 rounded-full"
              style={{ background: CARD, border: `1px solid ${BORDER}`, color: INK2 }}>
              {items.length} ingredients · 0 hidden
            </span>
          </div>
        </section>

        {/* ─── GRID ─────────────────────────────────────────── */}
        <section className="px-8 md:px-16 max-w-[1200px] mx-auto pb-24">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {items.map((item, i) => (
              <IngredientCard key={item.name} item={item} i={i} />
            ))}
          </div>
        </section>

        {/* ─── BOTTOM CTA ───────────────────────────────────── */}
        <section className="px-8 md:px-16 pb-24" style={{ borderTop: `1px solid ${BORDER}` }}>
          <div className="max-w-[1200px] mx-auto pt-16 flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
            <div>
              <p className="font-body text-[11px] tracking-[0.32em] uppercase mb-2"
                style={{ color: '#6D28D9' }}>
                Ready to start?
              </p>
              <h3 className="font-sans font-700 text-[28px] md:text-[34px]" style={{ color: INK }}>
                Build your daily protocol.
              </h3>
            </div>
            <a href="/pricing"
              className="inline-flex items-center justify-center px-8 py-4 rounded-full text-white font-body text-[13px] tracking-[0.2em] uppercase transition-all duration-300 hover:opacity-85"
              style={{ background: '#FF8A00' }}>
              Get Started
            </a>
          </div>
        </section>

      </main>
    </>
  );
}
