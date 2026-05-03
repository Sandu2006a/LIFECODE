'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

const MG    = 'linear-gradient(135deg, #FFF5DC 0%, #FF8A00 60%, #C62828 100%)';
const BOX_G = 'linear-gradient(135deg, #FF8A00 0%, #C62828 40%, #7C3AED 70%, #1D4ED8 100%)';
const HEAT_G = 'linear-gradient(90deg, #FF8A00, #C62828, #7C3AED)';

const ROWS = [
  { label: 'System structure',  lifecode: 'Designed as one protocol',    blend: 'Random products',    multi: 'Multiple brands' },
  { label: 'Ingredient dosing', lifecode: 'Clinical, transparent doses', blend: 'Proprietary blends', multi: 'Often underdosed' },
  { label: 'Tracking',          lifecode: 'Real-time AI app',            blend: 'None',               multi: 'Manual / none' },
  { label: 'Timing guidance',   lifecode: 'AM + PM protocol built-in',   blend: 'None',               multi: 'User guesses' },
  { label: 'Convenience',       lifecode: 'Two moments. Done.',          blend: 'Varies',             multi: '6+ products daily' },
  { label: 'App integration',   lifecode: 'Full AI nutrition coach',     blend: '✗',                  multi: '✗' },
];

const MORNING_ADVANTAGE = [
  { ingredient: 'B-Complex',           advantage: 'Methylated forms only. Works for everyone, including those with MTHFR variants that block standard B vitamins.' },
  { ingredient: 'Vitamin D3',          advantage: 'Full 1000 IU of D3 — the form your body actually uses. Most products use D2, which is 3× less effective.' },
  { ingredient: 'Vitamin K2 (MK-7)',   advantage: 'Paired with D3 to direct calcium into bones, not arteries. Competitors rarely include this — we consider it non-negotiable.' },
  { ingredient: 'Vitamin C',           advantage: 'Calcium Ascorbate — buffered, stomach-friendly, fully absorbed. Not the cheap acidic form.' },
  { ingredient: 'Magnesium',           advantage: 'Citrate form absorbs 4× better than Oxide. 350 mg covers your full daily need — not a token dose.' },
  { ingredient: 'Zinc',                advantage: 'Bisglycinate form — 43% better absorption, no interference with other minerals.' },
  { ingredient: 'Iodine + Selenium',   advantage: 'Both at full NRV. The thyroid needs both together — one without the other doesn\'t work properly.' },
  { ingredient: 'Adaptogens (Rhodiola)',advantage: '150 mg standardised to 3% Rosavins — the clinical concentration. Unstandardised extracts are just filler.' },
  { ingredient: 'L-Theanine',          advantage: '100 mg paired with 200 mg caffeine — the exact ratio studied for calm, sustained focus without anxiety.' },
  { ingredient: 'Natural Caffeine',    advantage: 'From Guarana — slower release, longer effect, no hard crash. Not synthetic anhydrous caffeine.' },
  { ingredient: 'Taurine',             advantage: '500 mg for cellular hydration and oxidative protection. Missing from every competing morning formula.' },
  { ingredient: 'Electrolytes (Na+K)', advantage: '400 mg — a real functional dose. Trace amounts found elsewhere don\'t move any measurable marker.' },
  { ingredient: 'Sweetener System',    advantage: 'Reb-M + Thaumatin — the cleanest stevia fraction, no bitterness, no artificial sweeteners.' },
];

const RECOVERY_ADVANTAGE = [
  { ingredient: 'Protein Source',      advantage: 'Free-form EAAs absorb in 15–30 min. Whey takes 60–90 min and misses the recovery window. Dairy-free. Complete.' },
  { ingredient: 'Carbohydrate',        advantage: 'Low DE Maltodextrin — controlled glycemic response, not a blood sugar spike. Right amount, right form.' },
  { ingredient: 'Carb:Protein Ratio',  advantage: '3:1 — the research-backed ratio for glycogen replenishment and cortisol reduction. Whey products get this backwards.' },
  { ingredient: 'Creatine Monohydrate',advantage: '5 g — the only dose with real evidence behind it. Sub-doses in competitors produce no ergogenic effect.' },
  { ingredient: 'HMB (Calcium HMB)',   advantage: '1.5 g clinical dose — blocks muscle breakdown. Expensive to include, which is why almost no one does.' },
  { ingredient: 'L-Glutamine',         advantage: '3 g to support gut integrity post-training. Intense exercise increases intestinal permeability — this addresses it directly.' },
  { ingredient: 'BCAAs',               advantage: 'Full EAA spectrum — BCAAs alone can\'t build complete muscle protein. Full spectrum produces measurably better results.' },
  { ingredient: 'Tart Cherry Extract', advantage: '500 mg — clinically shown to reduce DOMS by up to 24% and accelerate strength recovery.' },
  { ingredient: 'Magnesium',           advantage: 'Bisglycinate — absorbed via amino acid transporters. Significantly more effective post-workout than Oxide or Sulfate.' },
  { ingredient: 'L-Theanine',          advantage: '100 mg to shift your nervous system from sympathetic to recovery mode. No other recovery product includes this.' },
  { ingredient: 'Electrolytes',        advantage: 'Pink Himalayan Salt — sodium + 80+ trace minerals. Not refined sodium.' },
  { ingredient: 'AstraGin®',           advantage: '50 mg patented extract that increases amino acid absorption by up to 67%. Makes everything else in the formula more effective.' },
  { ingredient: 'Sweetener System',    advantage: 'Reb-M + Thaumatin — natural only. Sucralose and acesulfame-K (used by competitors) have been linked to gut microbiome disruption.' },
];

function AdvantageTable({ items, sectionClass }) {
  return (
    <div className="divide-y divide-[#f0eef8]">
      {items.map((row, i) => (
        <div key={i} className={`${sectionClass} flex flex-col sm:flex-row gap-2 sm:gap-6 py-4 opacity-0`}>
          <div className="sm:w-[220px] flex-shrink-0 flex items-start gap-2 pt-0.5">
            <div className="flex-shrink-0 mt-[7px] w-1.5 h-1.5 rounded-full" style={{ background: HEAT_G }} />
            <p
              className="font-sans font-700 text-[13px] tracking-tight bg-clip-text text-transparent leading-snug"
              style={{ backgroundImage: HEAT_G }}
            >
              {row.ingredient}
            </p>
          </div>
          <p className="font-body font-300 text-[#555] text-[14px] leading-relaxed flex-1">
            {row.advantage}
          </p>
        </div>
      ))}
    </div>
  );
}

function AdvantageBlock({ title, items, sectionClass, gradientFrom, gradientTo }) {
  const [open, setOpen] = useState(false);
  const bodyRef = useRef(null);

  useEffect(() => {
    if (!bodyRef.current) return;
    if (open) {
      gsap.fromTo(bodyRef.current,
        { height: 0, opacity: 0 },
        { height: 'auto', opacity: 1, duration: 0.45, ease: 'power3.out' }
      );
    } else {
      gsap.to(bodyRef.current, { height: 0, opacity: 0, duration: 0.3, ease: 'power3.in' });
    }
  }, [open]);

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ padding: '1.5px', background: `linear-gradient(135deg, ${gradientFrom}, ${gradientTo})` }}
    >
      <div className="bg-white rounded-[14.5px] overflow-hidden">
        <button
          onClick={() => setOpen(v => !v)}
          className="w-full flex items-center justify-between px-6 md:px-8 py-5 text-left group"
        >
          <div>
            <p className="font-body text-[9px] tracking-[0.32em] uppercase font-700 mb-1"
               style={{ color: gradientFrom }}>
              The LIFECODE Advantage
            </p>
            <h3 className="font-sans font-700 text-[#0a0a0a] text-lg md:text-xl tracking-tight">
              {title}
            </h3>
          </div>
          <div
            className="flex-shrink-0 ml-4 w-8 h-8 rounded-full flex items-center justify-center transition-transform duration-300"
            style={{
              background: `linear-gradient(135deg, ${gradientFrom}, ${gradientTo})`,
              transform: open ? 'rotate(45deg)' : 'rotate(0deg)',
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M12 5v14M5 12h14" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"/>
            </svg>
          </div>
        </button>

        <div ref={bodyRef} style={{ height: 0, overflow: 'hidden', opacity: 0 }}>
          <div className="px-6 md:px-8 pb-6">
            <div className="h-px w-full mb-2" style={{ background: `linear-gradient(90deg, ${gradientFrom}33, ${gradientTo}33)` }} />
            <AdvantageTable items={items} sectionClass={sectionClass} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ComparisonSection() {
  const sectionRef = useRef(null);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const ctx = gsap.context(() => {
      gsap.fromTo('.cs-img',
        { opacity: 0, y: 20, scale: 0.98 },
        { opacity: 1, y: 0, scale: 1, duration: 0.65, ease: 'power3.out',
          scrollTrigger: { trigger: sectionRef.current, start: 'top 92%' } }
      );
      gsap.fromTo('.cs-col',
        { opacity: 0, y: 18 },
        { opacity: 1, y: 0, duration: 0.5, ease: 'power3.out', stagger: 0.08,
          scrollTrigger: { trigger: '.cs-table', start: 'top 94%' } }
      );
      gsap.fromTo('.adv-row',
        { opacity: 0, y: 12 },
        { opacity: 1, y: 0, duration: 0.4, ease: 'power3.out', stagger: 0.03,
          scrollTrigger: { trigger: '.adv-blocks', start: 'top 90%' } }
      );
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="py-14 md:py-20 px-6 md:px-16 overflow-hidden"
      style={{ background: 'linear-gradient(180deg, #F8F5FF 0%, #FFF9F5 100%)' }}
    >
      <div className="max-w-[1440px] mx-auto">

        <div className="flex items-center gap-3 mb-6">
          <div className="h-px w-5" style={{ background: MG }} />
          <span className="font-body text-[14px] tracking-widest3 text-[#999] uppercase">The comparison</span>
        </div>

        <h2
          className="font-sans font-700 text-[#111] tracking-tight leading-[0.92] mb-10"
          style={{ fontSize: 'clamp(2.2rem, 4.5vw, 5rem)' }}
        >
          Why a system beats<br />a stack.
        </h2>

        {/* Products image */}
        <div className="cs-img relative rounded-2xl overflow-hidden aspect-[16/7] mb-10 opacity-0 bg-[#f8f8f8]">
          <Image
            src="/Cutii.png"
            alt="LIFECODE Products"
            fill
            className="object-contain p-6 md:p-10"
            sizes="100vw"
            loading="lazy"
          />
        </div>

        {/* Comparison table */}
        <div className="cs-table overflow-x-auto mb-14">
          <table className="w-full min-w-[600px] border-collapse">
            <thead>
              <tr>
                <th className="text-left pb-5 pr-4 font-body text-[13px] tracking-widest text-[#ccc] uppercase font-400 w-[28%]"></th>
                <th className="pb-5 px-4 w-[24%]">
                  <div className="cs-col opacity-0" style={{ padding: '1.5px', borderRadius: '12px', background: BOX_G }}>
                    <div className="bg-white py-3 px-4 rounded-[10.5px] text-center">
                      <p className="font-sans font-700 text-sm tracking-tight bg-clip-text text-transparent"
                        style={{ backgroundImage: BOX_G }}>LIFECODE</p>
                      <p className="font-body text-[13px] tracking-widest text-[#ccc] uppercase mt-0.5">System</p>
                    </div>
                  </div>
                </th>
                <th className="pb-5 px-4 w-[24%]">
                  <div className="cs-col opacity-0 border border-[#f0f0f0] rounded-xl py-3 px-4 text-center">
                    <p className="font-sans font-600 text-[#bbb] text-sm tracking-tight">Typical blend</p>
                    <p className="font-body text-[13px] tracking-widest text-[#ddd] uppercase mt-0.5">Single product</p>
                  </div>
                </th>
                <th className="pb-5 pl-4 w-[24%]">
                  <div className="cs-col opacity-0 border border-[#f0f0f0] rounded-xl py-3 px-4 text-center">
                    <p className="font-sans font-600 text-[#bbb] text-sm tracking-tight">Multiple brands</p>
                    <p className="font-body text-[13px] tracking-widest text-[#ddd] uppercase mt-0.5">DIY stack</p>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {ROWS.map((row) => (
                <tr key={row.label} className="cs-col border-t border-[#f5f5f5]" style={{ opacity: 0 }}>
                  <td className="py-5 pr-4">
                    <p className="font-body text-[15px] tracking-widest text-[#aaa] uppercase">{row.label}</p>
                  </td>
                  <td className="py-5 px-4">
                    <div className="flex items-start gap-2">
                      <div className="flex-shrink-0 mt-[5px] w-1.5 h-1.5 rounded-full" style={{ background: BOX_G }} />
                      <p className="font-sans font-600 text-[#222] text-[17px] leading-snug">{row.lifecode}</p>
                    </div>
                  </td>
                  <td className="py-5 px-4">
                    <p className="font-body text-[17px] text-[#bbb] leading-snug">{row.blend}</p>
                  </td>
                  <td className="py-5 pl-4">
                    <p className="font-body text-[17px] text-[#bbb] leading-snug">{row.multi}</p>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* The LIFECODE Advantage blocks */}
        <div className="adv-blocks">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-px w-5" style={{ background: HEAT_G }} />
            <span className="font-body text-[10px] tracking-[0.32em] uppercase font-700" style={{ color: '#C62828' }}>
              Ingredient breakdown
            </span>
          </div>
          <h3
            className="font-sans font-700 text-[#0a0a0a] tracking-tight leading-[0.92] mb-8"
            style={{ fontSize: 'clamp(1.8rem, 3.5vw, 3.4rem)' }}
          >
            Not just what&apos;s in it —<br />
            <span className="bg-clip-text text-transparent" style={{ backgroundImage: HEAT_G }}>
              why every ingredient is different.
            </span>
          </h3>

          <div className="flex flex-col gap-4">
            <AdvantageBlock
              title="Morning Pack — 13 reasons it outperforms"
              items={MORNING_ADVANTAGE}
              sectionClass="adv-row"
              gradientFrom="#FF8A00"
              gradientTo="#C62828"
            />
            <AdvantageBlock
              title="Anabolic Recovery — 13 reasons it outperforms"
              items={RECOVERY_ADVANTAGE}
              sectionClass="adv-row"
              gradientFrom="#C62828"
              gradientTo="#7C3AED"
            />
          </div>
        </div>

      </div>
    </section>
  );
}
