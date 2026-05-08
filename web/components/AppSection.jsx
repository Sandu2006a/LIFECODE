'use client';

import { useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

const BOX_G = 'linear-gradient(135deg, #FF8A00 0%, #C62828 40%, #7C3AED 70%, #1D4ED8 100%)';
const MG    = 'linear-gradient(135deg, #FF8A00, #C62828)';
const RG    = 'linear-gradient(135deg, #7C3AED, #1D4ED8)';

const FEATURES = [
  {
    tag: '01',
    title: 'Understand why you felt worse today.',
    body: 'The AI cross-references your nutrition, training load, and sleep to explain performance dips — in plain language. No more guessing why yesterday felt hard.',
    gradient: MG,
  },
  {
    tag: '02',
    title: 'Progress streak. Built for consistency.',
    body: 'Every day on protocol is tracked. The streak system shows what sustained commitment does to your body over weeks — and keeps you accountable when motivation drops.',
    gradient: 'linear-gradient(135deg, #FF8A00, #7C3AED)',
  },
  {
    tag: '03',
    title: 'Real-time micro tracking.',
    body: 'See all 20+ compounds live. Not at the end of the day — right now, after every meal. You always know exactly where you stand.',
    gradient: RG,
  },
  {
    tag: '04',
    title: 'Become a stronger version of yourself.',
    body: 'Week over week, the system learns your patterns. The advice sharpens. The results compound. A new, more powerful version of you — built one day at a time.',
    gradient: BOX_G,
  },
];

export default function AppSection() {
  const sectionRef = useRef(null);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const ctx = gsap.context(() => {
      gsap.fromTo('.app-head',
        { opacity: 0, y: 24 },
        { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out', stagger: 0.07,
          scrollTrigger: { trigger: sectionRef.current, start: 'top 92%' } }
      );
      gsap.fromTo('.app-phone',
        { opacity: 0, y: 30, scale: 0.96 },
        { opacity: 1, y: 0, scale: 1, duration: 1, ease: 'power4.out',
          scrollTrigger: { trigger: sectionRef.current, start: 'top 88%' } }
      );
      gsap.fromTo('.app-feat',
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.5, ease: 'power3.out', stagger: 0.08,
          scrollTrigger: { trigger: '.app-feats', start: 'top 92%' } }
      );
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative overflow-hidden py-16 md:py-24 px-6 md:px-16"
      style={{ background: 'linear-gradient(160deg, #F8F5FF 0%, #ffffff 40%, #FFF9F5 100%)' }}
    >
      {/* Background glow */}
      <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[70vw] h-[70vh] opacity-[0.05]"
        style={{ background: BOX_G, filter: 'blur(120px)', borderRadius: '50%' }} />

      <div className="relative z-10 max-w-[1440px] mx-auto">

        {/* — Header — */}
        <div className="mb-12 md:mb-16 max-w-3xl">
          <div className="app-head flex items-center gap-3 mb-8 opacity-0">
            <div className="w-5 h-[1.5px]" style={{ background: BOX_G }} />
            <span className="font-body text-[14px] tracking-widest3 text-[#aaa] uppercase">Your AI Performance Coach</span>
          </div>

          <h2
            className="app-head font-sans font-700 text-[#111] leading-[0.88] tracking-tight mb-8 opacity-0"
            style={{ fontSize: 'clamp(2.8rem, 6vw, 7rem)' }}
          >
            The app that helps<br />
            <span className="bg-clip-text text-transparent" style={{ backgroundImage: BOX_G }}>
              you become superhuman.
            </span>
          </h2>

          <p className="app-head font-body font-300 text-[#888] text-base md:text-lg leading-loose max-w-xl opacity-0">
            Not just tracking. Intelligence. The app connects your protocol, your food, your training
            and your biology — and tells you exactly what&apos;s happening inside your body.
          </p>
        </div>

        {/* — Phone + Features grid — */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_420px_1fr] gap-10 lg:gap-8 items-start">

          {/* Left features */}
          <div className="app-feats flex flex-col gap-6">
            {FEATURES.slice(0, 2).map((f) => (
              <div
                key={f.tag}
                className="app-feat opacity-0"
                style={{ padding: '1.5px', borderRadius: '18px', background: f.gradient }}
              >
                <div className="bg-white h-full p-7 flex flex-col gap-4" style={{ borderRadius: '16.5px' }}>
                  <span
                    className="font-body text-[14px] tracking-widest3 uppercase bg-clip-text text-transparent"
                    style={{ backgroundImage: f.gradient }}
                  >
                    {f.tag}
                  </span>
                  <h3 className="font-sans font-700 text-[#111] text-xl tracking-tight leading-snug">
                    {f.title}
                  </h3>
                  <p className="font-body font-300 text-[#999] text-[17px] leading-loose">
                    {f.body}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Phone — center */}
          <div className="app-phone flex justify-center opacity-0">
            <div className="relative w-full max-w-[380px] mx-auto">
              <div className="absolute inset-[-12%] blur-3xl opacity-20 pointer-events-none rounded-full"
                style={{ background: BOX_G }} />
              <div style={{ padding: '2.5px', borderRadius: '38px', background: BOX_G }}>
                <div className="bg-white overflow-hidden" style={{ borderRadius: '35.5px' }}>
                  <Image
                    src="/PhoneApp.png"
                    alt="LIFECODE App"
                    width={760}
                    height={1080}
                    className="w-full h-auto object-contain"
                    loading="lazy"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Right features */}
          <div className="app-feats flex flex-col gap-6">
            {FEATURES.slice(2).map((f) => (
              <div
                key={f.tag}
                className="app-feat opacity-0"
                style={{ padding: '1.5px', borderRadius: '18px', background: f.gradient }}
              >
                <div className="bg-white h-full p-7 flex flex-col gap-4" style={{ borderRadius: '16.5px' }}>
                  <span
                    className="font-body text-[14px] tracking-widest3 uppercase bg-clip-text text-transparent"
                    style={{ backgroundImage: f.gradient }}
                  >
                    {f.tag}
                  </span>
                  <h3 className="font-sans font-700 text-[#111] text-xl tracking-tight leading-snug">
                    {f.title}
                  </h3>
                  <p className="font-body font-300 text-[#999] text-[17px] leading-loose">
                    {f.body}
                  </p>
                </div>
              </div>
            ))}

            {/* CTA under right features */}
            <div className="app-feat pt-4 opacity-0">
              <div className="inline-flex items-center gap-3 px-6 py-3.5 rounded-full border-2"
                style={{ borderColor: '#FF8A00', background: 'linear-gradient(135deg, #FFF9F5, #FAF7FF)' }}>
                <span className="w-2 h-2 rounded-full animate-pulse flex-shrink-0" style={{ background: '#FF8A00' }} />
                <span className="font-sans font-700 text-[13px] tracking-[0.18em] uppercase bg-clip-text text-transparent"
                  style={{ backgroundImage: BOX_G }}>
                  Coming Soon
                </span>
              </div>
              <p className="font-body text-[13px] text-[#bbb] tracking-wide mt-4">
                App launches with the product · iOS & Android
              </p>
              <Link href="/#preorder"
                className="inline-flex items-center gap-2 mt-3 font-body text-[12px] tracking-widest uppercase group"
                style={{ color: '#FF8A00' }}>
                Join the waitlist
                <span className="group-hover:translate-x-1 transition-transform duration-200">→</span>
              </Link>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
