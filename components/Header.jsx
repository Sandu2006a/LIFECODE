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

    // Entrance animation — lettermark + nav fade in on load
    const tl = gsap.timeline({ delay: 0.4 });
    tl.fromTo(
      headerRef.current,
      { opacity: 0, y: -12 },
      { opacity: 1, y: 0, duration: 1, ease: 'power3.out' }
    );

    // Show subtle backdrop once user has scrolled
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
        px-8 md:px-16 py-6
        transition-all duration-700
        ${scrolled
          ? 'bg-black/70 backdrop-blur-md border-b border-lc-line'
          : 'bg-transparent border-b border-transparent'}
      `}
      style={{ opacity: 0 }} /* GSAP handles entrance */
    >
      {/* Wordmark */}
      <span
        className="
          font-sans font-700 text-sm tracking-widest2 text-white
          uppercase select-none
        "
      >
        LIFECODE
      </span>

      {/* Minimal nav */}
      <nav className="hidden md:flex items-center gap-10">
        {['Science', 'Product', 'Ecosystem'].map((item) => (
          <a
            key={item}
            href={`#${item.toLowerCase()}`}
            className="
              font-body text-xs tracking-widest text-lc-dim
              hover:text-lc-silver transition-colors duration-300
              uppercase
            "
          >
            {item}
          </a>
        ))}
      </nav>

      {/* Right side: Log In + CTA */}
      <div className="hidden md:flex items-center gap-4">
        <Link
          href="/login"
          className="
            font-body text-xs tracking-widest text-lc-dim uppercase
            hover:text-lc-silver transition-colors duration-300
          "
        >
          Log In
        </Link>
        <a
          href="#ecosystem"
          className="
            inline-flex items-center gap-2
            px-5 py-2 rounded-full
            border border-lc-line
            font-body text-xs tracking-widest text-lc-silver uppercase
            hover:border-lc-silver/40 hover:text-white
            transition-all duration-500
          "
        >
          Create Your Ecosystem
        </a>
      </div>
    </header>
  );
}
