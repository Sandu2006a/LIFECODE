import Link from 'next/link';

export const metadata = {
  title: 'The Science — Lifecode Nutrition',
  description: 'Clinical evidence behind every ingredient in Morning Pak and Anabolic Recovery.',
};

const BOX_G  = 'linear-gradient(135deg, #FF8A00 0%, #E8445A 55%, #7C3AED 100%)';
const HEAT_G = 'linear-gradient(90deg, #FF8A00, #E8445A, #7C3AED)';

function StudyLink({ href, children }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 text-[12px] font-body text-[#7C3AED] hover:text-[#E8445A] transition-colors duration-200 group">
      <svg width="11" height="11" viewBox="0 0 12 12" fill="none" className="flex-shrink-0 group-hover:translate-x-0.5 transition-transform duration-200">
        <path d="M2 6h8M6 2l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
      {children}
    </a>
  );
}

function Claim({ text }) {
  return (
    <div className="flex items-start gap-2.5 mt-2">
      <span className="mt-0.5 flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center"
        style={{ background: BOX_G }}>
        <svg width="8" height="8" viewBox="0 0 10 10" fill="none">
          <path d="M2 5l2.5 2.5L8 2.5" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </span>
      <p className="font-body text-[13px] text-[#444] leading-relaxed italic">"{text}"</p>
    </div>
  );
}

function IngredientCard({ name, dose, form, formText, science, claims, studies }) {
  return (
    <div className="border border-[#f0e8ff] rounded-2xl overflow-hidden bg-white">
      <div className="px-6 py-5 border-b border-[#f5f0ff]" style={{ background: 'linear-gradient(135deg, #FFFAF5, #FAF7FF)' }}>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <h3 className="font-sans font-700 text-[#0a0a0a] text-lg leading-tight">{name}</h3>
          <span className="font-sans font-700 text-[13px] bg-clip-text text-transparent flex-shrink-0"
            style={{ backgroundImage: HEAT_G }}>{dose}</span>
        </div>
        {form && (
          <p className="mt-2 font-body text-[13px] text-[#666] leading-relaxed">
            <span className="font-700 text-[#0a0a0a]">Why this form: </span>{formText}
          </p>
        )}
      </div>

      <div className="px-6 py-5 space-y-5">
        {science && (
          <div>
            <p className="font-body font-700 text-[10px] tracking-[0.22em] uppercase text-[#aaa] mb-2">What the science shows</p>
            <p className="font-body text-[14px] text-[#555] leading-relaxed">{science}</p>
          </div>
        )}

        {studies && studies.length > 0 && (
          <div>
            <p className="font-body font-700 text-[10px] tracking-[0.22em] uppercase text-[#aaa] mb-2.5">Clinical references</p>
            <div className="space-y-2">
              {studies.map((s, i) => (
                <StudyLink key={i} href={s.url}>{s.label}</StudyLink>
              ))}
            </div>
          </div>
        )}

        {claims && claims.length > 0 && (
          <div>
            <p className="font-body font-700 text-[10px] tracking-[0.22em] uppercase text-[#aaa] mb-1">EFSA-authorized claims</p>
            {claims.map((c, i) => <Claim key={i} text={c} />)}
          </div>
        )}
      </div>
    </div>
  );
}

const MORNING = [
  {
    name: 'Caffeine (from Guarana Extract, 22% Natural Caffeine)',
    dose: '200 mg',
    form: true,
    formText: 'Caffeine from Guarana releases slower than anhydrous caffeine — the natural matrix of the plant moderates absorption, producing sustained alertness without the sharp spike and crash of synthetic caffeine.',
    science: '200 mg caffeine is the threshold dose for EFSA-authorized claims on alertness and concentration. Studies show improved reaction time, sustained attention, and reduced perceived effort at exercise. Guarana extract specifically has been shown to improve memory and mood scores versus matched synthetic caffeine doses.',
    studies: [
      { label: 'Haskell et al. — Cognitive and mood effects of a nutrient-enriched breakfast bar. British Journal of Nutrition, 2010', url: 'https://pubmed.ncbi.nlm.nih.gov/20670458/' },
      { label: 'EFSA Panel — Scientific Opinion on the safety of caffeine. EFSA Journal, 2015', url: 'https://www.efsa.europa.eu/en/efsajournal/pub/4102' },
    ],
    claims: ['Caffeine contributes to increased alertness and concentration. (Min. 75 mg — our dose is 2.6× the minimum.)'],
  },
  {
    name: 'L-Theanine',
    dose: '100 mg',
    form: true,
    formText: 'Pure L-Theanine (not DL-Theanine) — the bioactive isomer found in green tea, associated with alpha-wave brain activity and relaxation without sedation.',
    science: 'The 100 mg L-Theanine + 200 mg caffeine combination (our exact ratio) is the most studied cognitive performance pairing in nutritional neuroscience. Studies consistently show improved attention-switching accuracy, reduced susceptibility to distraction, and faster reaction time versus caffeine alone — what researchers call "alert calmness."',
    studies: [
      { label: 'Owen et al. — Combined effects of L-theanine and caffeine on cognitive performance. Nutritional Neuroscience, 2008', url: 'https://pubmed.ncbi.nlm.nih.gov/18681988/' },
      { label: 'Haskell et al. — L-theanine, caffeine and their combination on cognition and mood. Biological Psychology, 2008', url: 'https://pubmed.ncbi.nlm.nih.gov/18006208/' },
      { label: 'Nobre et al. — L-theanine and its effect on mental state. Asia Pacific Journal of Clinical Nutrition, 2008', url: 'https://pubmed.ncbi.nlm.nih.gov/18296328/' },
    ],
  },
  {
    name: 'Rhodiola Rosea (3% Rosavins, SHR-5 Extract)',
    dose: '150 mg',
    form: true,
    formText: '3% Rosavins is the standardized extract used in clinical trials. Generic Rhodiola uses 1% or unstandardized extracts. SHR-5 is the specific extract studied in randomized controlled trials.',
    science: 'RCTs on SHR-5 at 150–200 mg show significant reduction in stress-related mental fatigue, improved cognitive performance under stress, and measurable reduction in burnout markers after 28 days. The Olsson 2009 trial (60 subjects, randomized double-blind) showed statistically significant improvement in fatigue, concentration, and stress response.',
    studies: [
      { label: 'Olsson et al. — SHR-5 Rhodiola rosea in stress-related fatigue. Planta Medica, 2009', url: 'https://pubmed.ncbi.nlm.nih.gov/19016404/' },
      { label: 'Shevtsov et al. — SHR-5 Rhodiola rosea vs. placebo for mental work capacity. Phytomedicine, 2003', url: 'https://pubmed.ncbi.nlm.nih.gov/12725561/' },
      { label: 'Spasov et al. — Adaptogenic effect in student exam stress. Phytomedicine, 2000', url: 'https://pubmed.ncbi.nlm.nih.gov/10839209/' },
    ],
  },
  {
    name: 'Magnesium Citrate',
    dose: '200 mg',
    form: true,
    formText: 'Magnesium citrate has ~30% bioavailability — significantly higher than magnesium oxide (4%). Most supplements use oxide because it\'s cheap. We use citrate because it works.',
    science: 'Magnesium is a cofactor in over 300 enzymatic reactions. Clinical research shows magnesium supplementation reduces fatigue, supports muscle function, and improves sleep quality. Subclinical deficiency is estimated at 50–80% of the general population on Western diets.',
    studies: [
      { label: 'Walker et al. — Magnesium supplementation and fluid retention. Journal of Women\'s Health, 1998', url: 'https://pubmed.ncbi.nlm.nih.gov/9861593/' },
      { label: 'Abbasi et al. — Magnesium supplementation on primary insomnia. Journal of Research in Medical Sciences, 2012', url: 'https://pubmed.ncbi.nlm.nih.gov/23853635/' },
      { label: 'Schwalfenberg & Genuis — The Importance of Magnesium in Clinical Healthcare. Scientifica, 2017', url: 'https://pubmed.ncbi.nlm.nih.gov/29093983/' },
    ],
    claims: [
      'Magnesium contributes to a reduction of tiredness and fatigue.',
      'Magnesium contributes to normal muscle function.',
      'Magnesium contributes to normal psychological function.',
    ],
  },
  {
    name: 'Methylated B-Complex (B1, B2, B3, B5, B6, B9, B12)',
    dose: '100% NRV each',
    form: true,
    formText: 'Methylated forms (Methylcobalamin, Methylfolate, P5P) are the bioactive forms the body uses directly. Non-methylated forms require conversion — a step impaired in ~40% of the population due to MTHFR gene variants.',
    science: 'Methylated B-vitamins directly support energy-yielding metabolism, neurotransmitter synthesis, and reduction of fatigue. Methylated B12 achieves higher serum levels and longer retention vs. cyanocobalamin. In populations with MTHFR variants, non-methylated forms are clinically ineffective.',
    studies: [
      { label: 'Carmel R. — How I treat cobalamin (vitamin B12) deficiency. Blood, 2008', url: 'https://pubmed.ncbi.nlm.nih.gov/18606874/' },
      { label: 'Stanger et al. — Homocysteine, folate and vitamin B12 in neuropsychiatric diseases. CCLM, 2009', url: 'https://pubmed.ncbi.nlm.nih.gov/19327106/' },
      { label: 'Kennedy DO — B Vitamins and the Brain. Nutrients, 2016', url: 'https://pubmed.ncbi.nlm.nih.gov/26828517/' },
    ],
    claims: [
      'B vitamins (B2, B3, B6, B12) contribute to normal energy-yielding metabolism.',
      'B12 contributes to the reduction of tiredness and fatigue.',
      'B6 contributes to normal psychological function.',
    ],
  },
  {
    name: 'Vitamin D3 (Cholecalciferol, Vegan)',
    dose: '25 µg (1000 IU)',
    form: true,
    formText: 'D3 raises serum 25-hydroxyvitamin D levels ~87% more effectively than D2. Most vegan brands use D2 because vegan D3 is more expensive. We source from lichen — same efficacy, no compromise.',
    science: 'D3 at 1000 IU daily is associated with improvement in immune function, bone metabolism, and muscle function. Studies estimate 40–50% of Europeans are deficient in Vitamin D.',
    studies: [
      { label: 'Tripkovic et al. — Vitamin D2 vs. D3 supplementation: meta-analysis. American Journal of Clinical Nutrition, 2012', url: 'https://pubmed.ncbi.nlm.nih.gov/22552031/' },
      { label: 'Holick MF — Vitamin D deficiency. New England Journal of Medicine, 2007', url: 'https://pubmed.ncbi.nlm.nih.gov/17634462/' },
    ],
    claims: [
      'Vitamin D contributes to the normal function of the immune system.',
      'Vitamin D contributes to the maintenance of normal muscle function.',
    ],
  },
  {
    name: 'Vitamin K2 (Menaquinone-7, MK-7)',
    dose: '50 µg',
    form: true,
    formText: 'MK-7 has a half-life of 72 hours versus MK-4\'s 1–2 hours — the only form that maintains consistent serum levels with once-daily dosing. MK-7 is used in all major clinical trials.',
    science: 'K2 MK-7 activates osteocalcin (bone mineralization) and Matrix Gla Protein (arterial calcification prevention). Critically — it directs calcium from Vitamin D3 into bones rather than soft tissue. D3 without K2 is an incomplete protocol.',
    studies: [
      { label: 'Knapen et al. — Three-year MK-7 supplementation and bone loss. Osteoporosis International, 2013', url: 'https://pubmed.ncbi.nlm.nih.gov/23525894/' },
      { label: 'Westenfeld et al. — Vitamin K2 supplementation and functional deficiency. American Journal of Kidney Diseases, 2012', url: 'https://pubmed.ncbi.nlm.nih.gov/22169590/' },
    ],
  },
  {
    name: 'Zinc Bisglycinate',
    dose: '10 mg',
    form: true,
    formText: 'Zinc bisglycinate (chelated) has significantly higher bioavailability than zinc oxide (used in most multivitamins). The glycine chelation protects through the digestive tract and improves mucosal uptake.',
    science: 'Bisglycinate form shows 43% greater absorption vs. zinc gluconate in head-to-head bioavailability studies. Zinc is essential for immune function, testosterone metabolism, and cognitive performance. Athletes are at elevated risk of depletion through sweat loss.',
    studies: [
      { label: 'Gandia et al. — Zinc bisglycinate vs. zinc gluconate bioavailability. IJVNR, 2007', url: 'https://pubmed.ncbi.nlm.nih.gov/18271278/' },
      { label: 'Prasad AS — Zinc: role in immunity, oxidative stress and chronic inflammation. COCNMC, 2009', url: 'https://pubmed.ncbi.nlm.nih.gov/19710611/' },
    ],
    claims: [
      'Zinc contributes to the normal function of the immune system.',
      'Zinc contributes to normal cognitive function.',
      'Zinc contributes to the maintenance of normal testosterone levels in the blood.',
    ],
  },
  {
    name: 'Taurine',
    dose: '500 mg',
    form: false,
    science: '500 mg taurine is associated with improved aerobic performance, reduced oxidative stress markers during exercise, and cellular hydration. Taurine acts as an osmolyte — regulating fluid balance within muscle cells.',
    studies: [
      { label: 'Balshaw et al. — Acute taurine ingestion on 3km running performance. Amino Acids, 2013', url: 'https://pubmed.ncbi.nlm.nih.gov/22855283/' },
      { label: 'Zhang et al. — Taurine supplementation and exercise-induced oxidative stress. Amino Acids, 2004', url: 'https://pubmed.ncbi.nlm.nih.gov/15042451/' },
    ],
  },
];

const RECOVERY = [
  {
    name: 'Essential Amino Acids — Full Spectrum EAA Complex',
    dose: '7,000 mg',
    form: true,
    formText: 'Free-form EAAs (all 9 essential amino acids) reach peak plasma concentration faster than protein-bound sources. They require no digestion — absorbed directly. BCAAs alone are inferior because MPS requires all 9 simultaneously.',
    science: 'Børsheim 2002 showed 6g mixed EAAs increased net MPS by over 250% above pre-exercise baseline post-workout. Wolfe 2017 (systematic review) confirmed BCAAs alone cannot sustain MPS — the full complement of EAAs is required.',
    studies: [
      { label: 'Børsheim et al. — EAAs and muscle protein recovery from resistance exercise. AJP, 2002', url: 'https://pubmed.ncbi.nlm.nih.gov/12107173/' },
      { label: 'Wolfe RR — BCAAs and muscle protein synthesis: myth or reality? JISSN, 2017', url: 'https://pubmed.ncbi.nlm.nih.gov/28852372/' },
      { label: 'Churchward-Venne et al. — Leucine or EAAs supplementing suboptimal protein. Journal of Physiology, 2012', url: 'https://pubmed.ncbi.nlm.nih.gov/22888109/' },
    ],
  },
  {
    name: 'Creatine Monohydrate',
    dose: '5,000 mg',
    form: true,
    formText: 'Creatine monohydrate is the most studied form — over 1,000 peer-reviewed publications. Alternative forms (Kre-Alkalyn, HCl, buffered) have not demonstrated superior efficacy in head-to-head trials.',
    science: 'Meta-analyses consistently show 5g daily creatine monohydrate increases maximal strength by 5–15%, improves high-intensity exercise capacity, and supports lean mass gains.',
    studies: [
      { label: 'Kreider et al. — ISSN position stand: creatine supplementation. JISSN, 2017', url: 'https://pubmed.ncbi.nlm.nih.gov/28615996/' },
      { label: 'Branch JD — Creatine supplementation on body composition: meta-analysis. IJSNEM, 2003', url: 'https://pubmed.ncbi.nlm.nih.gov/14669937/' },
      { label: 'Rawson & Volek — Creatine and resistance training on muscle strength. JSCR, 2003', url: 'https://pubmed.ncbi.nlm.nih.gov/14636102/' },
    ],
    claims: ['Creatine increases physical performance in successive bursts of short-term, high-intensity exercise. (Min. 3g — our dose is 5g.)'],
  },
  {
    name: 'HMB (β-Hydroxy β-Methylbutyrate, Calcium Salt)',
    dose: '1,500 mg',
    form: true,
    formText: 'Calcium HMB is the form used in clinical research. 1.5g is the standard dose from the literature — lower doses show attenuated effects.',
    science: 'HMB is a metabolite of leucine that inhibits the ubiquitin-proteasome pathway — the primary mechanism of exercise-induced muscle protein breakdown. 40+ studies show it reduces muscle damage markers, decreases DOMS, and preserves lean mass during high training load or caloric deficit.',
    studies: [
      { label: 'Wilson et al. — ISSN Position Stand: HMB. JISSN, 2013', url: 'https://pubmed.ncbi.nlm.nih.gov/23374455/' },
      { label: 'Nissen et al. — HMB on muscle metabolism during resistance training. JAP, 1996', url: 'https://pubmed.ncbi.nlm.nih.gov/8941534/' },
      { label: 'Rowlands & Thomson — HMB supplementation on strength and muscle damage. JSCR, 2009', url: 'https://pubmed.ncbi.nlm.nih.gov/19620930/' },
    ],
  },
  {
    name: 'Tart Cherry Extract',
    dose: '500 mg',
    form: false,
    science: 'Tart cherry is one of the highest natural sources of anthocyanins. Connolly 2006 demonstrated reduced strength loss and pain following eccentric exercise. Howatson 2010 (marathon runners) showed lower inflammatory markers and faster strength recovery. Bell 2016 showed reduced soreness and faster recovery of maximal voluntary contraction.',
    studies: [
      { label: 'Connolly et al. — Tart cherry juice blend in preventing muscle damage symptoms. BJSM, 2006', url: 'https://pubmed.ncbi.nlm.nih.gov/16790484/' },
      { label: 'Bell et al. — Montmorency tart cherry concentrate after intermittent exercise. Nutrients, 2016', url: 'https://pubmed.ncbi.nlm.nih.gov/27754998/' },
      { label: 'Howatson et al. — Tart cherry juice and recovery after marathon running. SJMSS, 2010', url: 'https://pubmed.ncbi.nlm.nih.gov/19883392/' },
    ],
  },
  {
    name: 'L-Glutamine',
    dose: '3,000 mg',
    form: false,
    science: 'Intense exercise significantly depletes plasma glutamine — the primary fuel for immune cells and intestinal enterocytes. Post-workout glutamine supports gut barrier integrity, immune function, and glycogen resynthesis when co-ingested with carbohydrates.',
    studies: [
      { label: 'Zuhl et al. — Oral glutamine and exercise-induced gastrointestinal permeability. JESF, 2015', url: 'https://www.sciencedirect.com/science/article/pii/S1728869X15000320' },
      { label: 'Calder & Yaqoob — Glutamine and the immune system. Amino Acids, 1999', url: 'https://pubmed.ncbi.nlm.nih.gov/10382576/' },
    ],
  },
  {
    name: 'AstraGin®',
    dose: '50 mg',
    form: true,
    formText: 'AstraGin® (NuLiv Science) is a patented Astragalus + Panax notoginseng complex. It upregulates nutrient transport proteins in the intestinal wall, increasing absorption of amino acids, creatine, and co-ingested nutrients.',
    science: 'AstraGin studies show +45% citrulline absorption, +66.7% arginine absorption, and increased creatine uptake in muscle cells. In a complex recovery formula with EAA, creatine, HMB, and glutamine — improved absorption of every co-ingested ingredient is a compounding benefit.',
    studies: [
      { label: 'NuLiv Science — AstraGin research portfolio (12 in-vitro and in-vivo studies)', url: 'https://nulivscience.com/ingredients/astragin/' },
      { label: 'Lin et al. — Astragalus membranaceus and chronic fatigue syndrome. Nutrients, 2014', url: 'https://pubmed.ncbi.nlm.nih.gov/25361535/' },
    ],
  },
  {
    name: 'Magnesium Bisglycinate',
    dose: '150 mg',
    form: true,
    formText: 'Bisglycinate crosses the blood-brain barrier more effectively than other forms — relevant for post-training nervous system recovery and sleep quality.',
    science: 'Athletes lose magnesium through sweat at 10–15% above sedentary baseline. Nielsen & Lukaski 2006 showed magnesium improved exercise performance and reduced physiological stress markers. Post-workout magnesium supports muscle relaxation and sleep onset.',
    studies: [
      { label: 'Nielsen & Lukaski — Magnesium and exercise. Magnesium Research, 2006', url: 'https://pubmed.ncbi.nlm.nih.gov/17172008/' },
      { label: 'Abbasi et al. — Magnesium supplementation on primary insomnia. JRMS, 2012', url: 'https://pubmed.ncbi.nlm.nih.gov/23853635/' },
    ],
    claims: [
      'Magnesium contributes to normal muscle function.',
      'Magnesium contributes to a reduction of tiredness and fatigue.',
    ],
  },
  {
    name: 'L-Theanine (Recovery role)',
    dose: '100 mg',
    form: false,
    science: 'In Recovery, L-Theanine supports post-training nervous system downregulation. Intense training activates the sympathetic nervous system. L-Theanine increases alpha-wave activity, promoting the transition to parasympathetic dominance — prerequisite for quality sleep and effective overnight recovery.',
    studies: [
      { label: 'Lyon et al. — L-theanine on objective sleep quality. Alternative Medicine Review, 2011', url: 'https://pubmed.ncbi.nlm.nih.gov/22214254/' },
      { label: 'Kimura et al. — L-Theanine reduces psychological and physiological stress. Biological Psychology, 2007', url: 'https://pubmed.ncbi.nlm.nih.gov/16930802/' },
    ],
  },
];

const COMPARISON = [
  { ingredient: 'Magnesium', ours: 'Citrate / Bisglycinate', cheap: 'Oxide', diff: '~7× higher absorption' },
  { ingredient: 'Zinc', ours: 'Bisglycinate', cheap: 'Oxide', diff: '43% higher vs gluconate' },
  { ingredient: 'B12', ours: 'Methylcobalamin', cheap: 'Cyanocobalamin', diff: 'Active in MTHFR variants' },
  { ingredient: 'B9', ours: 'Methylfolate', cheap: 'Folic Acid', diff: 'Active in 40% of population' },
  { ingredient: 'Vitamin D', ours: 'D3 (Cholecalciferol)', cheap: 'D2 (Ergocalciferol)', diff: '87% more effective' },
  { ingredient: 'K2', ours: 'MK-7 (72h half-life)', cheap: 'MK-4 (1-2h half-life)', diff: 'Once-daily efficacy' },
  { ingredient: 'Caffeine', ours: 'Natural Guarana', cheap: 'Anhydrous synthetic', diff: 'Sustained release profile' },
  { ingredient: 'Protein', ours: 'Free-form EAAs', cheap: 'BCAA-only blend', diff: 'Complete MPS activation' },
];

export default function SciencePage() {
  return (
    <div className="min-h-screen bg-white">

      {/* Hero */}
      <div className="pt-40 pb-16 px-6 md:px-16 text-center max-w-[860px] mx-auto">
        <div className="inline-flex items-center gap-3 mb-6">
          <div className="w-5 h-px" style={{ background: HEAT_G }} />
          <span className="font-body text-[10px] tracking-[0.32em] uppercase font-600" style={{ color: '#E8445A' }}>
            Clinical evidence
          </span>
          <div className="w-5 h-px" style={{ background: HEAT_G }} />
        </div>
        <h1 className="font-sans font-700 text-[#0a0a0a] leading-[0.92] tracking-tight"
          style={{ fontSize: 'clamp(2.4rem, 6vw, 5rem)' }}>
          The science behind<br/>
          <span className="bg-clip-text text-transparent" style={{ backgroundImage: HEAT_G }}>
            our formula.
          </span>
        </h1>
        <p className="mt-6 font-body font-300 text-[#666] text-base md:text-[17px] leading-relaxed max-w-[560px] mx-auto">
          Every ingredient chosen for a reason. Every dose matched to the clinical literature.
          Every form selected for maximum bioavailability.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <a href="#morning"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-white font-sans font-700 text-[11px] tracking-[0.18em] uppercase"
            style={{ background: HEAT_G }}>
            Morning Pak ↓
          </a>
          <a href="#recovery"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-[#e0e0e0] font-sans font-700 text-[11px] tracking-[0.18em] uppercase text-[#444] hover:border-[#bbb] transition-colors">
            Anabolic Recovery ↓
          </a>
        </div>
      </div>

      {/* Morning Pak */}
      <section id="morning" className="px-6 md:px-16 pb-16 max-w-[1100px] mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <div>
            <p className="font-body text-[10px] tracking-[0.32em] uppercase text-[#aaa] mb-1">Phase 01</p>
            <h2 className="font-sans font-700 text-[#0a0a0a] text-2xl md:text-3xl tracking-tight">Morning Pak</h2>
          </div>
          <div className="flex-1 h-px" style={{ background: 'linear-gradient(90deg, #e0e0e0, transparent)' }} />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {MORNING.map(ing => <IngredientCard key={ing.name} {...ing} />)}
        </div>
      </section>

      {/* Anabolic Recovery */}
      <section id="recovery" className="px-6 md:px-16 pb-16 max-w-[1100px] mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <div>
            <p className="font-body text-[10px] tracking-[0.32em] uppercase text-[#aaa] mb-1">Phase 04</p>
            <h2 className="font-sans font-700 text-[#0a0a0a] text-2xl md:text-3xl tracking-tight">Anabolic Recovery</h2>
          </div>
          <div className="flex-1 h-px" style={{ background: 'linear-gradient(90deg, #e0e0e0, transparent)' }} />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {RECOVERY.map(ing => <IngredientCard key={ing.name} {...ing} />)}
        </div>
      </section>

      {/* Form comparison table */}
      <section className="px-6 md:px-16 pb-16 max-w-[1100px] mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <h2 className="font-sans font-700 text-[#0a0a0a] text-2xl md:text-3xl tracking-tight">Why form matters</h2>
          <div className="flex-1 h-px" style={{ background: 'linear-gradient(90deg, #e0e0e0, transparent)' }} />
        </div>
        <div className="rounded-2xl border border-[#f0e8ff] overflow-hidden">
          <div className="hidden md:grid grid-cols-4 px-5 py-3 border-b border-[#f0e8ff]"
            style={{ background: 'linear-gradient(135deg, #FFFAF5, #FAF7FF)' }}>
            {['Ingredient', 'Lifecode form', 'Common cheap form', 'Difference'].map(h => (
              <p key={h} className="font-body font-700 text-[10px] tracking-[0.22em] uppercase text-[#aaa]">{h}</p>
            ))}
          </div>
          {COMPARISON.map((row, i) => (
            <div key={row.ingredient}
              className={`grid grid-cols-1 md:grid-cols-4 px-5 py-4 gap-1 md:gap-0 ${i !== COMPARISON.length - 1 ? 'border-b border-[#f5f5f5]' : ''}`}>
              <p className="font-sans font-700 text-[#0a0a0a] text-[13px]">{row.ingredient}</p>
              <p className="font-body text-[13px] bg-clip-text text-transparent" style={{ backgroundImage: HEAT_G }}>{row.ours}</p>
              <p className="font-body text-[13px] text-[#aaa] line-through">{row.cheap}</p>
              <p className="font-body font-700 text-[13px] text-[#0a0a0a]">{row.diff}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Disclosure */}
      <section className="px-6 md:px-16 pb-20 max-w-[860px] mx-auto">
        <div className="rounded-2xl border border-[#f0f0f0] bg-[#fafafa] px-6 py-6">
          <p className="font-body font-700 text-[10px] tracking-[0.22em] uppercase text-[#aaa] mb-3">Legal disclosure</p>
          <p className="font-body text-[12px] text-[#999] leading-relaxed">
            All statements on this page are based on peer-reviewed clinical research on individual ingredients at doses comparable to those used in Lifecode Nutrition products.
            Research citations refer to studies on individual ingredients — not on the finished Lifecode Nutrition product. Individual results may vary.
          </p>
          <p className="font-body text-[12px] text-[#999] leading-relaxed mt-3">
            Lifecode Nutrition products are food supplements and are not intended to diagnose, treat, cure, or prevent any disease.
            Health claims comply with EU Regulation (EC) No 1924/2006, US FDA guidelines, Health Canada NNHPD, and FSANZ Standard 1.2.7.
            Consult a qualified healthcare professional before use.
          </p>
        </div>
      </section>

    </div>
  );
}
