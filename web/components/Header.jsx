'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { createSupabaseBrowser } from '@/lib/supabase';

const BOX_G = 'linear-gradient(90deg, #FF8A00, #C62828)';

export default function Header() {
  const headerRef = useRef(null);
  const router    = useRouter();
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
        flex items-center justify-between
        px-8 md:px-16 py-5
        transition-all duration-500
        ${scrolled
          ? 'bg-white/95 backdrop-blur-md border-b border-[#eee] shadow-sm'
          : 'bg-transparent border-b border-transparent'}
      `}
      style={{ opacity: 0 }}
    >
      {/* Wordmark */}
      <Link href="/" className="font-sans font-700 text-sm tracking-[0.3em] text-[#111] uppercase select-none hover:opacity-70 transition-opacity duration-300">
        LIFECODE
      </Link>

      {/* Nav */}
      <nav className="hidden md:flex items-center gap-8">
        {[
          ['Morning',     '/#morning'],
          ['Recovery',    '/#recovery'],
          ['Ingredients', '/ingredients'],
          ['Ecosystem',   '/#ecosystem'],
          ['About',       '/about'],
        ].map(([label, href]) => (
          <Link key={label} href={href}
            className="font-body text-[12px] tracking-widest text-[#666] hover:text-[#111] transition-colors duration-300 uppercase">
            {label}
          </Link>
        ))}
      </nav>

      {/* Right */}
      <div className="hidden md:flex items-center gap-3">
        {user ? (
          /* ── Logged in: avatar + name + dropdown ── */
          <div className="relative">
            <button
              onClick={() => setMenuOpen(v => !v)}
              className="flex items-center gap-2.5 px-4 py-2 rounded-full border border-[#e8e8e8] hover:border-[#ccc] transition-all duration-200 bg-white"
            >
              {/* Avatar circle */}
              <span
                className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[12px] font-sans font-700 flex-shrink-0"
                style={{ background: BOX_G }}
              >
                {initial}
              </span>
              <span className="font-sans font-600 text-[13px] text-[#222]">{firstName}</span>
              <svg width="10" height="6" viewBox="0 0 10 6" fill="none" className={`transition-transform duration-200 ${menuOpen ? 'rotate-180' : ''}`}>
                <path d="M1 1l4 4 4-4" stroke="#999" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </button>

            {/* Dropdown */}
            {menuOpen && (
              <div className="absolute right-0 top-full mt-2 w-40 bg-white rounded-2xl border border-[#f0f0f0] shadow-[0_8px_40px_rgba(0,0,0,0.10)] overflow-hidden">
                <button
                  onClick={handleSignOut}
                  className="w-full text-left px-5 py-3.5 font-body text-[13px] text-[#e55] hover:bg-[#fff5f5] transition-colors">
                  Sign out
                </button>
              </div>
            )}
          </div>
        ) : (
          /* ── Not logged in: Log In + Get Started ── */
          <>
            <Link href="/login"
              className="inline-flex items-center px-5 py-2.5 rounded-full border border-[#e0e0e0] font-body text-[13px] tracking-widest text-[#444] uppercase hover:border-[#bbb] hover:text-[#111] transition-all duration-300">
              Log In
            </Link>
            <Link href="/pricing"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-white font-body text-[13px] tracking-widest uppercase transition-all duration-300 hover:opacity-85"
              style={{ background: BOX_G }}>
              Get Started
            </Link>
          </>
        )}
      </div>
    </header>
  );
}
