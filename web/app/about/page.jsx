'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Header from '@/components/Header';

const BOX_G = 'linear-gradient(135deg, #FF8A00 0%, #C62828 40%, #7C3AED 70%, #1D4ED8 100%)';

function GradientText({ children, className = '' }) {
  return (
    <span
      className={`bg-clip-text text-transparent inline-block ${className}`}
      style={{ backgroundImage: BOX_G }}
    >
      {children}
    </span>
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
  { name: 'Morning Pak',        status: 'live', desc: 'Sets the day. Clinically dosed vitamins, minerals, and methylated B-complex for performance and immune function.' },
  { name: 'Anabolic Recovery',  status: 'live', desc: 'Rebuilds it. EAAs, creatine, HMB, tart cherry — everything the body needs post-training.' },
  { name: 'Pre-Workout',        status: 'soon', desc: 'Coming next. Science-backed focus and power output, without the crash.' },
  { name: 'Endurance Gel',      status: 'soon', desc: 'Coming next. Sustained energy for long efforts, transparently dosed.' },
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

function Eyebrow({ children }) {
  return (
    <div className="inline-flex items-center gap-3 mb-6">
      <span className="h-px w-8 flex-shrink-0" style={{ background: BOX_G }} />
      <span
        className="font-body text-[11px] tracking-[0.32em] uppercase bg-clip-text text-transparent"
        style={{ backgroundImage: BOX_G }}
      >
        {children}
      </span>
    </div>
  );
}

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

      <main className="bg-lc-white text-lc-maroon overflow-x-hidden">

        {/* ─── HERO ────────────────────────────────────────────── */}
        <section ref={heroRef} className="pt-44 pb-28 px-8 md:px-16 max-w-[1440px] mx-auto">
          <div data-h>
            <Eyebrow>Our Story</Eyebrow>
          </div>

          <h1 data-h className="font-sans font-700 text-[56px] md:text-[86px] lg:text-[108px] leading-[0.93] tracking-[-0.02em]">
            <span className="text-lc-maroon">We didn't<br />start a<br /></span>
            <GradientText>supplement<br />company.</GradientText>
          </h1>

          <p data-h className="mt-10 font-body text-[22px] md:text-[28px] text-lc-maroon-dim max-w-lg leading-snug">
            We solved our own problem.
          </p>

          <div data-h className="mt-20 flex items-center gap-3 text-lc-maroon-dim/40">
            <span className="font-body text-[11px] tracking-[0.25em] uppercase">Scroll</span>
            <span className="h-px w-16" style={{ background: BOX_G }} />
          </div>
        </section>

        <div className="h-px" style={{ background: BOX_G }} />

        {/* ─── THE PROBLEM ─────────────────────────────────────── */}
        <section className="py-28 px-8 md:px-16 max-w-[1440px] mx-auto">
          <div className="grid md:grid-cols-2 gap-16 lg:gap-24 items-start">

            <div data-s>
              <Eyebrow>The Problem</Eyebrow>
              <h2 className="font-sans font-700 text-[38px] md:text-[50px] leading-[1.05] text-lc-maroon mb-10">
                A kitchen counter<br />that looked like<br />a pharmacy.
              </h2>
              <div className="rounded-3xl p-8 inline-block border border-lc-line-light"
                style={{ background: 'linear-gradient(135deg,#FFF3EC 0%,#FFE5D0 100%)' }}>
                <span className="font-sans font-700 text-[64px] leading-none block bg-clip-text text-transparent"
                  style={{ backgroundImage: BOX_G }}>
                  €300
                </span>
                <span className="font-body text-[13px] text-lc-maroon-dim tracking-wide mt-1 block">
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
                <p key={i} className="font-body text-[17px] text-lc-maroon-dim leading-relaxed">{t}</p>
              ))}
            </div>
          </div>
        </section>

        {/* ─── PULLED QUOTE ────────────────────────────────────── */}
        <section className="py-24 px-8 md:px-16 border-y border-lc-line-light"
          style={{ background: 'linear-gradient(135deg,#FFF8F5 0%,#F8F5FF 50%,#F5F8FF 100%)' }}>
          <div className="max-w-[1440px] mx-auto">
            <p data-s className="font-sans font-700 text-[26px] md:text-[40px] lg:text-[52px] leading-[1.1] text-lc-maroon max-w-5xl">
              "We spent years reading peer-reviewed journals, studying EFSA dossiers, learning the difference between{' '}
              <GradientText>zinc bisglycinate and zinc oxide.</GradientText>{' '}
              We talked to formulators. We audited manufacturers."
            </p>
            <p data-s className="mt-8 font-body text-[15px] text-lc-maroon-dim tracking-wide max-w-xl">
              We compared sourcing standards across continents. And what we found changed everything.
            </p>
          </div>
        </section>

        {/* ─── THREE LIES ──────────────────────────────────────── */}
        <section className="py-28 px-8 md:px-16 max-w-[1440px] mx-auto">
          <div data-s className="mb-16">
            <Eyebrow>What We Found</Eyebrow>
            <h2 className="font-sans font-700 text-[36px] md:text-[54px] leading-[1.05] text-lc-maroon">
              The supplement industry<br />is built on{' '}
              <GradientText>three quiet lies.</GradientText>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-5 mb-14">
            {LIES.map(({ num, title, body }) => (
              <div key={num} data-s
                className="rounded-3xl border border-lc-line-light p-9 group hover:shadow-lg transition-all duration-300"
                style={{ '--hover-border': 'transparent' }}
                onMouseEnter={e => e.currentTarget.style.borderColor = 'transparent'}
                onMouseLeave={e => e.currentTarget.style.borderColor = ''}
              >
                <GradientText className="font-sans font-700 text-[11px] tracking-[0.3em] block mb-5">{num}</GradientText>
                <h3 className="font-sans font-700 text-[26px] text-lc-maroon mb-4 leading-tight bg-clip-text text-transparent"
                  style={{ backgroundImage: BOX_G }}>
                  {title}
                </h3>
                <p className="font-body text-[15px] text-lc-maroon-dim leading-relaxed">{body}</p>
              </div>
            ))}
          </div>

          <p data-s className="font-body text-[18px] text-lc-maroon-dim max-w-2xl leading-relaxed">
            The brands that don't lie cost €60–90 a product — and you still need four of them to run a real protocol.{' '}
            <span className="font-700 bg-clip-text text-transparent" style={{ backgroundImage: BOX_G }}>
              So we stopped looking. We built it ourselves.
            </span>
          </p>
        </section>

        {/* ─── THE SYSTEM ──────────────────────────────────────── */}
        <section className="py-28 px-8 md:px-16" style={{ background: '#0D0D0F' }}>
          <div className="max-w-[1440px] mx-auto">
            <div data-s className="mb-16">
              <div className="inline-flex items-center gap-3 mb-6">
                <span className="h-px w-8" style={{ background: BOX_G }} />
                <span className="font-body text-[11px] tracking-[0.32em] uppercase bg-clip-text text-transparent"
                  style={{ backgroundImage: BOX_G }}>
                  Where We Start
                </span>
              </div>
              <h2 className="font-sans font-700 text-[36px] md:text-[54px] leading-[1.05] text-white max-w-2xl">
                A complete daily<br />performance system<br />
                <GradientText>across four phases.</GradientText>
              </h2>
              <p className="mt-6 font-body text-[17px] text-white/50 max-w-lg leading-relaxed">
                Each phase is a single stick. Clinically dosed, naturally sweetened, fully transparent. The work of an eight-product stack — in four sticks.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              {PHASES.map(({ name, status, desc }, i) => (
                <div key={name} data-s
                  className={`rounded-3xl p-8 border transition-all duration-300
                    ${status === 'live'
                      ? 'border-white/10 bg-white/[0.06] hover:bg-white/10'
                      : 'border-white/5 bg-white/[0.02] opacity-40'}`}
                >
                  <span
                    className="font-body text-[10px] tracking-[0.28em] uppercase px-3 py-1.5 rounded-full inline-block mb-6 bg-clip-text text-transparent"
                    style={{ backgroundImage: status === 'live' ? BOX_G : 'linear-gradient(90deg,#888,#666)', border: '1px solid rgba(255,255,255,0.1)' }}
                  >
                    {status === 'live' ? 'Available Now' : 'Coming Soon'}
                  </span>
                  <h3 className="font-sans font-700 text-[22px] text-white mb-3 leading-tight">{name}</h3>
                  <p className="font-body text-[14px] text-white/40 leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>

            <p data-s className="mt-12 font-body text-[15px] text-white/35 max-w-xl leading-relaxed">
              We're not launching with a hero product. The body doesn't work in heroes. It works in phases — and we'd rather build the system properly, one phase at a time, than ship a compromised version of the whole thing.
            </p>
          </div>
        </section>

        {/* ─── MANIFESTO ───────────────────────────────────────── */}
        <section className="py-28 px-8 md:px-16 max-w-[1440px] mx-auto">
          <div data-s className="mb-16">
            <Eyebrow>What We Stand For</Eyebrow>
            <h2 className="font-sans font-700 text-[36px] md:text-[54px] leading-[1.05] text-lc-maroon">
              Five things<br />
              <GradientText>we never compromise on.</GradientText>
            </h2>
          </div>

          <div>
            {PRINCIPLES.map(({ num, text }, i) => (
              <div key={num} data-s
                className={`flex items-start gap-8 md:gap-14 py-8 group cursor-default
                  ${i < PRINCIPLES.length - 1 ? 'border-b border-lc-line-light' : ''}`}
              >
                <GradientText className="font-sans font-700 text-[11px] tracking-[0.28em] mt-2 flex-shrink-0 opacity-60 group-hover:opacity-100 transition-opacity duration-300">
                  {num}
                </GradientText>
                <p className="font-sans font-700 text-[22px] md:text-[30px] text-lc-maroon leading-tight group-hover:bg-clip-text group-hover:text-transparent transition-all duration-300"
                  style={{ '--g': BOX_G }}
                  onMouseEnter={e => { e.currentTarget.style.backgroundImage = BOX_G; }}
                  onMouseLeave={e => { e.currentTarget.style.backgroundImage = ''; e.currentTarget.style.webkitTextFillColor = ''; }}
                >
                  {text}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* ─── WHO THIS IS FOR ─────────────────────────────────── */}
        <section className="py-28 px-8 md:px-16 border-y border-lc-line-light"
          style={{ background: 'linear-gradient(135deg,#FFF8F5 0%,#F5F0FF 100%)' }}>
          <div className="max-w-[1440px] mx-auto grid md:grid-cols-2 gap-16 lg:gap-24 items-center">
            <div data-s>
              <Eyebrow>Who This Is Built For</Eyebrow>
              <h2 className="font-sans font-700 text-[40px] md:text-[56px] leading-[1.0] text-lc-maroon mb-8">
                The <GradientText>serious</GradientText><br />amateur.
              </h2>
              <p className="font-body text-[17px] text-lc-maroon-dim leading-relaxed max-w-md mb-5">
                The lifter, the runner, the cyclist, the fighter, the early-morning lap swimmer with a real job and a real family. The high-performer who treats nutrition as part of the work.
              </p>
              <p className="font-body text-[17px] text-lc-maroon-dim leading-relaxed max-w-md">
                If you're looking for a green powder with a celebrity on the label, you're in the wrong place.
              </p>
            </div>

            <div data-s>
              {WHO.map((line, i) => (
                <div key={i}
                  className={`flex items-center gap-5 py-5 ${i < WHO.length - 1 ? 'border-b border-lc-line-light' : ''}`}
                >
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: BOX_G }} />
                  <p className="font-sans font-700 text-[18px] md:text-[20px] text-lc-maroon">{line}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── THE LINE WE DREW ────────────────────────────────── */}
        <section className="py-28 px-8 md:px-16 max-w-[1440px] mx-auto">
          <div data-s className="max-w-3xl mb-16">
            <Eyebrow>The Line We Drew</Eyebrow>
            <h2 className="font-sans font-700 text-[32px] md:text-[48px] leading-[1.1] text-lc-maroon mb-8">
              We exist against underdosing. Against hidden blends.{' '}
              <GradientText>Against sucralose in products that charge premium prices.</GradientText>
            </h2>
            <p className="font-body text-[17px] text-lc-maroon-dim leading-relaxed">
              Against the assumption that athletes won't read the label. If you train seriously, you deserve a supplement system that does the same.
            </p>
          </div>

          {/* CTA */}
          <div data-s className="border-t pt-16 flex flex-col md:flex-row items-start md:items-center justify-between gap-10"
            style={{ borderImage: `${BOX_G} 1` }}>
            <div>
              <Eyebrow>Ready to start?</Eyebrow>
              <h3 className="font-sans font-700 text-[30px] md:text-[38px] text-lc-maroon leading-tight">
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
                className="inline-flex items-center justify-center px-9 py-4 rounded-full border border-lc-line-light font-body text-[13px] tracking-[0.2em] text-lc-maroon-dim uppercase hover:border-lc-maroon hover:text-lc-maroon transition-all duration-300">
                See Products
              </Link>
            </div>
          </div>
        </section>

      </main>
    </>
  );
}
