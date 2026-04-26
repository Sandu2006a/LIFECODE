'use client';

import { useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { gsap } from 'gsap';

const BOX_G  = 'linear-gradient(135deg, #FF8A00 0%, #C62828 40%, #7C3AED 70%, #1D4ED8 100%)';
const MG     = 'linear-gradient(135deg, #FFD54F 0%, #FF8A00 50%, #C62828 100%)';
const RG     = 'linear-gradient(135deg, #7C3AED 0%, #5B21B6 50%, #1D4ED8 100%)';

const PLANS = [
  {
    id: 'try',
    badge: '01',
    name: 'One Month Try',
    tagline: 'No commitment. Just results.',
    price: null,
    gradient: MG,
    accentBg: '#FFFBF0',
    featured: false,
    image: '/Cutii.png',
    description: 'Experience the full LIFECODE system for one month — no subscription, no lock-in. One complete cycle of Morning Pack and Recovery Mix, exactly as prescribed.',
    features: [
      'Morning Pack × 1 (30 servings)',
      'Recovery Mix × 1 (30 servings)',
      'AI Dashboard — 30 days',
      'Personalized protocol on signup',
      'No subscription required',
    ],
    cta: 'Start Trial',
    note: 'One-time purchase',
  },
  {
    id: 'essentials',
    badge: '02',
    name: 'Essentials',
    tagline: 'Change your biology.',
    price: null,
    gradient: BOX_G,
    accentBg: '#FFF8F5',
    featured: false,
    image: null,
    description: 'Three months of precision nutrition designed to build lasting habits and measurable results. The entry point for athletes who are serious about performance.',
    features: [
      'Morning Pack × 3 (90 servings)',
      'Recovery Mix × 3 (90 servings)',
      'AI Dashboard — 3 months',
      'Meal & micronutrient logging',
      'Progress analytics',
      'Protocol adjustment at 6 weeks',
    ],
    cta: 'Get Essentials',
    note: 'Best for beginners',
  },
  {
    id: 'protocol',
    badge: '03',
    name: 'Protocol',
    tagline: 'Built for serious athletes.',
    price: null,
    gradient: RG,
    accentBg: '#F8F5FF',
    featured: true,
    image: null,
    description: 'Six months of continuous optimization. The Protocol tier includes everything in Essentials plus monthly AI performance reviews and priority coaching access.',
    features: [
      'Morning Pack × 6 (180 servings)',
      'Recovery Mix × 6 (180 servings)',
      'AI Dashboard — 6 months',
      'Monthly AI performance review',
      'Workout + nutrition sync',
      'Long-term memory AI coach',
      'Priority email support',
    ],
    cta: 'Start Protocol',
    note: 'Most popular',
  },
  {
    id: 'elite',
    badge: '04',
    name: 'Elite',
    tagline: 'Complete athletic optimization.',
    price: null,
    gradient: BOX_G,
    accentBg: '#FFF5F8',
    featured: false,
    image: null,
    description: 'The complete system. Elite adds full biomarker bloodwork analysis, personalized protocol calibration from real lab data, and a direct nutritionist consultation.',
    features: [
      'Everything in Protocol',
      'Full bloodwork panel (home kit)',
      'Biomarker tracking dashboard',
      'Custom protocol from lab results',
      '1-on-1 nutritionist consultation (60 min)',
      'Quarterly protocol recalibration',
      'Dedicated athlete support',
    ],
    cta: 'Go Elite',
    note: 'Full optimization',
  },
];

function CheckIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
      <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

export default function PricingPage() {
  const pageRef = useRef(null);

  useEffect(() => {
    if (!pageRef.current) return;
    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
    tl.fromTo('.pr-head', { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.7, stagger: 0.08 })
      .fromTo('.pr-card', { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 0.6, stagger: 0.1 }, '-=0.3');
  }, []);

  return (
    <div ref={pageRef} className="min-h-screen bg-white font-body">

      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 md:px-16 py-5 border-b border-[#f0f0f0] bg-white/95 backdrop-blur-md">
        <Link href="/" className="flex items-center gap-3 text-[#888] hover:text-[#333] transition-colors duration-300">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5"/><path d="M12 19l-7-7 7-7"/>
          </svg>
          <span className="font-body text-xs tracking-widest uppercase">Back</span>
        </Link>
        <Link href="/"
          className="font-sans font-700 text-sm tracking-[0.3em] uppercase select-none bg-clip-text text-transparent"
          style={{ backgroundImage: BOX_G }}>
          LIFECODE
        </Link>
        <Link href="/login" className="font-body text-[10px] tracking-widest text-[#888] hover:text-[#333] transition-colors duration-300 uppercase">
          Log In
        </Link>
      </nav>

      <main className="pt-32 pb-24 px-6 md:px-16 max-w-[1440px] mx-auto">

        {/* Header */}
        <div className="text-center mb-16 md:mb-20">
          <div className="pr-head flex items-center justify-center gap-3 mb-6" style={{ opacity: 0 }}>
            <div className="w-5 h-[1.5px]" style={{ background: BOX_G }} />
            <span className="font-body text-[9px] tracking-widest3 text-[#aaa] uppercase">Choose Your Protocol</span>
            <div className="w-5 h-[1.5px]" style={{ background: BOX_G }} />
          </div>
          <h1
            className="pr-head font-sans font-700 leading-[0.9] tracking-tight bg-clip-text text-transparent mb-5"
            style={{ fontSize: 'clamp(2.8rem, 6vw, 6rem)', backgroundImage: BOX_G, opacity: 0 }}>
            Your system.<br />Your terms.
          </h1>
          <p className="pr-head font-body font-300 text-[#999] text-sm md:text-base leading-loose max-w-md mx-auto" style={{ opacity: 0 }}>
            Every plan includes precision-dosed Morning and Recovery formulas. No fillers, no compromises — just clinical-grade nutrition built around your biology.
          </p>
          <p className="pr-head font-body text-[10px] tracking-widest text-[#ccc] uppercase mt-5" style={{ opacity: 0 }}>
            Prices coming soon — join the waitlist free
          </p>
        </div>

        {/* Cards grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
          {PLANS.map((plan) => (
            <div
              key={plan.id}
              className="pr-card relative flex flex-col"
              style={{
                opacity: 0,
                padding: plan.featured ? '2px' : '1px',
                borderRadius: '24px',
                background: plan.featured ? plan.gradient : '#ebebeb',
              }}
            >
              {plan.featured && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                  <span
                    className="font-body text-[8px] tracking-widest2 uppercase text-white px-3 py-1 rounded-full"
                    style={{ background: plan.gradient }}>
                    Most Popular
                  </span>
                </div>
              )}

              <div className="flex-1 flex flex-col bg-white rounded-[22px] overflow-hidden">

                {/* Gradient top line */}
                <div className="h-[3px] w-full" style={{ background: plan.gradient }} />

                {/* Card header */}
                <div className="px-6 pt-6 pb-5" style={{ background: plan.accentBg }}>
                  <div className="flex items-start justify-between mb-3">
                    <span
                      className="font-body text-[8px] tracking-widest3 uppercase bg-clip-text text-transparent"
                      style={{ backgroundImage: plan.gradient }}>
                      {plan.badge}
                    </span>
                    {plan.note && (
                      <span className="font-body text-[7.5px] tracking-widest uppercase text-[#bbb]">
                        {plan.note}
                      </span>
                    )}
                  </div>
                  <h2 className="font-sans font-700 text-[#111] text-xl tracking-tight leading-tight mb-1">
                    {plan.name}
                  </h2>
                  <p className="font-body text-[10px] tracking-widest uppercase bg-clip-text text-transparent"
                    style={{ backgroundImage: plan.gradient }}>
                    {plan.tagline}
                  </p>

                  {/* Price placeholder */}
                  <div className="mt-5 flex items-baseline gap-1">
                    <span className="font-sans font-700 text-3xl text-[#e0e0e0] tracking-tight">—</span>
                    <span className="font-body text-[10px] text-[#ddd] tracking-widest uppercase">/ mo</span>
                  </div>
                </div>

                {/* Product image for trial */}
                {plan.image && (
                  <div className="px-6 py-4 border-t border-[#f5f5f5] flex items-center justify-center"
                    style={{ background: plan.accentBg }}>
                    <Image
                      src={plan.image}
                      alt={plan.name}
                      width={280}
                      height={180}
                      className="w-full max-w-[220px] h-auto object-contain"
                    />
                  </div>
                )}

                {/* Description */}
                <div className="px-6 py-5 border-t border-[#f5f5f5]">
                  <p className="font-body font-300 text-[#888] text-sm leading-loose">
                    {plan.description}
                  </p>
                </div>

                {/* Features */}
                <div className="px-6 pb-5 flex-1">
                  <p className="font-body text-[8.5px] tracking-widest2 uppercase text-[#bbb] mb-3">What's included</p>
                  <ul className="space-y-2.5">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-2.5">
                        <span
                          className="flex-shrink-0 mt-0.5 bg-clip-text text-transparent"
                          style={{ color: 'transparent' }}>
                          <span className="block bg-clip-text text-transparent" style={{ backgroundImage: plan.gradient }}>
                            <CheckIcon />
                          </span>
                        </span>
                        <span className="font-body text-[11px] text-[#666] leading-snug">{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* CTA */}
                <div className="px-6 pb-6 pt-2">
                  <Link
                    href="/ecosystem"
                    className="group w-full inline-flex items-center justify-center gap-3 px-6 py-3.5 rounded-full text-white font-sans font-600 text-[11px] tracking-widest uppercase hover:opacity-88 transition-opacity duration-300"
                    style={{ background: plan.gradient }}>
                    <span>{plan.cta}</span>
                    <span className="w-4 h-4 rounded-full bg-white/20 flex items-center justify-center group-hover:translate-x-0.5 transition-transform duration-300">
                      <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                        <path d="M1.5 4h5M4 2L6 4l-2 2" stroke="white" strokeWidth="1.2" strokeLinecap="round"/>
                      </svg>
                    </span>
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom note */}
        <div className="mt-16 text-center space-y-3">
          <p className="font-body text-[10px] tracking-widest text-[#ccc] uppercase">
            All plans include free shipping · 30-day satisfaction guarantee · Cancel anytime
          </p>
          <p className="font-body text-[11px] text-[#bbb]">
            Questions?{' '}
            <a href="mailto:hello@lifecode.com" className="text-[#999] hover:text-[#444] transition-colors duration-200 underline underline-offset-2">
              hello@lifecode.com
            </a>
          </p>
        </div>

      </main>
    </div>
  );
}
