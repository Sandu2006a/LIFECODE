'use client';

import { useEffect, useRef } from 'react';
import Image from 'next/image';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

const BOX_G = 'linear-gradient(135deg, #FF8A00 0%, #C62828 40%, #7C3AED 70%, #1D4ED8 100%)';

const VOICES = [
  {
    name:  'Sergiu Postica',
    role:  'President, Moldovan Swimming Federation',
    photo: '/tigan.jpeg',
    tag:   'Federation President',
    quote: 'Athletes carry an invisible burden — the daily stress of figuring out what to take, when to take it, whether the dose is right. That mental load follows them into the water. When I saw Lifecode, I saw something I\'ve needed for years: a complete system that removes that burden entirely. Athletes show up thinking about performance. Not supplements.',
  },
  {
    name:  'Matthew Seymus',
    role:  'Head Coach, PSV Swimming Pro Team',
    photo: '/MAtei.jpeg',
    tag:   'Pro Team Head Coach',
    quote: 'General health blends are for someone who wants to feel less tired at a desk. They have nothing to do with what a PSV swimmer needs at 6am before a double session. Lifecode gives my athletes a protocol that matches their physiology — and an app that handles compliance automatically. I stop chasing reminders. They stop guessing. We both focus on what matters.',
  },
  {
    name:  'Dimitrii Nicolaev',
    role:  'Emeritus Junior Coach',
    photo: '/Nicolaev.jpeg',
    tag:   'Junior Development Coach',
    quote: 'The supplement market is overwhelming, poorly explained, and not built for a 17-year-old balancing school with double training days. They don\'t need more options. They need one clear answer. Lifecode is exactly that. A complete system that removes every decision except showing up and performing. I\'ve been coaching for decades. I\'ve never had something like this to give them.',
  },
  {
    name:  'Pavel Alovatkii',
    role:  'Olympian · Paris 2024',
    photo: '/alovatkii.jpeg',
    tag:   'Olympic Athlete',
    quote: 'At Olympic level, you can\'t afford to guess. I went to Paris without a real system — six products from four brands, no timing guidance, no feedback. Lifecode is what I always needed — engineered the way elite training is engineered. A protocol, a structure, and real data behind every decision. Athletes at every level deserve this.',
  },
];

export default function VoicesSection() {
  const sectionRef = useRef(null);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const ctx = gsap.context(() => {
      gsap.fromTo('.voice-hd',
        { opacity: 0, y: 24 },
        { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out', stagger: 0.1,
          scrollTrigger: { trigger: sectionRef.current, start: 'top 88%', once: true } }
      );
      gsap.fromTo('.voice-card',
        { opacity: 0, y: 36 },
        { opacity: 1, y: 0, duration: 0.75, ease: 'power3.out', stagger: 0.1,
          scrollTrigger: { trigger: '.voice-grid', start: 'top 85%', once: true } }
      );
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative overflow-hidden py-28 md:py-36 px-6 md:px-16"
      style={{ background: '#0B0A1A' }}
    >
      {/* Ambient glow */}
      <div className="pointer-events-none absolute left-[-15%] top-1/2 -translate-y-1/2 w-[40vw] h-[60vh] opacity-[0.08]"
        style={{ background: 'linear-gradient(135deg,#7C3AED,#1D4ED8)', filter: 'blur(120px)', borderRadius: '50%' }} />
      <div className="pointer-events-none absolute right-[-10%] bottom-0 w-[30vw] h-[40vh] opacity-[0.06]"
        style={{ background: 'linear-gradient(135deg,#FF8A00,#C62828)', filter: 'blur(100px)', borderRadius: '50%' }} />

      <div className="relative z-10 max-w-[1200px] mx-auto">

        {/* Header */}
        <div className="voice-hd opacity-0 flex items-center gap-3 mb-8">
          <div className="w-5 h-[1.5px]" style={{ background: BOX_G }} />
          <span className="font-body text-[11px] tracking-[0.32em] uppercase bg-clip-text text-transparent"
            style={{ backgroundImage: BOX_G }}>
            From the field
          </span>
        </div>

        <h2 className="voice-hd opacity-0 font-sans font-700 text-white leading-[0.95] tracking-tight mb-4"
          style={{ fontSize: 'clamp(2.2rem, 5vw, 4.5rem)' }}>
          Coaches. Athletes.<br />
          <span className="bg-clip-text text-transparent" style={{ backgroundImage: BOX_G }}>
            One system.
          </span>
        </h2>
        <p className="voice-hd opacity-0 font-body text-[15px] text-white/40 max-w-md leading-relaxed mb-16">
          The people on the pool deck and on the podium tell it better than we can.
        </p>

        {/* Cards grid */}
        <div className="voice-grid grid grid-cols-1 md:grid-cols-2 gap-5">
          {VOICES.map((v, i) => (
            <div
              key={v.name}
              className="voice-card opacity-0 rounded-2xl p-7 flex flex-col gap-5 transition-all duration-300 hover:scale-[1.015]"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
            >
              {/* Quote mark */}
              <div className="font-sans font-700 text-[56px] leading-none bg-clip-text text-transparent select-none"
                style={{ backgroundImage: BOX_G, lineHeight: '0.7' }}>
                "
              </div>

              {/* Quote */}
              <p className="font-body text-[15px] leading-[1.7] text-white/70 flex-1">
                {v.quote}
              </p>

              {/* Person */}
              <div className="flex items-center gap-4 pt-4"
                style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>

                {/* Photo */}
                <div className="flex-shrink-0 rounded-full p-[2px]" style={{ background: BOX_G }}>
                  <div className="relative w-16 h-16 rounded-full overflow-hidden">
                    <Image
                      src={v.photo}
                      alt={v.name}
                      fill
                      className="object-cover object-top"
                      sizes="64px"
                    />
                  </div>
                </div>

                <div className="min-w-0">
                  <p className="font-sans font-700 text-[14px] text-white truncate">{v.name}</p>
                  <p className="font-body text-[12px] text-white/40 truncate mt-0.5">{v.role}</p>
                </div>

                {/* Tag pill */}
                <div className="ml-auto flex-shrink-0">
                  <span
                    className="font-body text-[10px] tracking-[0.2em] uppercase px-3 py-1 rounded-full bg-clip-text text-transparent"
                    style={{
                      backgroundImage: BOX_G,
                      border: '1px solid rgba(124,58,237,0.3)',
                      background: 'rgba(124,58,237,0.1)',
                      WebkitBackgroundClip: 'unset',
                      WebkitTextFillColor: 'unset',
                      color: '#A78BFA',
                    }}
                  >
                    {v.tag}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
