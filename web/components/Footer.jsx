import Link from 'next/link';
import FooterDisclaimer from '@/components/legal/FooterDisclaimer';

const BOX_G = 'linear-gradient(135deg, #FF8A00 0%, #C62828 40%, #7C3AED 70%, #1D4ED8 100%)';

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer
      className="px-8 md:px-16 pt-10 pb-8"
      style={{ background: 'linear-gradient(180deg, #F8F5FF 0%, #FFF5F0 100%)' }}
    >
      <div className="max-w-[1440px] mx-auto">

        {/* Top border */}
        <div className="h-[1.5px] w-full mb-8 rounded-full" style={{ background: BOX_G }} />

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
              ['Morning',        '/#morning'],
              ['Recovery',       '/#recovery'],
              ['Ingredients',    '/ingredients'],
              ['About',          '/about'],
              ['Privacy Policy', '/privacy'],
              ['Terms of Use',   '/terms'],
              ['Contact',        '/contact'],
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

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-8">
          <p className="font-body text-[15px] text-[#ccc] tracking-widest">
            &copy; {year} LIFECODE. All rights reserved.
          </p>

          <div className="flex items-center gap-3">
            <a href="https://www.instagram.com/lifecodenutrition" target="_blank" rel="noopener noreferrer"
              aria-label="Instagram"
              className="w-10 h-10 rounded-full border border-[#e8e0ff] bg-white flex items-center justify-center text-[#999] hover:text-white hover:border-transparent transition-all duration-300 social-icon">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
                <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
              </svg>
            </a>
            <a href="https://www.facebook.com/lifecodenutrition" target="_blank" rel="noopener noreferrer"
              aria-label="Facebook"
              className="w-10 h-10 rounded-full border border-[#e8e0ff] bg-white flex items-center justify-center text-[#999] hover:text-white hover:border-transparent transition-all duration-300 social-icon">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.95c5.05-.5 9-4.76 9-9.95z"/>
              </svg>
            </a>
          </div>
        </div>

        <FooterDisclaimer />

      </div>
    </footer>
  );
}
