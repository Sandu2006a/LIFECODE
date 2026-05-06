'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

const RED    = '#C62828';
const PURPLE = '#7C3AED';

const ROWS = [
  { label: 'System structure',  lifecode: 'Designed as one protocol',    blend: 'Random products',    multi: 'Multiple brands' },
  { label: 'Ingredient dosing', lifecode: 'Clinical, transparent doses', blend: 'Proprietary blends', multi: 'Often underdosed' },
  { label: 'Tracking',          lifecode: 'Real-time AI app',            blend: 'None',               multi: 'Manual / none' },
  { label: 'Timing guidance',   lifecode: 'AM + PM protocol built-in',   blend: 'None',               multi: 'User guesses' },
  { label: 'Convenience',       lifecode: 'Two moments. Done.',          blend: 'Varies',             multi: '6+ products daily' },
  { label: 'App integration',   lifecode: 'Full AI nutrition coach',     blend: '✗',                  multi: '✗' },
];

const MORNING_ADVANTAGE = [
  { ingredient: 'B-Complex',            advantage: ['Methylated forms only. Works for everyone, including those with ', 'MTHFR variants', ' that block standard B vitamins.'] },
  { ingredient: 'Vitamin D3',           advantage: ['Full ', '1000 IU of D3', ' — the form your body actually uses. Most products use D2, which is ', '3x less effective', '.'] },
  { ingredient: 'Vitamin K2 (MK-7)',    advantage: ['Paired with D3 to direct calcium into ', 'bones, not arteries', '. Competitors rarely include this — we consider it non-negotiable.'] },
  { ingredient: 'Vitamin C',            advantage: ['Calcium Ascorbate — ', 'buffered, stomach-friendly, fully absorbed', '. Not the cheap acidic form.'] },
  { ingredient: 'Magnesium',            advantage: ['Citrate form absorbs ', '4x better than Oxide', '. 350mg covers your full daily need — not a token dose.'] },
  { ingredient: 'Zinc',                 advantage: ['Bisglycinate form — ', '43% better absorption', ', no interference with other minerals.'] },
  { ingredient: 'Iodine + Selenium',    advantage: ['Both at full NRV. The thyroid needs ', 'both together', ' — one without the other doesn\'t work properly.'] },
  { ingredient: 'Adaptogens',           advantage: ['150mg Rhodiola standardised to ', '3% Rosavins', ' — the clinical concentration. Unstandardised extracts are just filler.'] },
  { ingredient: 'L-Theanine',           advantage: ['100mg paired with ', '200mg caffeine', ' — the exact ratio studied for calm, sustained focus without anxiety.'] },
  { ingredient: 'Natural Caffeine',     advantage: ['From Guarana — ', 'slower release, longer effect, no hard crash', '. Not synthetic anhydrous caffeine.'] },
  { ingredient: 'Taurine',              advantage: ['500mg for cellular hydration and oxidative protection. ', 'Missing from every competing morning formula', '.'] },
  { ingredient: 'Electrolytes',         advantage: ['400mg — ', 'a real functional dose', '. Trace amounts found elsewhere don\'t move any measurable marker.'] },
  { ingredient: 'Sweetener System',     advantage: ['Reb-M + Thaumatin — ', 'the cleanest stevia fraction', ', no bitterness, no artificial sweeteners.'] },
];

const RECOVERY_ADVANTAGE = [
  { ingredient: 'Protein Source',       advantage: ['Free-form EAAs absorb in ', '15–30 min', '. Whey takes 60–90 min and misses the recovery window. Dairy-free. Complete.'] },
  { ingredient: 'Carbohydrate',         advantage: ['Low DE Maltodextrin — ', 'controlled glycemic response', ', not a blood sugar spike. Right amount, right form.'] },
  { ingredient: 'Carb:Protein Ratio',   advantage: ['3:1', ' — the research-backed ratio for glycogen replenishment and cortisol reduction. Whey products get this backwards.'] },
  { ingredient: 'Creatine',             advantage: ['5g Monohydrate — ', 'the only dose with real evidence', ' behind it. Sub-doses in competitors produce no ergogenic effect.'] },
  { ingredient: 'HMB',                  advantage: ['1.5g clinical dose — ', 'blocks muscle breakdown', '. Expensive to include, which is why almost no one does.'] },
  { ingredient: 'L-Glutamine',          advantage: ['3g to support ', 'gut integrity post-training', '. Intense exercise increases intestinal permeability — this addresses it directly.'] },
  { ingredient: 'BCAAs',                advantage: ['Full EAA spectrum — BCAAs alone can\'t build complete muscle protein. ', 'Full spectrum produces measurably better results', '.'] },
  { ingredient: 'Tart Cherry',          advantage: ['500mg — clinically shown to reduce DOMS by ', 'up to 24%', ' and accelerate strength recovery.'] },
  { ingredient: 'Magnesium',            advantage: ['Bisglycinate — absorbed via amino acid transporters. ', 'Significantly more effective post-workout', ' than Oxide or Sulfate.'] },
  { ingredient: 'L-Theanine',           advantage: ['100mg to shift your nervous system from ', 'sympathetic to recovery mode', '. No other recovery product includes this.'] },
  { ingredient: 'Electrolytes',         advantage: ['Pink Himalayan Salt — sodium + ', '80+ trace minerals', '. Not refined sodium.'] },
  { ingredient: 'AstraGin®',            advantage: ['50mg patented extract that increases amino acid absorption by ', 'up to 67%', '. Makes everything else in the formula more effective.'] },
  { ingredient: 'Sweetener System',     advantage: ['Reb-M + Thaumatin — natural only. ', 'Sucralose and acesulfame-K', ' (used by competitors) have been linked to gut microbiome disruption.'] },
];

function AdvText({ parts, color }) {
  return (
    <p className="font-body font-300 text-[#555] text-[13px] leading-relaxed">
      {parts.map((part, i) =>
        i % 2 === 1 ? (
          <strong key={i} className="font-700" style={{ color }}>
            {part}
          </strong>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </p>
  );
}

function AdvantageTable({ items, sectionClass, gradientFrom, gradientTo }) {
  const color = gradientFrom;
  return (
    <table className="w-full border-collapse">
      <thead>
        <tr style={{ background: 'linear-gradient(180deg,#fafafa,#f5f3ff)' }}>
          <th className="text-left px-4 py-3 font-body text-[9px] tracking-[0.28em] uppercase font-700 w-[28%] border-b border-[#f0eef8]"
            style={{ color: gradientFrom }}>
            Ingredient
          </th>
          <th className="text-left px-4 py-3 font-body text-[9px] tracking-[0.28em] uppercase font-700 border-b border-[#f0eef8]"
            style={{ color: gradientFrom }}>
            The LIFECODE Advantage
          </th>
        </tr>
      </thead>
      <tbody>
        {items.map((row, i) => (
          <tr key={i} className={`${sectionClass} border-t border-[#f0eef8] opacity-0 ${i % 2 === 0 ? 'bg-white' : 'bg-[#fdfcff]'}`}>
            <td className="px-4 py-3.5 align-top w-[28%]">
              <div className="flex items-center gap-2">
                <div className="flex-shrink-0 w-1.5 h-1.5 rounded-full" style={{ background: color }} />
                <span className="font-sans font-700 text-[13px] tracking-tight text-[#0F172A]">
                  {row.ingredient}
                </span>
              </div>
            </td>
            <td className="px-4 py-3.5 align-top">
              <AdvText parts={Array.isArray(row.advantage) ? row.advantage : [row.advantage]} color={gradientTo} />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
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
      style={{ padding: '1.5px', background: gradientFrom }}
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
            <h3 className="font-sans font-700 text-[#0F172A] text-lg md:text-xl tracking-tight">
              {title}
            </h3>
          </div>
          <div
            className="flex-shrink-0 ml-4 w-8 h-8 rounded-full flex items-center justify-center transition-transform duration-300"
            style={{
              background: gradientFrom,
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
            <div className="h-px w-full mb-2" style={{ background: `${gradientFrom}33` }} />
            <AdvantageTable items={items} sectionClass={sectionClass} gradientFrom={gradientFrom} gradientTo={gradientTo} />
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
          <div className="h-px w-5 bg-[#222]" />
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
                  <div className="cs-col opacity-0" style={{ padding: '1.5px', borderRadius: '12px', background: '#0F172A' }}>
                    <div className="bg-white py-3 px-4 rounded-[10.5px] text-center">
                      <p className="font-sans font-700 text-sm tracking-tight text-[#0F172A]">LIFECODE</p>
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
                      <div className="flex-shrink-0 mt-[5px] w-1.5 h-1.5 rounded-full bg-[#0F172A]" />
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
            <div className="h-px w-5 bg-[#222]" />
            <span className="font-body text-[10px] tracking-[0.32em] uppercase font-700 text-[#444]">
              Ingredient breakdown
            </span>
          </div>
          <h3
            className="font-sans font-700 text-[#0F172A] tracking-tight leading-[0.92] mb-8"
            style={{ fontSize: 'clamp(1.8rem, 3.5vw, 3.4rem)' }}
          >
            Not just what&apos;s in it —<br />
            <span style={{ color: '#0F172A' }}>
              why every ingredient is different.
            </span>
          </h3>

          <div className="flex flex-col gap-4">
            <AdvantageBlock
              title="Morning Pack — 13 reasons it outperforms"
              items={MORNING_ADVANTAGE}
              sectionClass="adv-row"
              gradientFrom={RED}
              gradientTo={PURPLE}
            />
            <AdvantageBlock
              title="Anabolic Recovery — 13 reasons it outperforms"
              items={RECOVERY_ADVANTAGE}
              sectionClass="adv-row"
              gradientFrom={PURPLE}
              gradientTo={RED}
            />

          </div>
        </div>

        {/* Full comparison CTA */}
        <div className="mt-12 flex justify-center">
          <Link
            href="/lifecode-comparison"
            className="inline-flex items-center gap-3 px-8 py-4 rounded-full font-sans font-700 text-[12px] tracking-widest uppercase text-white transition-opacity duration-300 hover:opacity-85"
            style={{ background: '#0F172A' }}
          >
            See Full Ingredient Comparison
            <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center">
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                <path d="M2 5h6M5.5 2.5L8 5l-2.5 2.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </span>
          </Link>
        </div>

      </div>
    </section>
  );
}
