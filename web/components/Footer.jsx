import Link from 'next/link';

const BOX_G = 'linear-gradient(135deg, #FF8A00 0%, #C62828 40%, #7C3AED 70%, #1D4ED8 100%)';

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer
      className="px-8 md:px-16 pt-16 pb-10"
      style={{ background: 'linear-gradient(180deg, #F8F5FF 0%, #FFF5F0 100%)' }}
    >
      <div className="max-w-[1440px] mx-auto">

        {/* Top border */}
        <div className="h-[1.5px] w-full mb-12 rounded-full" style={{ background: BOX_G }} />

        <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-10 pb-10 border-b border-[#e8e0ff]">
          <div>
            <span
              className="font-sans font-700 text-2xl tracking-[0.3em] uppercase select-none block mb-3 bg-clip-text text-transparent"
              style={{ backgroundImage: BOX_G }}
            >
              LIFECODE
            </span>
            <p className="font-body font-300 text-[#aaa] text-sm tracking-wide italic">
              "We are what we eat"
            </p>
          </div>

          <nav className="flex flex-wrap gap-x-10 gap-y-4">
            {[
              ['Morning', '/products/morning'],
              ['Recovery', '/products/recovery'],
              ['Ingredients', '/#morning'],
              ['About', '/about'],
              ['Contact', '#'],
            ].map(([label, href]) => (
              <Link
                key={label}
                href={href}
                className="font-body text-[15px] tracking-widest text-[#aaa] hover:text-[#555] transition-colors duration-300 uppercase"
              >
                {label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center justify-between pt-8">
          <p className="font-body text-[15px] text-[#ccc] tracking-widest">
            &copy; {year} LIFECODE. All rights reserved.
          </p>
        </div>

      </div>
    </footer>
  );
}
