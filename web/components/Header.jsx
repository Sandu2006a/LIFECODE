'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

export default function Header() {
  const headerRef = useRef(null);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    gsap.fromTo(headerRef.current,
      { opacity: 0, y: -12 },
      { opacity: 1, y: 0, duration: 1, ease: 'power3.out', delay: 0.2 }
    );

    const trigger = ScrollTrigger.create({
      start: 'top -60px',
      onEnter: () => setScrolled(true),
      onLeaveBack: () => setScrolled(false),
    });

    return () => trigger.kill();
  }, []);

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
      <span className="font-sans font-700 text-sm tracking-[0.3em] text-[#111] uppercase select-none">
        LIFECODE
      </span>

      {/* Nav */}
      <nav className="hidden md:flex items-center gap-10">
        {[['Morning', '#morning'], ['Recovery', '#recovery'], ['Ecosystem', '#ecosystem']].map(([label, href]) => (
          <a
            key={label}
            href={href}
            className="font-body text-[12px] tracking-widest text-[#666] hover:text-[#111] transition-colors duration-300 uppercase"
          >
            {label}
          </a>
        ))}
      </nav>

      {/* Right */}
      <div className="hidden md:flex items-center gap-3">
        <Link
          href="/login"
          className="inline-flex items-center px-5 py-2.5 rounded-full border border-[#e0e0e0] font-body text-[13px] tracking-widest text-[#444] uppercase hover:border-[#bbb] hover:text-[#111] transition-all duration-300"
        >
          Log In
        </Link>
        <Link
          href="/pricing"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-white font-body text-[13px] tracking-widest uppercase transition-all duration-300 hover:opacity-85"
          style={{ background: 'linear-gradient(90deg, #FF8A00, #C62828)' }}
        >
          Get Started
        </Link>
      </div>
    </header>
  );
}
