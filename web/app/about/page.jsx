'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Header from '@/components/Header';

const BOX_G = 'linear-gradient(135deg, #FF8A00 0%, #C62828 40%, #7C3AED 70%, #1D4ED8 100%)';
const ORANGE = '#FF8A00';
const VIOLET = '#7C3AED';
const NAVY   = '#1D4ED8';

// Dark navy text (replaces bordo)
const INK    = '#0F0A2A';
const INK2   = '#4A4570';
const BORDER = '#E0DCF0';
const CARD_BG = '#F5F3FF';

function GradientText({ children, className = '' }) {
  return (
    <span className={`inline-block ${className}`}
      style={{ color: '#6D28D9' }}>
      {children}
    </span>
  );
}

function Eyebrow({ children }) {
  return (
    <div className="inline-flex items-center gap-3 mb-6">
      <span className="h-px w-8 flex-shrink-0" style={{ background: BOX_G }} />
      <span className="font-body text-[11px] tracking-[0.32em] uppercase"
        style={{ color: '#6D28D9' }}>
        {children}
      </span>
    </div>
  );
}

const PRINCIPLES = [
  { num: '01', text: 'Clinical doses, every time.' },
  { num: '02', text: 'No proprietary blends. Ever.' },
  { num: '03', text: 'No artificial sweeteners. No exceptions.' },
  { num: '04', text: 'Premium forms only — methylated B-vitamins, bisglycinate minerals, MK-7, free-form EAAs.' },
  { num: '05', text: "If we wouldn't take it ourselves, we don't sell it." },
];

const PHASES = [
  { name: 'Morning Pak',       desc: 'Sets the day. Clinically dosed vitamins, minerals, and methylated B-complex for performance and immune function.', color: ORANGE },
  { name: 'Anabolic Recovery', desc: 'Rebuilds it. EAAs, creatine, HMB, tart cherry — everything the body needs post-training.', color: VIOLET },
];

const LIES = [
  { num: '01', title: 'Underdosing',           body: 'Active ingredients at 5–10% of the effective dose — enough to list on the label, not enough to do anything.' },
  { num: '02', title: 'Proprietary blends',    body: "A branded blend name instead of ingredient amounts. Hiding what's actually in there — and how little." },
  { num: '03', title: 'Artificial sweeteners', body: 'Sucralose, acesulfame-K, aspartame. In products that charge premium prices. On top of everything else.' },
];

const WHO = [
  'Trains like a professional.',
  "Doesn't get paid like one.",
  'Reads the label.',
  "Won't settle for a green powder with a celebrity on it.",
  'Demands clinical doses. Every time.',
];

export default function AboutPage() {
  const heroRef = useRef(null);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    const heroEls = heroRef.current?.querySelectorAll('[data-h]');
    if (heroEls?.length) {
      gsap.fromTo(heroEls,
        { opacity: 0, y: 44 },
        { opacity: 1, y: 0, duration: 1.1, ease: 'power3.out', stagger: 0.14, delay: 0.35 }
      );
    }

    document.querySelectorAll('[data-s]').forEach(el => {
      gsap.fromTo(el,
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.85, ease: 'power3.out',
          scrollTrigger: { trigger: el, start: 'top 84%', once: true } }
      );
    });

    return () => ScrollTrigger.getAll().forEach(t => t.kill());
  }, []);

  return (
    <>
      <Header />

      <main className="overflow-x-hidden" style={{ background: '#FAFAFA', color: INK }}>

        {/* ─── HERO ─────────────────────────────────────────────── */}
        <section ref={heroRef} className="pt-48 pb-16 px-8 md:px-16 max-w-[1200px] mx-auto">
          <div data-h><Eyebrow>Our Story</Eyebrow></div>

          <h1 data-h
            className="font-sans font-700 text-[56px] md:text-[72px] lg:text-[86px] leading-[0.93] tracking-[-0.02em]"
            style={{ color: INK }}>
            We didn't<br />start a<br />
            <GradientText>supplement<br />company.</GradientText>
          </h1>

          <p data-h className="mt-10 font-body text-[22px] md:text-[28px] max-w-lg leading-snug"
            style={{ color: INK2 }}>
            We solved our own problem.
          </p>

          <div data-h className="mt-20 flex items-center gap-3" style={{ color: `${INK2}60` }}>
            <span className="font-body text-[11px] tracking-[0.25em] uppercase">Scroll</span>
            <span className="h-px w-16" style={{ background: BOX_G }} />
          </div>
        </section>

        <div className="h-px" style={{ background: BOX_G }} />

        {/* ─── THE PROBLEM ──────────────────────────────────────── */}
        <section className="py-16 px-8 md:px-16 max-w-[1200px] mx-auto">
          <div className="grid md:grid-cols-2 gap-10 lg:gap-16 items-start">

            <div data-s>
              <Eyebrow>The Problem</Eyebrow>
              <h2 className="font-sans font-700 text-[38px] md:text-[50px] leading-[1.05] mb-10" style={{ color: INK }}>
                A kitchen counter<br />that looked like<br />a pharmacy.
              </h2>
              <div className="rounded-3xl p-8 inline-block" style={{ background: CARD_BG, border: `1px solid ${BORDER}` }}>
                <span className="font-sans font-700 text-[64px] leading-none block"
                  style={{ color: '#6D28D9' }}>
                  €300
                </span>
                <span className="font-body text-[13px] tracking-wide mt-1 block" style={{ color: INK2 }}>
                  per month — five, six, sometimes eight products
                </span>
              </div>
            </div>

            <div data-s className="space-y-6 pt-4 md:pt-20">
              {[
                "We're athletes. We train hard, we recover hard, and for years we did what every serious amateur ends up doing — we built a daily supplement stack out of five, six, sometimes eight different products, just to cover what our bodies actually needed.",
                "A multivitamin in the morning. A separate magnesium because the multi was underdosed. A pre-workout loaded with proprietary blends that wouldn't tell us what was actually in there. An EAA tub. A creatine bag. A recovery shake we couldn't pronounce.",
                "Three hundred euros a month, a kitchen counter that looked like a pharmacy, and the constant suspicion that half of it wasn't doing what the label said.",
                "So we did what athletes do when something isn't working — we went to the source.",
              ].map((t, i) => (
                <p key={i} className="font-body text-[17px] leading-relaxed" style={{ color: INK2 }}>{t}</p>
              ))}
            </div>
          </div>
        </section>

        {/* ─── PULLED QUOTE ─────────────────────────────────────── */}
        <section className="py-14 px-8 md:px-16" style={{ background: CARD_BG, borderTop: `1px solid ${BORDER}`, borderBottom: `1px solid ${BORDER}` }}>
          <div className="max-w-[1200px] mx-auto">
            <p data-s className="font-sans font-700 text-[26px] md:text-[40px] lg:text-[52px] leading-[1.1] max-w-5xl" style={{ color: INK }}>
              "We spent years reading peer-reviewed journals, studying EFSA dossiers, learning the difference between{' '}
              <GradientText>zinc bisglycinate and zinc oxide.</GradientText>{' '}
              We talked to formulators. We audited manufacturers."
            </p>
            <p data-s className="mt-8 font-body text-[15px] tracking-wide max-w-xl" style={{ color: INK2 }}>
              We compared sourcing standards across continents. And what we found changed everything.
            </p>
          </div>
        </section>

        {/* ─── THREE LIES ───────────────────────────────────────── */}
        <section className="py-16 px-8 md:px-16 max-w-[1200px] mx-auto">
          <div data-s className="mb-10">
            <Eyebrow>What We Found</Eyebrow>
            <h2 className="font-sans font-700 text-[36px] md:text-[54px] leading-[1.05]" style={{ color: INK }}>
              The supplement industry<br />is built on{' '}
              <GradientText>three quiet lies.</GradientText>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-5 mb-14">
            {LIES.map(({ num, title, body }) => (
              <div key={num} data-s
                className="rounded-3xl p-9 transition-all duration-300 hover:shadow-xl"
                style={{ background: CARD_BG, border: `1px solid ${BORDER}` }}>
                <GradientText className="font-sans font-700 text-[11px] tracking-[0.3em] block mb-5">{num}</GradientText>
                <h3 className="font-sans font-700 text-[26px] mb-4 leading-tight"
                  style={{ color: '#6D28D9' }}>
                  {title}
                </h3>
                <p className="font-body text-[15px] leading-relaxed" style={{ color: INK2 }}>{body}</p>
              </div>
            ))}
          </div>

          <p data-s className="font-body text-[18px] max-w-2xl leading-relaxed" style={{ color: INK2 }}>
            The brands that don't lie cost €60–90 a product — and you still need four of them to run a real protocol.{' '}
            <span className="font-700" style={{ color: '#6D28D9' }}>
              So we stopped looking. We built it ourselves.
            </span>
          </p>
        </section>

        {/* ─── THE SYSTEM ───────────────────────────────────────── */}
        <section className="py-16 px-8 md:px-16" style={{ background: '#0B0A1A' }}>
          <div className="max-w-[1200px] mx-auto">
            <div data-s className="mb-10">
              <div className="inline-flex items-center gap-3 mb-6">
                <span className="h-px w-8" style={{ background: BOX_G }} />
                <span className="font-body text-[11px] tracking-[0.32em] uppercase"
                  style={{ color: '#6D28D9' }}>
                  Where We Start
                </span>
              </div>
              <h2 className="font-sans font-700 text-[36px] md:text-[54px] leading-[1.05] text-white max-w-2xl">
                A complete daily<br />performance system.<br />
                <GradientText>Two phases. Launched.</GradientText>
              </h2>
              <p className="mt-6 font-body text-[17px] max-w-lg leading-relaxed" style={{ color: 'rgba(255,255,255,0.45)' }}>
                Each phase is a single stick. Clinically dosed, naturally sweetened, fully transparent. The work of an eight-product stack — in two sticks.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6 max-w-3xl">
              {PHASES.map(({ name, desc, color }) => (
                <div key={name} data-s
                  className="rounded-3xl p-9 border transition-all duration-300 hover:scale-[1.02]"
                  style={{ background: `${color}0D`, borderColor: `${color}30` }}>
                  <span
                    className="font-body text-[10px] tracking-[0.28em] uppercase px-3 py-1.5 rounded-full inline-block mb-6 font-700"
                    style={{ color, background: `${color}20` }}>
                    Coming Soon
                  </span>
                  <h3 className="font-sans font-700 text-[24px] text-white mb-3 leading-tight">{name}</h3>
                  <p className="font-body text-[14px] leading-relaxed" style={{ color: 'rgba(255,255,255,0.45)' }}>{desc}</p>
                </div>
              ))}
            </div>

            <p data-s className="mt-12 font-body text-[15px] max-w-xl leading-relaxed" style={{ color: 'rgba(255,255,255,0.3)' }}>
              Pre-Workout and Endurance follow. We'd rather build the system properly, one phase at a time, than ship a compromised version of the whole thing.
            </p>
          </div>
        </section>

        {/* ─── MANIFESTO ────────────────────────────────────────── */}
        <section className="py-16 px-8 md:px-16 max-w-[1200px] mx-auto">
          <div data-s className="mb-10">
            <Eyebrow>What We Stand For</Eyebrow>
            <h2 className="font-sans font-700 text-[36px] md:text-[54px] leading-[1.05]" style={{ color: INK }}>
              Five things<br />
              <GradientText>we never compromise on.</GradientText>
            </h2>
          </div>

          <div>
            {PRINCIPLES.map(({ num, text }, i) => (
              <div key={num} data-s
                className="flex items-start gap-8 md:gap-14 py-8 group cursor-default"
                style={{ borderBottom: i < PRINCIPLES.length - 1 ? `1px solid ${BORDER}` : 'none' }}>
                <GradientText className="font-sans font-700 text-[11px] tracking-[0.28em] mt-2 flex-shrink-0 opacity-50 group-hover:opacity-100 transition-opacity duration-300">
                  {num}
                </GradientText>
                <p className="font-sans font-700 text-[22px] md:text-[30px] leading-tight transition-all duration-300"
                  style={{ color: INK }}
                  onMouseEnter={e => { e.currentTarget.style.backgroundImage = BOX_G; e.currentTarget.style.webkitBackgroundClip = 'text'; e.currentTarget.style.webkitTextFillColor = 'transparent'; }}
                  onMouseLeave={e => { e.currentTarget.style.backgroundImage = ''; e.currentTarget.style.webkitBackgroundClip = ''; e.currentTarget.style.webkitTextFillColor = ''; }}>
                  {text}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* ─── WHO THIS IS FOR ──────────────────────────────────── */}
        <section className="py-16 px-8 md:px-16" style={{ background: CARD_BG, borderTop: `1px solid ${BORDER}`, borderBottom: `1px solid ${BORDER}` }}>
          <div className="max-w-[1200px] mx-auto grid md:grid-cols-2 gap-10 lg:gap-16 items-center">
            <div data-s>
              <Eyebrow>Who This Is Built For</Eyebrow>
              <h2 className="font-sans font-700 text-[40px] md:text-[56px] leading-[1.0] mb-8" style={{ color: INK }}>
                The <GradientText>serious</GradientText><br />amateur.
              </h2>
              <p className="font-body text-[17px] leading-relaxed max-w-md mb-5" style={{ color: INK2 }}>
                The lifter, the runner, the cyclist, the fighter, the early-morning lap swimmer with a real job and a real family. The high-performer who treats nutrition as part of the work.
              </p>
              <p className="font-body text-[17px] leading-relaxed max-w-md" style={{ color: INK2 }}>
                If you're looking for a green powder with a celebrity on the label, you're in the wrong place.
              </p>
            </div>

            <div data-s>
              {WHO.map((line, i) => (
                <div key={i} className="flex items-center gap-5 py-5"
                  style={{ borderBottom: i < WHO.length - 1 ? `1px solid ${BORDER}` : 'none' }}>
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: BOX_G }} />
                  <p className="font-sans font-700 text-[18px] md:text-[20px]" style={{ color: INK }}>{line}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── THE LINE WE DREW ─────────────────────────────────── */}
        <section className="py-16 px-8 md:px-16 max-w-[1200px] mx-auto">
          <div data-s className="max-w-3xl mb-10">
            <Eyebrow>The Line We Drew</Eyebrow>
            <h2 className="font-sans font-700 text-[32px] md:text-[48px] leading-[1.1] mb-8" style={{ color: INK }}>
              We exist against underdosing. Against hidden blends.{' '}
              <GradientText>Against sucralose in products that charge premium prices.</GradientText>
            </h2>
            <p className="font-body text-[17px] leading-relaxed" style={{ color: INK2 }}>
              Against the assumption that athletes won't read the label. If you train seriously, you deserve a supplement system that does the same.
            </p>
          </div>

          {/* CTA */}
          <div data-s className="pt-16" style={{ borderTop: `1px solid ${BORDER}` }}>
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-10">
              <div>
                <Eyebrow>Ready to start?</Eyebrow>
                <h3 className="font-sans font-700 text-[30px] md:text-[38px] leading-tight" style={{ color: INK }}>
                  Build your protocol.
                </h3>
              </div>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/pricing"
                  className="inline-flex items-center justify-center px-9 py-4 rounded-full text-white font-body text-[13px] tracking-[0.2em] uppercase transition-all duration-300 hover:opacity-85"
                  style={{ background: BOX_G }}>
                  Get Started
                </Link>
                <Link href="/#morning"
                  className="inline-flex items-center justify-center px-9 py-4 rounded-full font-body text-[13px] tracking-[0.2em] uppercase transition-all duration-300 hover:opacity-70"
                  style={{ border: `1px solid ${BORDER}`, color: INK2 }}>
                  See Products
                </Link>
              </div>
            </div>
          </div>
        </section>

      </main>
    </>
  );
}
