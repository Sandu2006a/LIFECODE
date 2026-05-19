'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, usePathname } from 'next/navigation';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { createSupabaseBrowser } from '@/lib/supabase';

const LAUNCH = new Date('2026-08-03T00:00:00Z');
function pad(n) { return String(n).padStart(2, '0'); }

function useBannerTimer() {
  const [t, setT] = useState({ d: 92, h: 0, m: 0, s: 0 });
  useEffect(() => {
    const tick = () => {
      const diff = Math.max(0, LAUNCH.getTime() - Date.now());
      setT({ d: Math.floor(diff/86400000), h: Math.floor(diff/3600000)%24, m: Math.floor(diff/60000)%60, s: Math.floor(diff/1000)%60 });
    };
    tick(); const id = setInterval(tick, 1000); return () => clearInterval(id);
  }, []);
  return t;
}

const BOX_G  = 'linear-gradient(135deg, #FF8A00 0%, #C62828 40%, #7C3AED 70%, #1D4ED8 100%)';
const HEAT_G = 'linear-gradient(90deg, #FF8A00, #C62828, #7C3AED)';
const BLACK  = '#0F172A';

const NAV_LINKS = [
  ['code.charge',  '/products/morning'],
  ['code.build',   '/products/recovery'],
  ['The Science',  '/science'],
  ['Ingredients',  '/ingredients'],
  ['Comparisons',  '/lifecode-comparison'],
  ['About',        '/about'],
  ['Contact',      '/contact'],
];

export default function Header() {
  const headerRef  = useRef(null);
  const router     = useRouter();
  const pathname   = usePathname();
  const timer      = useBannerTimer();
  const [scrolled,    setScrolled]    = useState(false);
  const [navHidden,   setNavHidden]   = useState(false);
  const [user,        setUser]        = useState(null);
  const [menuOpen,    setMenuOpen]    = useState(false);
  const [mobileOpen,  setMobileOpen]  = useState(false);
  const lastY = useRef(0);

  // Close mobile menu on route change
  useEffect(() => { setMobileOpen(false); }, [pathname]);

  // Lock body scroll when mobile menu open
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    gsap.fromTo(headerRef.current,
      { opacity: 0, y: -12 },
      { opacity: 1, y: 0, duration: 1, ease: 'power3.out', delay: 0.2 }
    );
    const trigger = ScrollTrigger.create({
      start: 'top -60px',
      onEnter:     () => setScrolled(true),
      onLeaveBack: () => setScrolled(false),
    });
    function onScroll() {
      const y = window.scrollY;
      if (y > 80) { setNavHidden(y > lastY.current); } else { setNavHidden(false); }
      lastY.current = y;
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => { trigger.kill(); window.removeEventListener('scroll', onScroll); };
  }, []);

  useEffect(() => {
    const supabase = createSupabaseBrowser();
    supabase.auth.getSession().then(({ data: { session } }) => setUser(session?.user ?? null));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => setUser(session?.user ?? null));
    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    const supabase = createSupabaseBrowser();
    await supabase.auth.signOut();
    setMenuOpen(false);
    setMobileOpen(false);
    router.push('/');
    router.refresh();
  };

  const firstName = user
    ? (user.user_metadata?.display_name || user.user_metadata?.full_name || user.email || '').split(' ')[0]
    : '';
  const initial = firstName.charAt(0).toUpperCase();

  return (
    <>
      <header
        ref={headerRef}
        className={`fixed top-0 left-0 right-0 z-50 flex flex-col transition-all duration-500
          ${scrolled ? 'bg-white/95 backdrop-blur-md shadow-sm' : 'bg-transparent'}`}
        style={{ opacity: 0 }}
      >
        {/* ── Row 1: Nav ── */}
        <div
          className={`flex items-center justify-between px-5 md:px-16 py-2 transition-all duration-400 overflow-hidden
            ${scrolled ? 'border-b border-[#eee]' : 'border-b border-transparent'}`}
          style={{ maxHeight: navHidden ? '0px' : '60px', opacity: navHidden ? 0 : 1,
                   paddingTop: navHidden ? 0 : undefined, paddingBottom: navHidden ? 0 : undefined }}
        >
          {/* Wordmark */}
          <Link href="/" className="flex items-center gap-3 select-none transition-opacity duration-300 hover:opacity-80">
            <img src="/logo.png" alt="" style={{ width: 40, height: 40, objectFit: 'contain' }} />
            <span className="font-sans font-700 tracking-[0.32em] uppercase bg-clip-text text-transparent"
              style={{ fontSize: '1.05rem', backgroundImage: BOX_G }}>
              LIFECODE
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-6">
            {NAV_LINKS.map(([label, href]) => {
              const isActive = pathname === href;
              return (
                <Link key={label} href={href}
                  className="relative font-body font-500 text-[13px] tracking-[0.08em] normal-case transition-all duration-300 group"
                  style={{ color: isActive ? BLACK : '#444', textTransform: 'none' }}>
                  {label}
                  <span className="absolute -bottom-0.5 left-0 h-[1.5px] w-0 group-hover:w-full transition-all duration-300 rounded-full"
                    style={{ background: BOX_G }} />
                </Link>
              );
            })}
          </nav>

          {/* Desktop right buttons */}
          <div className="hidden md:flex items-center gap-2.5">
            {user ? (
              <div className="relative">
                <button onClick={() => setMenuOpen(v => !v)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#e8e8e8] hover:border-[#ccc] transition-all duration-200 bg-white">
                  <span className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[11px] font-sans font-700 flex-shrink-0"
                    style={{ background: BOX_G }}>{initial}</span>
                  <span className="font-sans font-600 text-[12px] text-[#222]">{firstName}</span>
                  <svg width="9" height="5" viewBox="0 0 10 6" fill="none" className={`transition-transform duration-200 ${menuOpen ? 'rotate-180' : ''}`}>
                    <path d="M1 1l4 4 4-4" stroke="#999" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                </button>
                {menuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-36 bg-white rounded-2xl border border-[#f0f0f0] shadow-[0_8px_40px_rgba(0,0,0,0.10)] overflow-hidden">
                    <button onClick={handleSignOut}
                      className="w-full text-left px-4 py-3 font-body text-[13px] text-[#e55] hover:bg-[#fff5f5] transition-colors">
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link href="/login"
                  className="inline-flex items-center px-4 py-2 rounded-full border border-[#e0e0e0] font-body text-[12px] tracking-widest text-[#444] uppercase hover:border-[#bbb] hover:text-[#111] transition-all duration-300">
                  Log In
                </Link>
                <Link href="/pricing"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-white font-body text-[12px] tracking-widest uppercase transition-all duration-300 hover:opacity-85"
                  style={{ background: BOX_G }}>
                  Get Started
                </Link>
              </>
            )}
          </div>

          {/* Mobile right — hamburger */}
          <button
            onClick={() => setMobileOpen(v => !v)}
            className="md:hidden flex flex-col items-center justify-center w-10 h-10 gap-[5px] rounded-lg"
            aria-label="Menu"
          >
            <span className={`block h-[1.5px] w-6 rounded-full transition-all duration-300 origin-center
              ${mobileOpen ? 'rotate-45 translate-y-[6.5px]' : ''}`}
              style={{ background: BOX_G }} />
            <span className={`block h-[1.5px] w-6 rounded-full transition-all duration-300
              ${mobileOpen ? 'opacity-0 scale-x-0' : ''}`}
              style={{ background: BOX_G }} />
            <span className={`block h-[1.5px] w-6 rounded-full transition-all duration-300 origin-center
              ${mobileOpen ? '-rotate-45 -translate-y-[6.5px]' : ''}`}
              style={{ background: BOX_G }} />
          </button>
        </div>

        {/* ── Row 2: Countdown banner ── */}
        <Link
          href={pathname === '/' ? '#preorder' : '/#preorder'}
          className="w-full flex items-center justify-center flex-wrap gap-2 md:gap-6 px-4 py-2 cursor-pointer group"
          style={{
            background: 'linear-gradient(90deg, #FFF9F5 0%, #FFF3EC 40%, #F8F5FF 100%)',
            borderTop: '1px solid rgba(255,138,0,0.2)',
            borderBottom: '1px solid rgba(124,58,237,0.15)',
          }}
        >
          <span className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#FF8A00' }} />
            <span className="font-sans font-700 text-[10px] tracking-[0.32em] uppercase bg-clip-text text-transparent"
              style={{ backgroundImage: BOX_G }}>Coming Soon</span>
          </span>
          <span className="hidden sm:block w-px h-3.5" style={{ background: 'rgba(198,40,40,0.2)' }} />
          <span className="font-body text-[11px] sm:text-[12px] text-[#555]">
            <strong className="font-800 bg-clip-text text-transparent" style={{ backgroundImage: BOX_G }}>30% OFF</strong>
            {' '}on your first month
          </span>
          <span className="hidden sm:block w-px h-3.5" style={{ background: 'rgba(198,40,40,0.2)' }} />
          <span className="flex items-center gap-1.5 font-sans font-700 text-[12px] tabular-nums">
            {[{v:timer.d,l:'d'},{v:timer.h,l:'h'},{v:timer.m,l:'m'},{v:timer.s,l:'s'}].map(({v,l},i)=>(
              <span key={l} className="flex items-center gap-1">
                <span className="bg-clip-text text-transparent" style={{ backgroundImage: HEAT_G }}>{pad(v)}</span>
                <span className="text-[9px] text-[#bbb] font-400">{l}</span>
                {i<3 && <span className="text-[#ddd] mx-0.5">·</span>}
              </span>
            ))}
          </span>
          <span className="hidden sm:block w-px h-3.5" style={{ background: 'rgba(198,40,40,0.2)' }} />
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-white font-sans font-700 text-[10px] tracking-[0.18em] uppercase group-hover:opacity-85 transition-all duration-200"
            style={{ background: BOX_G }}>
            Pre-order →
          </span>
        </Link>
      </header>

      {/* ── Mobile menu overlay ── */}
      <div
        className={`fixed inset-0 z-40 md:hidden transition-all duration-300
          ${mobileOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        style={{ background: 'rgba(10,10,10,0.4)', backdropFilter: 'blur(4px)' }}
        onClick={() => setMobileOpen(false)}
      />

      {/* ── Mobile menu drawer ── */}
      <div
        className={`fixed top-0 right-0 h-full w-[80vw] max-w-[320px] z-50 md:hidden
          flex flex-col transition-transform duration-400 ease-[cubic-bezier(0.4,0,0.2,1)]
          ${mobileOpen ? 'translate-x-0' : 'translate-x-full'}`}
        style={{ background: 'white', boxShadow: '-8px 0 40px rgba(0,0,0,0.12)' }}
      >
        {/* Gradient top line */}
        <div className="h-[3px] w-full flex-shrink-0" style={{ background: BOX_G }} />

        {/* Header row */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#f5f5f5]">
          <span className="flex items-center gap-2">
            <img src="/logo.png" alt="" width={24} height={24} style={{ width: 24, height: 24, objectFit: 'contain' }} />
            <span className="font-sans font-700 tracking-[0.32em] uppercase text-[0.9rem] bg-clip-text text-transparent"
              style={{ backgroundImage: BOX_G }}>LIFECODE</span>
          </span>
          <button onClick={() => setMobileOpen(false)}
            className="w-8 h-8 flex items-center justify-center rounded-full border border-[#eee]">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M1 1l10 10M11 1L1 11" stroke="#666" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {/* Nav links */}
        <nav className="flex-1 overflow-y-auto px-6 py-6 space-y-1">
          {NAV_LINKS.map(([label, href]) => {
            const isActive = pathname === href;
            return (
              <Link key={label} href={href}
                className="flex items-center justify-between py-3.5 border-b border-[#f5f5f5] group"
                onClick={() => setMobileOpen(false)}>
                <span className={`font-sans font-600 text-[13px] tracking-[0.15em] uppercase transition-colors duration-200
                  ${isActive ? 'bg-clip-text text-transparent' : 'text-[#333] group-hover:text-[#0a0a0a]'}`}
                  style={isActive ? { backgroundImage: BOX_G } : {}}>
                  {label}
                </span>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none"
                  className="opacity-30 group-hover:opacity-70 group-hover:translate-x-0.5 transition-all duration-200">
                  <path d="M4 8h8M8 4l4 4-4 4" stroke="#666" strokeWidth="1.2" strokeLinecap="round"/>
                </svg>
              </Link>
            );
          })}
        </nav>

        {/* Bottom buttons */}
        <div className="px-6 py-6 border-t border-[#f5f5f5] space-y-3">
          {user ? (
            <>
              <div className="flex items-center gap-3 mb-4">
                <span className="w-9 h-9 rounded-full flex items-center justify-center text-white text-[13px] font-sans font-700"
                  style={{ background: BOX_G }}>{initial}</span>
                <span className="font-sans font-600 text-[14px] text-[#222]">{firstName}</span>
              </div>
              <button onClick={handleSignOut}
                className="w-full py-3 rounded-full border border-[#e0e0e0] font-body text-[12px] tracking-widest uppercase text-[#e55] hover:bg-[#fff5f5] transition-colors">
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link href="/login" onClick={() => setMobileOpen(false)}
                className="block w-full py-3 rounded-full border border-[#e0e0e0] font-body text-[12px] tracking-widest text-[#444] uppercase text-center hover:border-[#bbb] transition-all">
                Log In
              </Link>
              <Link href="/pricing" onClick={() => setMobileOpen(false)}
                className="block w-full py-3 rounded-full text-white font-body text-[12px] tracking-widest uppercase text-center hover:opacity-85 transition-opacity"
                style={{ background: BOX_G }}>
                Get Started
              </Link>
            </>
          )}
        </div>
      </div>
    </>
  );
}
