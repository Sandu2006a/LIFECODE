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

const BLACK  = '#0F172A';

export default function Header() {
  const headerRef = useRef(null);
  const router    = useRouter();
  const pathname  = usePathname();
  const timer     = useBannerTimer();
  const [scrolled,   setScrolled]   = useState(false);
  const [navHidden,  setNavHidden]  = useState(false);
  const [user,       setUser]       = useState(null);
  const [menuOpen,   setMenuOpen]   = useState(false);
  const lastY = useRef(0);

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

    // Hide nav on scroll down, show on scroll up
    function onScroll() {
      const y = window.scrollY;
      if (y > 80) {
        setNavHidden(y > lastY.current);
      } else {
        setNavHidden(false);
      }
      lastY.current = y;
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => { trigger.kill(); window.removeEventListener('scroll', onScroll); };
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
      {/* ── Row 1: Nav — hides on scroll down ── */}
      <div
        className={`flex items-center justify-between px-8 md:px-16 py-2 transition-all duration-400 overflow-hidden ${scrolled ? 'border-b border-[#eee]' : 'border-b border-transparent'}`}
        style={{ maxHeight: navHidden ? '0px' : '60px', opacity: navHidden ? 0 : 1, paddingTop: navHidden ? 0 : undefined, paddingBottom: navHidden ? 0 : undefined }}
      >

        {/* Wordmark */}
        <Link href="/"
          className="font-sans font-700 tracking-[0.32em] uppercase select-none transition-opacity duration-300 hover:opacity-80"
          style={{ fontSize: '1.05rem', color: BLACK }}>
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
                style={{ color: isActive ? BLACK : '#444' }}>
                {label}
                <span className="absolute -bottom-0.5 left-0 h-[1.5px] w-0 group-hover:w-full transition-all duration-300 rounded-full"
                  style={{ background: BLACK }} />
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
                  style={{ background: BLACK }}>{initial}</span>
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
                style={{ background: BLACK }}>
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
        style={{ background: '#0F172A', borderBottom: '2px solid #C62828' }}
      >
        {/* Pulse + label */}
        <span className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full animate-pulse bg-[#C62828]" />
          <span className="font-sans font-700 text-[11px] tracking-[0.28em] uppercase text-white">
            Coming Soon
          </span>
        </span>

        <span className="hidden sm:block w-px h-4 bg-white/20" />

        {/* Offer */}
        <span className="font-body text-[13px] text-white/70">
          First{' '}
          <strong className="font-800 text-white">100</strong>
          {' '}founders get{' '}
          <strong
            className="font-800 text-[16px] px-2 py-0.5 rounded-md mx-0.5"
            style={{ background: '#C62828', color: '#fff' }}>
            30% OFF
          </strong>
          {' '}their first month
        </span>

        <span className="hidden sm:block w-px h-4 bg-white/20" />

        {/* Timer */}
        <span className="flex items-center gap-1.5 font-sans font-700 text-[13px] tabular-nums">
          {[{v:timer.d,l:'d'},{v:timer.h,l:'h'},{v:timer.m,l:'m'},{v:timer.s,l:'s'}].map(({v,l},i)=>(
            <span key={l} className="flex items-center gap-1">
              <span className="text-[#C62828]">{pad(v)}</span>
              <span className="text-[10px] text-white/40 font-400">{l}</span>
              {i<3 && <span className="text-white/25 mx-0.5">:</span>}
            </span>
          ))}
        </span>

        <span className="hidden sm:block w-px h-4 bg-white/20" />

        {/* CTA pill */}
        <span
          className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full font-sans font-700 text-[11px] tracking-[0.15em] uppercase transition-all duration-200 group-hover:scale-105"
          style={{ background: '#C62828', color: '#fff', boxShadow: '0 0 16px rgba(198,40,40,0.5)' }}
        >
          Pre-order <span className="group-hover:translate-x-0.5 transition-transform duration-200">→</span>
        </span>
      </Link>
    </header>
  );
}
