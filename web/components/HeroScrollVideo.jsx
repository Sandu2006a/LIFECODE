'use client';

import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

export default function HeroScrollVideo() {
  const sectionRef = useRef(null);
  const videoRef   = useRef(null);
  const barRef     = useRef(null);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const video = videoRef.current;
    if (!video) return;

    // Entrance animations
    gsap.fromTo('.hv-brand',
      { opacity: 0, y: -16 },
      { opacity: 1, y: 0, duration: 1.1, ease: 'power3.out', delay: 0.4 }
    );
    gsap.fromTo('.hv-sub',
      { opacity: 0, y: 18 },
      { opacity: 1, y: 0, duration: 1.1, ease: 'power3.out', delay: 0.8 }
    );
    gsap.fromTo('.hv-hint',
      { opacity: 0 },
      { opacity: 1, duration: 1, delay: 1.4 }
    );

    const init = () => {
      ScrollTrigger.create({
        trigger: sectionRef.current,
        start: 'top top',
        end: '+=250%',
        pin: true,
        scrub: 0.6,
        onUpdate: (self) => {
          if (video.duration) {
            video.currentTime = self.progress * video.duration;
          }
          if (barRef.current) {
            barRef.current.style.transform = `scaleX(${self.progress})`;
          }
        },
      });
    };

    if (video.readyState >= 1) {
      init();
    } else {
      video.addEventListener('loadedmetadata', init, { once: true });
    }

    return () => {
      ScrollTrigger.getAll().forEach(t => t.kill());
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative w-full h-screen bg-white overflow-hidden flex items-center justify-center"
    >
      {/* Scroll progress bar */}
      <div className="absolute bottom-0 left-0 right-0 h-[2px] z-30 bg-[#f0f0f0]">
        <div
          ref={barRef}
          className="h-full origin-left"
          style={{
            transform: 'scaleX(0)',
            background: 'linear-gradient(90deg, #FF8A00, #C62828, #7C3AED, #1D4ED8)',
          }}
        />
      </div>

      {/* LIFECODE wordmark */}
      <div className="hv-brand absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-8 md:px-16 pt-7 opacity-0">
        <span
          className="font-sans font-700 text-sm tracking-[0.35em] text-[#111] uppercase select-none"
        >
          LIFECODE
        </span>
        <span className="font-body text-[9px] tracking-widest3 text-[#aaa] uppercase hidden md:block">
          Performance System
        </span>
      </div>

      {/* Video — full screen */}
      <video
        ref={videoRef}
        src="/boxvideo.mp4"
        muted
        playsInline
        preload="auto"
        className="absolute inset-0 w-full h-full object-cover"
      />

      {/* Bottom tagline */}
      <div className="hv-sub absolute bottom-10 left-0 right-0 z-20 flex flex-col items-center gap-3 opacity-0">
        <p className="font-body font-300 text-xs md:text-sm tracking-[0.25em] text-[#444] uppercase">
          Performance nutrition system for athletes
        </p>
      </div>

      {/* Scroll hint */}
      <div className="hv-hint absolute bottom-10 right-8 md:right-16 z-20 flex items-center gap-2 opacity-0">
        <div className="flex flex-col gap-[3px]">
          <div className="w-3 h-[1px] bg-[#bbb]" />
          <div className="w-3 h-[1px] bg-[#bbb]" />
          <div className="w-3 h-[1px] bg-[#bbb]" />
        </div>
        <span className="font-body text-[8px] tracking-widest text-[#bbb] uppercase">Scroll</span>
      </div>
    </section>
  );
}
