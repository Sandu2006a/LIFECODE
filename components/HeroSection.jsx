'use client';

import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';

export default function HeroSection() {
  const containerRef = useRef(null);
  const taglineRef   = useRef(null);
  const subtextRef   = useRef(null);
  const scrollCueRef = useRef(null);
  const lineLeftRef  = useRef(null);
  const lineRightRef = useRef(null);

  useEffect(() => {
    const tl = gsap.timeline({ delay: 0.7 });

    // Horizontal rule lines expand outward
    tl.fromTo(
      [lineLeftRef.current, lineRightRef.current],
      { scaleX: 0 },
      { scaleX: 1, duration: 1.4, ease: 'power4.inOut', stagger: 0 },
      0
    );

    // Main tagline — word-by-word rise
    const words = taglineRef.current.querySelectorAll('.word');
    tl.fromTo(
      words,
      { opacity: 0, y: 60, rotateX: -20 },
      {
        opacity: 1,
        y: 0,
        rotateX: 0,
        duration: 1.1,
        ease: 'power4.out',
        stagger: 0.09,
      },
      0.3
    );

    // Subtext
    tl.fromTo(
      subtextRef.current,
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 1, ease: 'power3.out' },
      1.0
    );

    // Scroll cue
    tl.fromTo(
      scrollCueRef.current,
      { opacity: 0 },
      { opacity: 1, duration: 0.8, ease: 'none' },
      1.6
    );

    // Subtle breathing pulse on scroll cue
    gsap.to(scrollCueRef.current, {
      y: 6,
      repeat: -1,
      yoyo: true,
      duration: 1.4,
      ease: 'sine.inOut',
      delay: 2.4,
    });
  }, []);

  const taglineWords = ['We', 'are', 'what', 'we', 'eat.'];

  return (
    <section
      ref={containerRef}
      id="hero"
      className="
        relative flex flex-col items-center justify-center
        min-h-screen px-6
        overflow-hidden
      "
    >
      {/* Radial noise-vignette overlay */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 80% 60% at 50% 50%, transparent 40%, #000 100%)',
        }}
      />

      {/* Thin horizontal rule — left side */}
      <div
        ref={lineLeftRef}
        className="absolute top-1/2 left-0 h-px bg-lc-line origin-left"
        style={{ width: '20vw', transform: 'scaleX(0)' }}
      />

      {/* Thin horizontal rule — right side */}
      <div
        ref={lineRightRef}
        className="absolute top-1/2 right-0 h-px bg-lc-line origin-right"
        style={{ width: '20vw', transform: 'scaleX(0)' }}
      />

      {/* Main content */}
      <div className="relative z-10 text-center max-w-5xl mx-auto">
        {/* Eyebrow label */}
        <p
          className="
            font-body text-xs tracking-widest3 text-lc-dim uppercase
            mb-10 select-none
          "
        >
          Precision Nutrition
        </p>

        {/* Headline */}
        <h1
          ref={taglineRef}
          className="
            font-sans font-700 text-white leading-none
            text-[clamp(3.2rem,9vw,9rem)]
            tracking-tight select-none
          "
          style={{ perspective: '600px' }}
        >
          {taglineWords.map((word, i) => (
            <span
              key={i}
              className="word inline-block mr-[0.22em] last:mr-0"
              style={{ opacity: 0 }}
            >
              {word}
            </span>
          ))}
        </h1>

        {/* Subtext */}
        <p
          ref={subtextRef}
          className="
            font-body font-300 text-lc-dim
            text-[clamp(0.85rem,1.3vw,1.1rem)]
            tracking-wide mt-10 max-w-md mx-auto leading-relaxed
          "
          style={{ opacity: 0 }}
        >
          Every compound. Every ratio. Every moment.
          <br />
          Engineered around the biology of peak performance.
        </p>
      </div>

      {/* Scroll cue */}
      <div
        ref={scrollCueRef}
        className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3"
        style={{ opacity: 0 }}
      >
        <span className="font-body text-[10px] tracking-widest2 text-lc-dim uppercase">
          Scroll
        </span>
        <div className="w-px h-10 bg-gradient-to-b from-lc-dim to-transparent" />
      </div>
    </section>
  );
}
