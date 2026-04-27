'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { gsap } from 'gsap';

const BOX_G = 'linear-gradient(135deg, #FF8A00 0%, #C62828 40%, #7C3AED 70%, #1D4ED8 100%)';
const MG    = 'linear-gradient(135deg, #FFD54F 0%, #FF8A00 50%, #C62828 100%)';
const RG    = 'linear-gradient(135deg, #7C3AED 0%, #5B21B6 50%, #1D4ED8 100%)';

function Check({ gradient }) {
  return (
    <span className="flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center mt-[3px]"
      style={{ background: gradient, minWidth: 16 }}>
      <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
        <path d="M1.5 4l2 2 3-3" stroke="white" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    </span>
  );
}

function BulletList({ items, gradient }) {
  return (
    <ul className="space-y-3">
      {items.map(item => (
        <li key={item} className="flex items-start gap-3">
          <Check gradient={gradient} />
          <span className="font-body text-[13px] text-[#555] leading-snug">{item}</span>
        </li>
      ))}
    </ul>
  );
}

function Label({ text }) {
  return <p className="font-body text-[9px] tracking-widest2 uppercase text-[#bbb] mb-3 mt-7 first:mt-0">{text}</p>;
}

function EmailCapture({ plan, gradient, btnLabel }) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState('');

  const submit = async () => {
    if (!email.includes('@')) { setErr('Enter a valid email.'); return; }
    setLoading(true);
    setErr('');
    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), plan }),
      });
      const data = await res.json();
      if (!res.ok) { setErr(data.error || 'Something went wrong.'); return; }
      setDone(true);
    } catch {
      setErr('Could not connect. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <div className="mt-6 p-5 rounded-2xl border border-[#e8f5e9] bg-[#f9fff9]">
        <p className="font-sans font-600 text-[13px] text-[#2e7d32] mb-1">You're in! Check your email.</p>
        <p className="font-body text-[12px] text-[#777] leading-relaxed">
          We sent you a login link and app download instructions to <strong>{email}</strong>.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-6">
      {!open ? (
        <button
          onClick={() => setOpen(true)}
          className="group inline-flex items-center gap-3 px-8 py-4 rounded-full text-white font-sans font-600 text-[12px] tracking-widest uppercase hover:opacity-88 transition-opacity"
          style={{ background: gradient }}
        >
          <span>{btnLabel}</span>
          <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center group-hover:translate-x-0.5 transition-transform">
            <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
              <path d="M1.5 4h5M4 2L6 4l-2 2" stroke="white" strokeWidth="1.3" strokeLinecap="round"/>
            </svg>
          </span>
        </button>
      ) : (
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <input
              autoFocus
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && submit()}
              placeholder="your@email.com"
              className="flex-1 font-body text-[14px] text-[#333] bg-white border border-[#e0e0e0] rounded-full px-5 py-3.5 outline-none focus:border-[#bbb] placeholder-[#ccc]"
            />
            <button
              onClick={submit}
              disabled={loading}
              className="px-6 py-3.5 rounded-full text-white font-sans font-600 text-[12px] tracking-widest uppercase transition-opacity hover:opacity-88 disabled:opacity-50 whitespace-nowrap"
              style={{ background: gradient }}
            >
              {loading ? '...' : 'Get access →'}
            </button>
          </div>
          {err && <p className="font-body text-[12px] text-red-500 pl-1">{err}</p>}
          <p className="font-body text-[10px] text-[#ccc] tracking-widest uppercase">
            Free while we launch · No credit card
          </p>
        </div>
      )}
    </div>
  );
}

export default function PricingPage() {
  const pageRef = useRef(null);

  useEffect(() => {
    if (!pageRef.current) return;
    gsap.fromTo('.pr-head', { opacity: 0, y: 28 }, { opacity: 1, y: 0, duration: 0.7, ease: 'power3.out', stagger: 0.08 });
    gsap.fromTo('.pr-card', { opacity: 0, y: 44 }, { opacity: 1, y: 0, duration: 0.7, ease: 'power3.out', stagger: 0.15, delay: 0.35 });
  }, []);

  return (
    <div ref={pageRef} className="min-h-screen bg-white font-body">

      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 md:px-16 py-5 border-b border-[#f0f0f0] bg-white/95 backdrop-blur-md">
        <Link href="/" className="flex items-center gap-3 text-[#888] hover:text-[#333] transition-colors">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5"/><path d="M12 19l-7-7 7-7"/>
          </svg>
          <span className="font-body text-xs tracking-widest uppercase">Back</span>
        </Link>
        <Link href="/" className="font-sans font-700 text-sm tracking-[0.3em] uppercase select-none bg-clip-text text-transparent" style={{ backgroundImage: BOX_G }}>
          LIFECODE
        </Link>
        <Link href="/login" className="font-body text-[10px] tracking-widest text-[#888] hover:text-[#333] transition-colors uppercase">
          Log In
        </Link>
      </nav>

      <main className="pt-32 pb-28 px-6 md:px-14 max-w-[1300px] mx-auto">

        {/* ── Page Header ── */}
        <div className="text-center mb-16 md:mb-20">
          <div className="pr-head flex items-center justify-center gap-3 mb-6" style={{ opacity: 0 }}>
            <div className="w-5 h-[1.5px]" style={{ background: BOX_G }} />
            <span className="font-body text-[9px] tracking-widest3 text-[#aaa] uppercase">Choose Your Protocol</span>
            <div className="w-5 h-[1.5px]" style={{ background: BOX_G }} />
          </div>
          <h1
            className="pr-head font-sans font-700 leading-[0.88] tracking-tight bg-clip-text text-transparent mb-6"
            style={{ fontSize: 'clamp(3.2rem, 7vw, 7rem)', backgroundImage: BOX_G, opacity: 0 }}>
            Two plans.<br />One system.
          </h1>
          <p className="pr-head font-body font-300 text-[#999] text-base md:text-lg leading-loose max-w-md mx-auto" style={{ opacity: 0 }}>
            Clinical dosing. No fillers. No guesswork.
            Pick what fits your commitment.
          </p>
          <p className="pr-head font-body text-[10px] tracking-widest text-[#ccc] uppercase mt-5" style={{ opacity: 0 }}>
            Free early access — join the waitlist now
          </p>
        </div>

        {/* ── Cards ── */}
        <div className="flex flex-col gap-8">

          {/* ══ ESSENTIALS ══ */}
          <div
            className="pr-card"
            style={{ opacity: 0, padding: '1.5px', borderRadius: '32px', background: MG }}
          >
            <div className="bg-white rounded-[30.5px] overflow-hidden grid grid-cols-1 lg:grid-cols-2">

              {/* LEFT — Image */}
              <div className="flex items-center justify-center bg-white p-10 md:p-14 lg:min-h-[540px]">
                <div className="w-full max-w-[480px]">
                  <Image
                    src="/Cutie_deschisa.png"
                    alt="LIFECODE Essentials"
                    width={960}
                    height={780}
                    className="w-full h-auto object-contain"
                    priority
                  />
                </div>
              </div>

              {/* RIGHT — Content */}
              <div className="flex flex-col justify-between p-10 md:p-14 border-l border-[#f0f0f0]">
                <div>
                  <div className="flex items-center gap-3 mb-6">
                    <span className="font-body text-[8.5px] tracking-widest3 uppercase bg-clip-text text-transparent" style={{ backgroundImage: MG }}>
                      01
                    </span>
                    <span className="font-body text-[8.5px] tracking-widest text-[#ddd] uppercase">One-time purchase</span>
                  </div>

                  <h2 className="font-sans font-700 text-[#111] tracking-tight leading-none mb-2"
                    style={{ fontSize: 'clamp(2.6rem, 4vw, 4rem)' }}>
                    Essentials
                  </h2>
                  <p className="font-body text-[11px] tracking-widest uppercase bg-clip-text text-transparent mb-6" style={{ backgroundImage: MG }}>
                    The full system. No commitment.
                  </p>

                  <p className="font-body font-300 text-[#777] text-[14px] md:text-[15px] leading-[1.8] mb-8 max-w-sm">
                    Two precision formulas for one complete cycle. Clinical-grade dosing, zero fillers.
                    The starting point for athletes who are serious about what they put in their body.
                  </p>

                  <Label text="What you get" />
                  <BulletList gradient={MG} items={[
                    'Morning Pack — 30 servings',
                    'Recovery Pack — 30 servings',
                    'Personalized protocol on signup',
                    'AI Dashboard access — 30 days',
                  ]} />

                  <Label text="Why it works" />
                  <BulletList gradient={MG} items={[
                    '11 clinically-dosed morning compounds',
                    '10 recovery compounds timed to the 45-min window',
                    'No proprietary blends — full label transparency',
                    'A system, not separate products',
                  ]} />
                </div>

                <div className="mt-10">
                  <div className="flex items-baseline gap-2 mb-2">
                    <span className="font-sans font-700 text-5xl text-[#ddd] tracking-tight">—</span>
                    <span className="font-body text-[11px] text-[#ddd] tracking-widest uppercase">Price coming soon</span>
                  </div>
                  <EmailCapture plan="essentials" gradient={MG} btnLabel="Get Essentials" />
                  <p className="font-body text-[10px] text-[#ccc] tracking-widest uppercase mt-4">
                    Ships within 48h · 30-day guarantee
                  </p>
                </div>
              </div>

            </div>
          </div>

          {/* ══ PROTOCOL ══ */}
          <div
            className="pr-card relative"
            style={{ opacity: 0, padding: '2px', borderRadius: '32px', background: BOX_G }}
          >
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
              <span className="font-body text-[8.5px] tracking-widest2 uppercase text-white px-5 py-2 rounded-full"
                style={{ background: BOX_G }}>
                Recommended
              </span>
            </div>

            <div className="bg-white rounded-[30px] overflow-hidden grid grid-cols-1 lg:grid-cols-2">

              {/* LEFT — Content */}
              <div className="flex flex-col justify-between p-10 md:p-14 order-2 lg:order-1 border-r border-[#f0f0f0]">
                <div>
                  <div className="flex items-center gap-3 mb-6">
                    <span className="font-body text-[8.5px] tracking-widest3 uppercase bg-clip-text text-transparent" style={{ backgroundImage: BOX_G }}>
                      02
                    </span>
                    <span className="font-body text-[8.5px] tracking-widest text-[#ddd] uppercase">Subscription + App</span>
                  </div>

                  <h2 className="font-sans font-700 text-[#111] tracking-tight leading-none mb-2"
                    style={{ fontSize: 'clamp(2.6rem, 4vw, 4rem)' }}>
                    Protocol
                  </h2>
                  <p className="font-body text-[11px] tracking-widest uppercase bg-clip-text text-transparent mb-6" style={{ backgroundImage: BOX_G }}>
                    Your system. Always on.
                  </p>

                  <p className="font-body font-300 text-[#777] text-[14px] md:text-[15px] leading-[1.8] mb-8 max-w-sm">
                    Monthly delivery of your formulas plus the full LIFECODE app. A continuously
                    evolving protocol that learns your body, tracks your biology, and optimises
                    you week over week.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8">
                    <div>
                      <Label text="What you get" />
                      <BulletList gradient={BOX_G} items={[
                        'Morning Pack — 30 servings / month',
                        'Recovery Pack — 30 servings / month',
                        'Full AI App — permanent access',
                        'Monthly protocol recalibration',
                        'Long-term AI memory coach',
                      ]} />

                      <Label text="App features" />
                      <BulletList gradient={RG} items={[
                        'AI Nutrition Coach — log meals naturally',
                        'Live micronutrient tracking — 20+ compounds',
                        'Progress streak — daily consistency visualised',
                        'Smart reminders — timed to your training',
                        'Understand why you had a bad day',
                      ]} />
                    </div>

                    <div>
                      <Label text="Blood test integration" />
                      <BulletList gradient={BOX_G} items={[
                        'Upload bloodwork directly in the app',
                        'AI analysis of key athlete biomarkers',
                        'Personalised protocol from your lab data',
                        'Track biomarkers over time',
                      ]} />

                      <Label text="Why Protocol" />
                      <BulletList gradient={BOX_G} items={[
                        'Continuous optimisation, not a one-time stack',
                        'AI gets smarter about your biology weekly',
                        'Become a data-driven athlete',
                        'One system. Nothing missing.',
                      ]} />
                    </div>
                  </div>
                </div>

                <div className="mt-10">
                  <div className="flex items-baseline gap-2 mb-2">
                    <span className="font-sans font-700 text-5xl text-[#ddd] tracking-tight">—</span>
                    <span className="font-body text-[11px] text-[#ddd] tracking-widest uppercase">/ month · Price coming soon</span>
                  </div>
                  <EmailCapture plan="protocol" gradient={BOX_G} btnLabel="Start Protocol" />
                  <p className="font-body text-[10px] text-[#ccc] tracking-widest uppercase mt-4">
                    Free to start · Cancel anytime · No credit card required now
                  </p>
                </div>
              </div>

              {/* RIGHT — Phone image */}
              <div className="flex items-center justify-center bg-white p-10 md:p-14 order-1 lg:order-2 lg:min-h-[680px]">
                <div className="relative w-full max-w-[340px]">
                  <div className="absolute inset-[-15%] opacity-[0.1] rounded-full pointer-events-none"
                    style={{ background: BOX_G, filter: 'blur(80px)' }} />
                  <div className="relative" style={{ padding: '2.5px', borderRadius: '38px', background: BOX_G }}>
                    <div className="bg-white overflow-hidden" style={{ borderRadius: '35.5px' }}>
                      <Image
                        src="/PhoneApp.png"
                        alt="LIFECODE App"
                        width={680}
                        height={960}
                        className="w-full h-auto object-contain"
                        priority
                      />
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>

        </div>

        {/* Bottom note */}
        <div className="mt-14 text-center space-y-3">
          <p className="font-body text-[10px] tracking-widest text-[#ccc] uppercase">
            All plans include free shipping · 30-day satisfaction guarantee
          </p>
          <p className="font-body text-[12px] text-[#bbb]">
            Questions?{' '}
            <a href="mailto:hello@lifecode.app" className="text-[#888] hover:text-[#444] transition-colors underline underline-offset-2">
              hello@lifecode.app
            </a>
          </p>
        </div>

      </main>
    </div>
  );
}
