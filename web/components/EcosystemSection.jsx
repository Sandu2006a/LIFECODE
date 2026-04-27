'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

const BOX_G = 'linear-gradient(135deg, #FF8A00 0%, #C62828 40%, #7C3AED 70%, #1D4ED8 100%)';

const FEATURES = [
  { title: 'AI tracking',          desc: 'Say what you ate. Get every micro and macro calculated instantly.' },
  { title: 'Smart reminders',      desc: 'Protocol timing built around your training schedule. Never miss a window.' },
  { title: 'Personalised advice',  desc: 'Recommendations built on your data — not generic templates.' },
];

export default function EcosystemSection() {
  const sectionRef = useRef(null);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const ctx = gsap.context(() => {
      gsap.fromTo('.eco-el',
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.55, ease: 'power3.out', stagger: 0.06,
          scrollTrigger: { trigger: sectionRef.current, start: 'top 92%' } }
      );
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="ecosystem"
      className="relative overflow-hidden py-32 md:py-44 px-6 md:px-16"
      style={{ background: 'linear-gradient(160deg, #FFF9F5 0%, #ffffff 45%, #F8F5FF 100%)' }}
    >
      {/* Decorative glow */}
      <div className="pointer-events-none absolute right-[-10%] top-1/2 -translate-y-1/2 w-[50vw] h-[80vh] opacity-[0.07]"
        style={{ background: BOX_G, filter: 'blur(100px)', borderRadius: '50%' }} />

      <div className="relative z-10 max-w-[1440px] mx-auto">

        {/* — App section — */}
        <div className="eco-el flex items-center gap-3 mb-10 opacity-0">
          <div className="w-5 h-[1.5px]" style={{ background: BOX_G }} />
          <span className="font-body text-[12px] tracking-widest3 text-[#999] uppercase">Your AI companion</span>
        </div>

        <h2
          className="eco-el font-sans font-700 leading-[0.9] tracking-tight mb-8 opacity-0 bg-clip-text text-transparent"
          style={{ fontSize: 'clamp(3rem, 8vw, 8rem)', backgroundImage: BOX_G }}
        >
          Your biology,<br />tracked.
        </h2>

        <p className="eco-el font-body font-300 text-[#888] text-base md:text-lg leading-loose max-w-lg mb-12 opacity-0">
          The app works alongside your protocol. Log meals, track every micronutrient in real time,
          and get daily advice based on your actual data — not guesswork.
        </p>

        {/* Feature bullets */}
        <div className="eco-el grid grid-cols-1 md:grid-cols-3 gap-5 mb-16 opacity-0">
          {FEATURES.map((f, i) => (
            <div key={f.title} style={{ padding: '1.5px', borderRadius: '16px', background: BOX_G }}>
              <div className="bg-white h-full p-7" style={{ borderRadius: '14.5px' }}>
                <span
                  className="font-body text-[12px] tracking-widest3 uppercase block mb-4 bg-clip-text text-transparent"
                  style={{ backgroundImage: BOX_G }}
                >
                  0{i + 1}
                </span>
                <h3 className="font-sans font-700 text-[#222] text-base tracking-tight mb-2">{f.title}</h3>
                <p className="font-body font-300 text-[#999] text-base leading-loose">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Divider */}
        <div className="eco-el w-full h-px mb-16 opacity-0"
          style={{ background: 'linear-gradient(90deg, transparent, #ede0e0 30%, #ede0e0 70%, transparent)' }} />

        {/* — Final CTA — */}
        <div className="eco-el opacity-0">
          <h3
            className="font-sans font-700 text-[#111] tracking-tight leading-[0.92] mb-8"
            style={{ fontSize: 'clamp(2rem, 4.5vw, 4.5rem)' }}
          >
            Ready to stop guessing?
          </h3>
        </div>

        <div className="eco-el flex flex-col sm:flex-row items-start sm:items-center gap-6 opacity-0">
          <Link
            href="/pricing"
            className="inline-flex items-center gap-4 px-10 py-4 rounded-full text-white font-sans font-600 text-sm tracking-widest uppercase hover:opacity-88 transition-opacity duration-300 group"
            style={{ background: BOX_G }}
          >
            <span>Start your protocol</span>
            <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center group-hover:translate-x-1 transition-transform duration-300">
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                <path d="M2 5h6M5.5 2.5L8 5l-2.5 2.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </span>
          </Link>
          <span className="font-body text-sm text-[#bbb] tracking-widest">Free to create · Adjust anytime</span>
        </div>

      </div>
    </section>
  );
}
