'use client';

import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

const BOX_G  = 'linear-gradient(135deg, #FF8A00 0%, #C62828 40%, #7C3AED 70%, #1D4ED8 100%)';
const HEAT_G = 'linear-gradient(90deg, #FF8A00, #C62828, #7C3AED)';

export default function PreOrderSection() {
  const sectionRef = useRef(null);

  const [email, setEmail]       = useState('');
  const [status, setStatus]     = useState('idle'); // idle | loading | success | error | already
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const ctx = gsap.context(() => {
      gsap.fromTo('.po-rise',
        { opacity: 0, y: 28 },
        { opacity: 1, y: 0, duration: 0.7, ease: 'power3.out', stagger: 0.08,
          scrollTrigger: { trigger: sectionRef.current, start: 'top 85%' } }
      );
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  async function onSubmit(e) {
    e.preventDefault();
    if (status === 'loading' || status === 'success' || status === 'already') return;
    setStatus('loading');
    setErrorMsg('');
    try {
      const res = await fetch('/api/preorder', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data?.error || 'Something went wrong. Try again.');
        setStatus('error');
        return;
      }
      setStatus(data.alreadyOnList ? 'already' : 'success');
    } catch (err) {
      setErrorMsg('Connection failed.');
      setStatus('error');
    }
  }

  return (
    <section
      ref={sectionRef}
      id="preorder"
      className="py-16 md:py-24 px-6 md:px-16"
      style={{ background: 'linear-gradient(180deg, #FFF9F5 0%, #ffffff 55%, #F8F5FF 100%)' }}
    >
      <div className="max-w-[920px] mx-auto text-center">

        {/* Eyebrow */}
        <div className="po-rise inline-flex items-center gap-3 mb-6 opacity-0">
          <div className="w-5 h-px" style={{ background: HEAT_G }} />
          <span className="font-body text-[10px] tracking-[0.32em] uppercase font-600" style={{ color: '#C62828' }}>
            Founders list · Pre-order opens soon
          </span>
          <div className="w-5 h-px" style={{ background: HEAT_G }} />
        </div>

        {/* Headline */}
        <h2
          className="po-rise font-sans font-700 text-[#0a0a0a] leading-[0.92] tracking-tight opacity-0 mx-auto"
          style={{ fontSize: 'clamp(2.6rem, 6vw, 5.6rem)' }}
        >
          The protocol drops soon.<br/>
          <span className="bg-clip-text text-transparent" style={{ backgroundImage: HEAT_G }}>
            Be the first to get it.
          </span>
        </h2>

        {/* Subline */}
        <p className="po-rise font-body font-300 text-[#666] text-base md:text-[17px] leading-relaxed max-w-[620px] mx-auto mt-7 opacity-0">
          Drop your email to join the founders list. You&apos;ll be the
          <span className="font-700 text-[#0a0a0a]"> first to pre-order</span>,
          lock in <span className="font-700" style={{ color: '#C62828' }}>founder pricing</span>,
          and ship before the public release.
        </p>

        {/* Email form */}
        <form onSubmit={onSubmit} className="po-rise mt-10 opacity-0 mx-auto w-full max-w-[560px]">
          <div
            className="flex flex-col sm:flex-row gap-2 p-[1.5px] rounded-full"
            style={{
              background: status === 'success' || status === 'already'
                ? 'linear-gradient(135deg,#10b981,#059669)'
                : BOX_G
            }}
          >
            <input
              type="email"
              required
              inputMode="email"
              autoComplete="email"
              disabled={status === 'loading' || status === 'success' || status === 'already'}
              placeholder="your@email.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="flex-1 bg-white rounded-full px-6 py-4 font-body text-[15px] text-[#0a0a0a] placeholder:text-[#bbb] outline-none disabled:opacity-70 text-center sm:text-left"
            />
            <button
              type="submit"
              disabled={status === 'loading' || status === 'success' || status === 'already'}
              className="rounded-full px-7 py-4 text-white font-sans font-700 text-[12px] tracking-[0.18em] uppercase hover:opacity-90 transition disabled:opacity-70 whitespace-nowrap"
              style={{ background: BOX_G }}
            >
              {status === 'loading' ? 'Joining…'
                : status === 'success' ? "You're on the list ✓"
                : status === 'already' ? 'Already on the list ✓'
                : 'Notify me first →'}
            </button>
          </div>

          {status === 'error' && (
            <p className="mt-3 font-body text-[13px]" style={{ color: '#C62828' }}>{errorMsg}</p>
          )}
          {status === 'success' && (
            <p className="mt-3 font-body text-[13px] text-[#059669] font-600">
              Confirmed. We&apos;ll email you the moment pre-orders open.
            </p>
          )}
          {status === 'already' && (
            <p className="mt-3 font-body text-[13px] text-[#059669]">
              You&apos;re already on the list — your spot is safe.
            </p>
          )}

          <p className="mt-3 font-body text-[11px] text-[#aaa] tracking-wide">
            No spam. One email when we launch.
          </p>
        </form>

        {/* Marketing perks */}
        <div className="po-rise grid grid-cols-1 sm:grid-cols-3 gap-3 mt-12 opacity-0 max-w-[720px] mx-auto">
          {[
            { tag: '−25%', label: 'Founder pricing',     sub: 'locked in for life' },
            { tag: '1ST',  label: 'Priority shipping',   sub: 'before everyone else' },
            { tag: '$0',   label: 'No payment now',      sub: 'just your email' },
          ].map((p) => (
            <div key={p.label} className="rounded-xl border border-[#efe9f5] bg-white px-4 py-4 text-left">
              <span
                className="font-sans font-800 text-xl tabular-nums bg-clip-text text-transparent"
                style={{ backgroundImage: HEAT_G }}
              >
                {p.tag}
              </span>
              <p className="font-sans font-700 text-[#111] text-[13px] mt-0.5">{p.label}</p>
              <p className="font-body font-300 text-[#999] text-[11px] tracking-wide mt-0.5">{p.sub}</p>
            </div>
          ))}
        </div>

        {/* Social proof */}
        <p className="po-rise mt-8 font-body text-[12px] text-[#888] tracking-wide opacity-0">
          <span className="font-700" style={{ color: '#C62828' }}>+1,200</span> athletes already waiting ·
          <span className="font-700 text-[#0a0a0a]"> Limited founders batch</span>
        </p>
      </div>
    </section>
  );
}
