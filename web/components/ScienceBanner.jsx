import Link from 'next/link';

const HEAT_G = 'linear-gradient(90deg, #FF8A00, #E8445A, #7C3AED)';
const BOX_G  = 'linear-gradient(135deg, #FF8A00 0%, #E8445A 55%, #7C3AED 100%)';

const STATS = [
  { n: '17', label: 'Clinically-dosed ingredients' },
  { n: '40+', label: 'Peer-reviewed studies' },
  { n: '100%', label: 'Methylated B-vitamins' },
  { n: '0', label: 'Fillers or proprietary blends' },
];

export default function ScienceBanner() {
  return (
    <section className="px-6 md:px-16 py-14 md:py-20"
      style={{ background: 'linear-gradient(180deg, #ffffff 0%, #FFF8F5 50%, #FAF7FF 100%)' }}>
      <div className="max-w-[1100px] mx-auto">

        <div className="rounded-3xl border border-[#f0e8ff] overflow-hidden"
          style={{ background: 'linear-gradient(135deg, #FFFAF5 0%, #ffffff 50%, #FAF7FF 100%)' }}>

          <div className="px-8 md:px-14 pt-10 md:pt-14 pb-8 grid grid-cols-1 md:grid-cols-2 gap-10 items-center">

            {/* Left */}
            <div>
              <div className="inline-flex items-center gap-3 mb-5">
                <div className="w-5 h-px" style={{ background: HEAT_G }} />
                <span className="font-body text-[10px] tracking-[0.32em] uppercase font-600" style={{ color: '#E8445A' }}>
                  Transparent by design
                </span>
              </div>

              <h2 className="font-sans font-700 text-[#0a0a0a] leading-[0.95] tracking-tight"
                style={{ fontSize: 'clamp(1.8rem, 4vw, 3.2rem)' }}>
                The science behind<br />
                <span className="bg-clip-text text-transparent" style={{ backgroundImage: HEAT_G }}>
                  our formula.
                </span>
              </h2>

              <p className="mt-5 font-body font-300 text-[#666] text-[15px] md:text-[16px] leading-relaxed max-w-[420px]">
                Every ingredient has a reason. Every dose is matched to the clinical literature.
                Read the full research — PubMed links included.
              </p>

              <Link href="/science"
                className="mt-7 inline-flex items-center gap-3 px-7 py-3.5 rounded-full text-white font-sans font-700 text-[12px] tracking-[0.18em] uppercase group hover:opacity-90 transition-opacity duration-300"
                style={{ background: BOX_G }}>
                Read the science
                <span className="group-hover:translate-x-1 transition-transform duration-300">→</span>
              </Link>
            </div>

            {/* Right — stats grid */}
            <div className="grid grid-cols-2 gap-3">
              {STATS.map(({ n, label }) => (
                <div key={label} className="rounded-2xl border border-[#f0e8ff] bg-white px-5 py-5 shadow-sm">
                  <p className="font-sans font-700 text-3xl md:text-4xl bg-clip-text text-transparent tabular-nums"
                    style={{ backgroundImage: HEAT_G }}>
                    {n}
                  </p>
                  <p className="font-body font-300 text-[#666] text-[13px] mt-1 leading-snug">{label}</p>
                </div>
              ))}
            </div>

          </div>

          {/* Bottom strip */}
          <div className="px-8 md:px-14 py-4 border-t border-[#f0e8ff] flex flex-wrap items-center gap-x-6 gap-y-2">
            {['EFSA-authorized claims', 'PubMed-referenced', 'No proprietary blends', 'Methylated forms only'].map(tag => (
              <span key={tag} className="flex items-center gap-2 font-body text-[11px] text-[#888]">
                <span className="w-1 h-1 rounded-full flex-shrink-0" style={{ background: HEAT_G.replace('linear-gradient(90deg, ', '').split(',')[0] }} />
                {tag}
              </span>
            ))}
          </div>

        </div>
      </div>
    </section>
  );
}
