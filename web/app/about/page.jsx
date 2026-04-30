'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

const PRINCIPLES = [
  { num: '01', text: 'Clinical doses, every time.' },
  { num: '02', text: 'No proprietary blends. Ever.' },
  { num: '03', text: 'No artificial sweeteners. No exceptions.' },
  { num: '04', text: 'Premium forms only — methylated B-vitamins, bisglycinate minerals, MK-7, free-form EAAs.' },
  { num: '05', text: "If we wouldn't take it ourselves, we don't sell it." },
];

const PHASES = [
  { name: 'Morning Pak', status: 'live', accent: '#E8631A', desc: 'Sets the day. Clinically dosed vitamins, minerals, and methylated B-complex for performance and immune function.' },
  { name: 'Anabolic Recovery', status: 'live', accent: '#C62828', desc: 'Rebuilds it. EAAs, creatine, HMB, tart cherry — everything the body needs post-training.' },
  { name: 'Pre-Workout', status: 'soon', accent: '#8B4A52', desc: 'Coming next. Science-backed focus and power output, without the crash.' },
  { name: 'Endurance Gel', status: 'soon', accent: '#8B4A52', desc: 'Coming next. Sustained energy for long efforts, transparently dosed.' },
];

const LIES = [
  { num: '01', title: 'Underdosing', body: 'Active ingredients at 5–10% of the effective dose — enough to list on the label, not enough to do anything.' },
  { num: '02', title: 'Proprietary blends', body: "A branded blend name instead of ingredient amounts. Hiding what's actually in there — and how little." },
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
        { opacity: 1, y: 0, duration: 1.1, ease: 'power3.out', stagger: 0.14, delay: 0.25 }
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
    <main className="bg-lc-white text-lc-maroon overflow-x-hidden">

      {/* ─── HERO ─────────────────────────────────────────────── */}
      <section ref={heroRef} className="pt-40 pb-28 px-8 md:px-16 max-w-[1440px] mx-auto">
        <div data-h className="inline-flex items-center gap-3 mb-10">
          <span className="h-px w-10 bg-lc-orange" />
          <span className="font-body text-[11px] tracking-[0.32em] uppercase text-lc-orange">Our Story</span>
        </div>

        <h1 data-h className="font-sans font-700 text-[56px] md:text-[86px] lg:text-[108px] leading-[0.93] tracking-[-0.02em] text-lc-maroon">
          We didn't<br />
          start a<br />
          <span className="text-lc-crimson italic">supplement<br />company.</span>
        </h1>

        <p data-h className="mt-10 font-body text-[22px] md:text-[28px] text-lc-maroon-dim max-w-lg leading-snug">
          We solved our own problem.
        </p>

        {/* Scroll cue */}
        <div data-h className="mt-20 flex items-center gap-3 text-lc-maroon-dim/50">
          <span className="font-body text-[11px] tracking-[0.25em] uppercase">Scroll</span>
          <span className="h-px w-16 bg-lc-line-light" />
        </div>
      </section>

      <div className="h-px bg-lc-line-light" />

      {/* ─── THE PROBLEM ──────────────────────────────────────── */}
      <section className="py-28 px-8 md:px-16 max-w-[1440px] mx-auto">
        <div className="grid md:grid-cols-2 gap-16 lg:gap-24 items-start">

          <div data-s>
            <span className="font-body text-[11px] tracking-[0.32em] uppercase text-lc-orange block mb-7">The Problem</span>
            <h2 className="font-sans font-700 text-[38px] md:text-[50px] leading-[1.05] text-lc-maroon mb-10">
              A kitchen counter<br />that looked like<br />a pharmacy.
            </h2>
            {/* Stat card */}
            <div className="rounded-3xl p-8 inline-block"
              style={{ background: 'linear-gradient(135deg,#FFF3EC 0%,#FFE5D0 100%)' }}>
              <span className="font-sans font-700 text-[64px] leading-none text-lc-orange block">€300</span>
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

      {/* ─── PULLED QUOTE ─────────────────────────────────────── */}
      <section className="py-24 px-8 md:px-16 bg-lc-orange-light border-y border-lc-line-light">
        <div className="max-w-[1440px] mx-auto">
          <p data-s className="font-sans font-700 text-[26px] md:text-[40px] lg:text-[54px] leading-[1.1] text-lc-maroon max-w-5xl">
            "We spent years reading peer-reviewed journals, studying EFSA dossiers, learning the difference between zinc bisglycinate and zinc oxide. We talked to formulators. We audited manufacturers."
          </p>
          <p data-s className="mt-8 font-body text-[15px] text-lc-maroon-dim tracking-wide max-w-xl">
            We compared sourcing standards across continents. And what we found changed everything.
          </p>
        </div>
      </section>

      {/* ─── THREE LIES ───────────────────────────────────────── */}
      <section className="py-28 px-8 md:px-16 max-w-[1440px] mx-auto">
        <div data-s className="mb-16">
          <span className="font-body text-[11px] tracking-[0.32em] uppercase text-lc-orange block mb-5">What We Found</span>
          <h2 className="font-sans font-700 text-[36px] md:text-[54px] leading-[1.05] text-lc-maroon">
            The supplement industry<br />is built on three quiet lies.
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-5 mb-14">
          {LIES.map(({ num, title, body }) => (
            <div key={num} data-s
              className="rounded-3xl border border-lc-line-light p-9 group hover:border-lc-orange/40 hover:bg-lc-orange-light transition-all duration-300">
              <span className="font-sans font-700 text-[11px] tracking-[0.3em] text-lc-orange/50 block mb-5">{num}</span>
              <h3 className="font-sans font-700 text-[26px] text-lc-crimson mb-4 leading-tight">{title}</h3>
              <p className="font-body text-[15px] text-lc-maroon-dim leading-relaxed">{body}</p>
            </div>
          ))}
        </div>

        <p data-s className="font-body text-[18px] text-lc-maroon-dim max-w-2xl leading-relaxed">
          The brands that don't lie cost €60–90 a product — and you still need four of them to run a real protocol.{' '}
          <span className="text-lc-maroon font-700">So we stopped looking. We built it ourselves.</span>
        </p>
      </section>

      {/* ─── THE SYSTEM ───────────────────────────────────────── */}
      <section className="py-28 px-8 md:px-16" style={{ background: '#50000B' }}>
        <div className="max-w-[1440px] mx-auto">
          <div data-s className="mb-16">
            <span className="font-body text-[11px] tracking-[0.32em] uppercase text-lc-orange block mb-5">Where We Start</span>
            <h2 className="font-sans font-700 text-[36px] md:text-[54px] leading-[1.05] text-white max-w-2xl">
              A complete daily<br />performance system<br />across four phases.
            </h2>
            <p className="mt-6 font-body text-[17px] text-white/55 max-w-lg leading-relaxed">
              Each phase is a single stick. Clinically dosed, naturally sweetened, fully transparent. The work of an eight-product stack — in four sticks.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {PHASES.map(({ name, status, accent, desc }) => (
              <div key={name} data-s
                className={`rounded-3xl p-8 border transition-colors duration-300
                  ${status === 'live'
                    ? 'border-white/10 bg-white/[0.06] hover:bg-white/10'
                    : 'border-white/5 bg-white/[0.02] opacity-50'}`}
              >
                <span
                  className="font-body text-[10px] tracking-[0.28em] uppercase px-3 py-1.5 rounded-full inline-block mb-6"
                  style={{
                    color: status === 'live' ? accent : '#8B4A52',
                    background: status === 'live' ? `${accent}25` : 'rgba(139,74,82,0.18)',
                  }}
                >
                  {status === 'live' ? 'Available Now' : 'Coming Soon'}
                </span>
                <h3 className="font-sans font-700 text-[22px] text-white mb-3 leading-tight">{name}</h3>
                <p className="font-body text-[14px] text-white/45 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>

          <p data-s className="mt-12 font-body text-[15px] text-white/40 max-w-xl leading-relaxed">
            We're not launching with a hero product. The body doesn't work in heroes. It works in phases — and we'd rather build the system properly, one phase at a time, than ship a compromised version of the whole thing.
          </p>
        </div>
      </section>

      {/* ─── MANIFESTO ────────────────────────────────────────── */}
      <section className="py-28 px-8 md:px-16 max-w-[1440px] mx-auto">
        <div data-s className="mb-16">
          <span className="font-body text-[11px] tracking-[0.32em] uppercase text-lc-orange block mb-5">What We Stand For</span>
          <h2 className="font-sans font-700 text-[36px] md:text-[54px] leading-[1.05] text-lc-maroon">
            Five things<br />we never compromise on.
          </h2>
        </div>

        <div>
          {PRINCIPLES.map(({ num, text }, i) => (
            <div key={num} data-s
              className={`flex items-start gap-8 md:gap-14 py-8 group cursor-default
                ${i < PRINCIPLES.length - 1 ? 'border-b border-lc-line-light' : ''}`}
            >
              <span className="font-sans font-700 text-[11px] tracking-[0.28em] text-lc-orange/40 mt-2 flex-shrink-0 group-hover:text-lc-orange transition-colors duration-300">
                {num}
              </span>
              <p className="font-sans font-700 text-[22px] md:text-[30px] text-lc-maroon leading-tight group-hover:text-lc-crimson transition-colors duration-300">
                {text}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── WHO THIS IS FOR ──────────────────────────────────── */}
      <section className="py-28 px-8 md:px-16 bg-lc-orange-light border-y border-lc-line-light">
        <div className="max-w-[1440px] mx-auto grid md:grid-cols-2 gap-16 lg:gap-24 items-center">
          <div data-s>
            <span className="font-body text-[11px] tracking-[0.32em] uppercase text-lc-orange block mb-7">Who This Is Built For</span>
            <h2 className="font-sans font-700 text-[40px] md:text-[56px] leading-[1.0] text-lc-maroon mb-8">
              The serious<br />amateur.
            </h2>
            <p className="font-body text-[17px] text-lc-maroon-dim leading-relaxed max-w-md">
              The lifter, the runner, the cyclist, the fighter, the early-morning lap swimmer with a real job and a real family. The high-performer who treats nutrition as part of the work — not as a lifestyle aesthetic, not as a wellness routine, not as something to post about.
            </p>
            <p className="mt-5 font-body text-[17px] text-lc-maroon-dim leading-relaxed max-w-md">
              If you're looking for a green powder with a celebrity on the label, you're in the wrong place.
            </p>
          </div>

          <div data-s>
            {WHO.map((line, i) => (
              <div key={i}
                className={`flex items-center gap-5 py-5 ${i < WHO.length - 1 ? 'border-b border-lc-line-light' : ''}`}
              >
                <span className="w-2 h-2 rounded-full bg-lc-orange flex-shrink-0" />
                <p className="font-sans font-700 text-[18px] md:text-[20px] text-lc-maroon">{line}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── THE LINE WE DREW ─────────────────────────────────── */}
      <section className="py-28 px-8 md:px-16 max-w-[1440px] mx-auto">
        <div data-s className="max-w-3xl mb-16">
          <span className="font-body text-[11px] tracking-[0.32em] uppercase text-lc-orange block mb-6">The Line We Drew</span>
          <h2 className="font-sans font-700 text-[32px] md:text-[48px] leading-[1.1] text-lc-maroon mb-8">
            We exist against underdosing. Against hidden blends. Against sucralose in products that charge premium prices.
          </h2>
          <p className="font-body text-[17px] text-lc-maroon-dim leading-relaxed">
            Against the assumption that athletes won't read the label. If you train seriously, you deserve a supplement system that does the same.
          </p>
        </div>

        {/* Final CTA strip */}
        <div data-s className="border-t border-lc-line-light pt-16 flex flex-col md:flex-row items-start md:items-center justify-between gap-10">
          <div>
            <p className="font-body text-[11px] tracking-[0.32em] uppercase text-lc-orange mb-3">Ready to start?</p>
            <h3 className="font-sans font-700 text-[30px] md:text-[38px] text-lc-maroon leading-tight">
              Build your protocol.
            </h3>
          </div>
          <div className="flex flex-col sm:flex-row gap-4">
            <Link href="/pricing"
              className="inline-flex items-center justify-center px-9 py-4 rounded-full text-white font-body text-[13px] tracking-[0.2em] uppercase transition-all duration-300 hover:opacity-85"
              style={{ background: 'linear-gradient(90deg,#FF8A00,#C62828)' }}>
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
  );
}
