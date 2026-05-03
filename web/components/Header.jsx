'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
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

const BOX_G  = 'linear-gradient(90deg, #FF8A00, #C62828)';
const HEAT_G = 'linear-gradient(90deg, #FF8A00, #C62828, #7C3AED)';

export default function Header() {
  const headerRef = useRef(null);
  const router    = useRouter();
  const pathname  = usePathname();
  const timer     = useBannerTimer();
  const [scrolled, setScrolled] = useState(false);
  const [user, setUser]         = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);

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
    return () => trigger.kill();
  }, []);

  useEffect(() => {
    const supabase = createSupabaseBrowser();

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    const supabase = createSupabaseBrowser();
    await supabase.auth.signOut();
    setMenuOpen(false);
    router.push('/');
    router.refresh();
  };

  const firstName = user
    ? (user.user_metadata?.display_name || user.user_metadata?.full_name || user.email || '')
        .split(' ')[0]
    : '';

  const initial = firstName.charAt(0).toUpperCase();

  return (
    <header
      ref={headerRef}
      className={`
        fixed top-0 left-0 right-0 z-50
        flex flex-col
        transition-all duration-500
        ${scrolled
          ? 'bg-white/95 backdrop-blur-md shadow-sm'
          : 'bg-transparent'}
      `}
      style={{ opacity: 0 }}
    >
      {/* ── Row 1: Nav ── */}
      <div className={`flex items-center justify-between px-8 md:px-16 py-2 transition-all duration-500 ${scrolled ? 'border-b border-[#eee]' : 'border-b border-transparent'}`}>

        {/* Wordmark */}
        <Link href="/"
          className="font-sans font-700 tracking-[0.32em] uppercase select-none transition-opacity duration-300 hover:opacity-80 bg-clip-text text-transparent"
          style={{ fontSize: '1.05rem', backgroundImage: BOX_G }}>
          LIFECODE
        </Link>

        {/* Nav links */}
        <nav className="hidden md:flex items-center gap-6">
          {[
            ['Morning',     '/products/morning'],
            ['Recovery',    '/products/recovery'],
            ['Ingredients', '/ingredients'],
            ['Comparisons', '/lifecode-comparison'],
            ['Ecosystem',   '/#ecosystem'],
            ['About',       '/about'],
          ].map(([label, href]) => {
            const isActive = pathname === href;
            return (
              <Link key={label} href={href}
                className="relative font-sans font-600 text-[11px] tracking-[0.18em] uppercase transition-all duration-300 group"
                style={{ color: isActive ? 'transparent' : '#444',
                  backgroundImage: isActive ? BOX_G : undefined,
                  WebkitBackgroundClip: isActive ? 'text' : undefined,
                  backgroundClip: isActive ? 'text' : undefined,
                }}>
                {label}
                <span className="absolute -bottom-0.5 left-0 h-[1.5px] w-0 group-hover:w-full transition-all duration-300 rounded-full"
                  style={{ background: BOX_G }} />
              </Link>
            );
          })}
        </nav>

        {/* Right — buttons */}
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
      </div>{/* close Row 1 */}

      {/* ── Row 2: Countdown banner ── */}
      <Link
        href={pathname === '/' ? '#preorder' : '/#preorder'}
        className="w-full flex items-center justify-center flex-wrap gap-3 md:gap-6 px-4 py-3 cursor-pointer group"
        style={{
          background: 'linear-gradient(90deg, #FFF9F5 0%, #FFF5F0 40%, #F8F5FF 100%)',
          borderTop: '1px solid rgba(255,138,0,0.18)',
          borderBottom: '1px solid rgba(124,58,237,0.15)',
        }}
      >
        {/* Pulse + label */}
        <span className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: '#C62828' }} />
          <span className="font-sans font-700 text-[11px] tracking-[0.28em] uppercase bg-clip-text text-transparent"
            style={{ backgroundImage: HEAT_G }}>Coming Soon</span>
        </span>

        <span className="hidden sm:block w-px h-4 bg-[#e0d0f0]" />

        {/* Offer */}
        <span className="font-body text-[13px] text-[#444]">
          First{' '}
          <strong className="font-800 bg-clip-text text-transparent" style={{ backgroundImage: HEAT_G }}>100</strong>
          {' '}founders get{' '}
          <strong className="font-800 text-[15px] bg-clip-text text-transparent" style={{ backgroundImage: HEAT_G }}>70% OFF</strong>
          {' '}their first month
        </span>

        <span className="hidden sm:block w-px h-4 bg-[#e0d0f0]" />

        {/* Timer */}
        <span className="flex items-center gap-1.5 font-sans font-700 text-[13px] tabular-nums">
          {[{v:timer.d,l:'d'},{v:timer.h,l:'h'},{v:timer.m,l:'m'},{v:timer.s,l:'s'}].map(({v,l},i)=>(
            <span key={l} className="flex items-center gap-1">
              <span className="bg-clip-text text-transparent" style={{ backgroundImage: HEAT_G }}>{pad(v)}</span>
              <span className="text-[10px] text-[#bbb] font-400">{l}</span>
              {i<3 && <span className="text-[#ddd] mx-0.5">:</span>}
            </span>
          ))}
        </span>

        <span className="hidden sm:block w-px h-4 bg-[#e0d0f0]" />

        {/* CTA pill */}
        <span
          className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-white font-sans font-700 text-[11px] tracking-[0.15em] uppercase group-hover:opacity-85 transition-opacity"
          style={{ background: HEAT_G }}
        >
          Pre-order <span className="group-hover:translate-x-0.5 transition-transform duration-200">→</span>
        </span>
      </Link>
    </header>
  );
}
