'use client';

const ITEMS = [
  'Molecular Precision',
  '47 Bioactive Compounds',
  'Clinical Dosing',
  'Zero Fillers',
  'Circadian Aligned',
  '3-Phase Protocol',
  'Third-Party Verified',
  'Elite Performance',
];

export default function MarqueeStrip() {
  const repeated = [...ITEMS, ...ITEMS, ...ITEMS];

  return (
    <div className="relative overflow-hidden py-4 border-y border-lc-crimson/20" style={{ background: '#3A0008' }}>
      <div className="marquee-track flex items-center gap-0 whitespace-nowrap">
        {repeated.map((item, i) => (
          <span key={i} className="inline-flex items-center gap-6 px-6">
            <span className="font-sans font-600 text-[11px] tracking-widest3 text-white uppercase">{item}</span>
            <span className="text-lc-orange text-lg leading-none">·</span>
          </span>
        ))}
      </div>

      <style>{`
        .marquee-track {
          animation: marquee 30s linear infinite;
          width: max-content;
        }
        @keyframes marquee {
          from { transform: translateX(0); }
          to   { transform: translateX(-33.333%); }
        }
        @media (prefers-reduced-motion: reduce) {
          .marquee-track { animation: none; }
        }
      `}</style>
    </div>
  );
}
