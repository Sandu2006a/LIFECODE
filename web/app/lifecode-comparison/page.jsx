'use client';

import { useState } from 'react';
import Header from '@/components/Header';
import Link from 'next/link';

const BOX_G  = 'linear-gradient(135deg, #FF8A00 0%, #C62828 40%, #7C3AED 70%, #1D4ED8 100%)';
const HEAT_G = 'linear-gradient(90deg, #FF8A00, #C62828, #7C3AED)';

const MORNING_ROWS = [
  { feature: 'B-Complex (Methylated)',    what: 'Energy metabolism and cognitive function',   lc: 'Full methylated complex, 100% NRV',               c2: 'Often included, forms vary',              c3: 'Usually included, often non-methylated' },
  { feature: 'Vitamin D3',               what: 'Immune and bone health',                       lc: '25 µg (1000 IU)',                                 c2: '10–25 µg',                                c3: '10–20 µg' },
  { feature: 'Vitamin K2 (MK-7)',        what: 'Works with D3 for calcium metabolism',         lc: '50 µg',                                           c2: 'Rarely included',                         c3: 'Rarely included' },
  { feature: 'Vitamin C',                what: 'Antioxidant, immune support',                  lc: '200 mg (Calcium Ascorbate)',                       c2: '60–250 mg',                               c3: '60–100 mg' },
  { feature: 'Magnesium',                what: 'Reduces tiredness, muscle function',           lc: '350 mg (Citrate)',                                c2: '50–200 mg (often Oxide)',                 c3: '50–100 mg' },
  { feature: 'Zinc',                     what: 'Immune and cognitive function',                lc: '10 mg (Bisglycinate)',                             c2: '5–15 mg (form varies)',                   c3: '5–10 mg' },
  { feature: 'Iodine + Selenium',        what: 'Thyroid and metabolic function',               lc: 'Both included, full NRV',                         c2: 'Often missing',                           c3: 'Usually included' },
  { feature: 'Greens / Superfood Blend', what: 'Plant antioxidants, fiber',                   lc: 'Not the focus — vitamins prioritised',             c2: 'Core feature (spirulina, chlorella, etc.)', c3: 'Not included' },
  { feature: 'Probiotics',               what: 'Gut health support',                           lc: 'Not included',                                    c2: 'Often included (1–10 billion CFU)',       c3: 'Rarely included' },
  { feature: 'Adaptogens (Rhodiola)',    what: 'Stress response and focus',                   lc: '150 mg (3% Rosavins)',                             c2: 'Sometimes (doses often undisclosed)',     c3: 'Rarely included' },
  { feature: 'L-Theanine',              what: 'Calm focus, balances caffeine',                lc: '100 mg',                                          c2: 'Rarely included',                         c3: 'Not included' },
  { feature: 'Natural Caffeine',         what: 'Alertness and concentration',                  lc: '200 mg (from Guarana)',                           c2: 'Rarely included',                         c3: 'Not included' },
  { feature: 'Taurine',                  what: 'Cellular hydration, cognitive support',        lc: '500 mg',                                          c2: 'Not included',                            c3: 'Not included' },
  { feature: 'Electrolytes (Na + K)',    what: 'Hydration',                                    lc: '400 mg',                                          c2: 'Trace amounts',                           c3: 'Not included' },
  { feature: 'Sweetener system',         what: 'Taste without artificials',                   lc: 'Erythritol + Stevia Reb-M + Thaumatin',           c2: 'Stevia leaf (some report bitterness)',    c3: 'N/A' },
  { feature: 'Format',                   what: 'Convenience',                                  lc: 'Single-serve stick',                              c2: 'Tub + scoop',                             c3: '4–6 capsules daily' },
  { feature: 'Artificial additives',     what: null,                                            lc: 'None',                                            c2: 'Varies',                                  c3: 'Varies' },
];

const RECOVERY_ROWS = [
  { feature: 'Protein source',              what: 'Muscle protein synthesis',                    lc: '7 g free-form EAAs (full spectrum, dairy-free)', c2: '20–25 g whey + casein',                c3: 'None',                            c4: '5–10 g BCAAs only (incomplete)' },
  { feature: 'Carbohydrate',                what: 'Refills muscle energy stores',                 lc: '20 g Maltodextrin (Low DE)',                     c2: '3–10 g',                               c3: '30–40 g',                         c4: '0–2 g' },
  { feature: 'Carb-to-protein ratio',       what: 'Optimised recovery window',                   lc: '3:1 (research-aligned)',                         c2: '1:4 to 1:5',                           c3: 'Carbs only',                      c4: 'Protein only' },
  { feature: 'Creatine Monohydrate',        what: 'Strength, power, ATP recovery',               lc: '5 g (full clinical dose)',                       c2: 'Sometimes 1–3 g',                     c3: 'None',                            c4: 'None' },
  { feature: 'HMB (Calcium HMB)',           what: 'Reduces muscle protein breakdown',            lc: '1.5 g (full clinical dose)',                     c2: 'Rarely included',                     c3: 'None',                            c4: 'Rarely included' },
  { feature: 'L-Glutamine',                 what: 'Immune and gut recovery',                     lc: '3 g',                                           c2: '1–5 g (varies)',                       c3: 'None',                            c4: 'Sometimes' },
  { feature: 'BCAAs',                       what: 'Muscle support',                              lc: 'Full EAA spectrum (superior to BCAA-only)',      c2: '4–6 g (often added)',                 c3: 'None',                            c4: '5–10 g (incomplete amino profile)' },
  { feature: 'Tart Cherry Extract',         what: 'Recovery from intense exercise',              lc: '500 mg',                                        c2: 'Not included',                        c3: 'Not included',                    c4: 'Rarely included' },
  { feature: 'Magnesium',                   what: 'Muscle function, cramp prevention',           lc: '150 mg (Bisglycinate)',                          c2: 'Sometimes 50–100 mg',                 c3: 'Sometimes',                       c4: 'Rarely included' },
  { feature: 'L-Theanine',                  what: 'Post-training nervous system recovery',       lc: '100 mg',                                        c2: 'Not included',                        c3: 'Not included',                    c4: 'Not included' },
  { feature: 'Electrolytes',                what: 'Hydration',                                   lc: '300 mg (Pink Salt)',                             c2: 'Trace',                               c3: '200–500 mg',                      c4: '200–400 mg' },
  { feature: 'AstraGin®',                   what: 'Improves nutrient uptake',                    lc: '50 mg',                                         c2: 'Not included',                        c3: 'Not included',                    c4: 'Sometimes' },
  { feature: 'B-Vitamins',                  what: 'Energy metabolism',                           lc: 'Included',                                      c2: 'Sometimes',                           c3: 'Sometimes',                       c4: 'Sometimes' },
  { feature: 'Sweetener system',            what: 'Taste without artificials',                   lc: 'Stevia Reb-M + Thaumatin (natural)',             c2: 'Often sucralose or acesulfame-K',     c3: 'Often aspartame or sucralose',    c4: 'Often sucralose' },
  { feature: 'Dairy-free',                  what: 'Lactose-sensitive athletes',                  lc: 'Yes',                                           c2: 'No',                                  c3: 'Yes',                             c4: 'Yes' },
  { feature: 'Format',                      what: 'Convenience',                                 lc: 'Single-serve stick',                            c2: 'Tub + scoop',                         c3: 'Sachet or tub',                   c4: 'Tub or RTD' },
  { feature: 'Artificial additives',        what: null,                                          lc: 'None',                                          c2: 'Common',                              c3: 'Common',                          c4: 'Common' },
];

function CompTable({ rows, numCompetitors }) {
  const compKeys = ['c2', 'c3', 'c4'].slice(0, numCompetitors);
  return (
    <tbody>
      {rows.map((row) => (
        <tr key={row.feature} className="border-t border-[#f2f2f2]">
          <td className="py-4 pr-4 align-top">
            <p className="font-sans font-600 text-[#333] text-sm leading-snug">{row.feature}</p>
            {row.what && <p className="font-body text-[11px] text-[#bbb] mt-0.5 leading-snug">{row.what}</p>}
          </td>
          <td className="py-4 px-3 align-top"
            style={{ background: 'rgba(124,58,237,0.04)', borderLeft: '2px solid rgba(255,138,0,0.2)', borderRight: '2px solid rgba(124,58,237,0.2)' }}>
            <div className="flex items-start gap-2">
              <div className="flex-shrink-0 mt-[5px] w-1.5 h-1.5 rounded-full" style={{ background: BOX_G }} />
              <p className="font-sans font-600 text-[#222] text-sm leading-snug">{row.lc}</p>
            </div>
          </td>
          {compKeys.map((k) => (
            <td key={k} className="py-4 px-3 align-top border-l border-[#f5f5f5]">
              <p className="font-body text-[13px] text-[#aaa] leading-snug">{row[k]}</p>
            </td>
          ))}
        </tr>
      ))}
    </tbody>
  );
}

export default function ComparisonPage() {
  const [tab, setTab] = useState('morning');

  return (
    <>
      <Header />
      <main style={{ background: '#fff', minHeight: '100vh' }}>

        {/* Hero */}
        <section className="pt-36 pb-14 px-6 md:px-16"
          style={{ background: 'linear-gradient(180deg, #F8F5FF 0%, #fff 80%)' }}>
          <div className="max-w-[1200px] mx-auto">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-5 h-[1.5px]" style={{ background: BOX_G }} />
              <span className="font-body text-[11px] tracking-[0.32em] uppercase bg-clip-text text-transparent"
                style={{ backgroundImage: BOX_G }}>
                The Full Comparison
              </span>
            </div>
            <h1 className="font-sans font-700 text-[#111] leading-[0.92] tracking-tight mb-6"
              style={{ fontSize: 'clamp(2.8rem, 7vw, 6rem)' }}>
              LIFECODE<br />
              <span className="bg-clip-text text-transparent" style={{ backgroundImage: BOX_G }}>
                Comparison
              </span>
            </h1>
            <p className="font-body font-300 text-[#888] text-base md:text-lg leading-relaxed max-w-[600px] mb-8">
              Ingredient by ingredient. Form by form. No proprietary blends, no excuses.
              See exactly what you get — and what others leave out.
            </p>
            <Link href="/" className="inline-flex items-center gap-2 font-body text-[12px] tracking-widest uppercase text-[#bbb] hover:text-[#666] transition-colors">
              ← Back to home
            </Link>
          </div>
        </section>

        {/* Tables */}
        <section className="py-12 px-6 md:px-16">
          <div className="max-w-[1200px] mx-auto">

            {/* Tab switcher */}
            <div className="flex gap-1.5 mb-12 p-1 rounded-full border border-[#eee] w-fit bg-[#fafafa]">
              {[
                { key: 'morning',  label: 'Morning Pack' },
                { key: 'recovery', label: 'Anabolic Recovery' },
              ].map(({ key, label }) => (
                <button key={key} onClick={() => setTab(key)}
                  className="px-5 py-2.5 rounded-full font-sans font-700 text-[11px] tracking-[0.18em] uppercase transition-all duration-300"
                  style={tab === key ? { background: BOX_G, color: '#fff' } : { color: '#aaa' }}>
                  {label}
                </button>
              ))}
            </div>

            {/* Morning Pack */}
            {tab === 'morning' && (
              <div>
                <h2 className="font-sans font-700 text-[#111] text-xl md:text-2xl tracking-tight mb-1">
                  MORNING PACK — Category Comparison
                </h2>
                <p className="font-body text-[#bbb] text-sm mb-8">
                  vs. Typical Greens Powders · Typical Multivitamin Capsules
                </p>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse" style={{ minWidth: '700px' }}>
                    <colgroup>
                      <col style={{ width: '22%' }} />
                      <col style={{ width: '26%' }} />
                      <col style={{ width: '26%' }} />
                      <col style={{ width: '26%' }} />
                    </colgroup>
                    <thead>
                      <tr>
                        <th className="pb-5 text-left font-body text-[10px] tracking-[0.28em] uppercase text-[#ccc] font-400 pr-4" />
                        <th className="pb-5 px-3">
                          <div style={{ padding: '1.5px', borderRadius: '12px', background: BOX_G }}>
                            <div className="bg-white py-3 px-3 text-center" style={{ borderRadius: '10.5px' }}>
                              <p className="font-sans font-700 text-sm bg-clip-text text-transparent" style={{ backgroundImage: BOX_G }}>Life Code</p>
                              <p className="font-body text-[11px] text-[#999] tracking-wide uppercase mt-0.5">Morning Pack</p>
                            </div>
                          </div>
                        </th>
                        {['Typical Greens Powders', 'Typical Multivitamin Capsules'].map(h => (
                          <th key={h} className="pb-5 px-3">
                            <div className="border border-[#f0f0f0] rounded-xl py-3 px-3 text-center">
                              <p className="font-sans font-600 text-[#bbb] text-sm leading-snug">{h}</p>
                            </div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <CompTable rows={MORNING_ROWS} numCompetitors={2} />
                  </table>
                </div>
              </div>
            )}

            {/* Anabolic Recovery */}
            {tab === 'recovery' && (
              <div>
                <h2 className="font-sans font-700 text-[#111] text-xl md:text-2xl tracking-tight mb-1">
                  ANABOLIC RECOVERY — Category Comparison
                </h2>
                <p className="font-body text-[#bbb] text-sm mb-8">
                  vs. Typical Whey Recovery · Typical Carb-Based Recovery · Typical BCAA / EAA Drinks
                </p>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse" style={{ minWidth: '920px' }}>
                    <colgroup>
                      <col style={{ width: '18%' }} />
                      <col style={{ width: '20.5%' }} />
                      <col style={{ width: '20.5%' }} />
                      <col style={{ width: '20.5%' }} />
                      <col style={{ width: '20.5%' }} />
                    </colgroup>
                    <thead>
                      <tr>
                        <th className="pb-5 text-left font-body text-[10px] tracking-[0.28em] uppercase text-[#ccc] font-400 pr-4" />
                        <th className="pb-5 px-3">
                          <div style={{ padding: '1.5px', borderRadius: '12px', background: BOX_G }}>
                            <div className="bg-white py-3 px-3 text-center" style={{ borderRadius: '10.5px' }}>
                              <p className="font-sans font-700 text-sm bg-clip-text text-transparent" style={{ backgroundImage: BOX_G }}>Life Code</p>
                              <p className="font-body text-[11px] text-[#999] tracking-wide uppercase mt-0.5">Anabolic Recovery</p>
                            </div>
                          </div>
                        </th>
                        {['Typical Whey Recovery', 'Typical Carb-Based Recovery', 'Typical BCAA / EAA Drinks'].map(h => (
                          <th key={h} className="pb-5 px-3">
                            <div className="border border-[#f0f0f0] rounded-xl py-3 px-3 text-center">
                              <p className="font-sans font-600 text-[#bbb] text-sm leading-snug">{h}</p>
                            </div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <CompTable rows={RECOVERY_ROWS} numCompetitors={3} />
                  </table>
                </div>
              </div>
            )}

          </div>
        </section>

        {/* CTA */}
        <section className="py-20 px-6 md:px-16 text-center"
          style={{ background: 'linear-gradient(180deg, #fff 0%, #F8F5FF 100%)' }}>
          <div className="max-w-[600px] mx-auto">
            <h2 className="font-sans font-700 text-[#111] tracking-tight leading-[0.92] mb-6"
              style={{ fontSize: 'clamp(2rem, 4vw, 3.5rem)' }}>
              Ready to upgrade<br />
              <span className="bg-clip-text text-transparent" style={{ backgroundImage: BOX_G }}>
                your protocol?
              </span>
            </h2>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/pricing"
                className="inline-flex items-center gap-2 px-8 py-4 rounded-full text-white font-sans font-700 text-[12px] tracking-widest uppercase hover:opacity-85 transition-opacity duration-300"
                style={{ background: BOX_G }}>
                Get Started
              </Link>
              <Link href="/"
                className="inline-flex items-center gap-2 px-8 py-4 rounded-full font-body text-[12px] tracking-widest uppercase text-[#888] border border-[#e8e8e8] hover:border-[#bbb] hover:text-[#333] transition-all duration-300">
                Back to Home
              </Link>
            </div>
          </div>
        </section>

      </main>
    </>
  );
}
