'use client';

import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

const BOX_G  = 'linear-gradient(135deg, #FF8A00 0%, #E8445A 55%, #7C3AED 100%)';
const HEAT_G = 'linear-gradient(90deg, #FF8A00, #E8445A, #7C3AED)';
const PROMO  = 'FIRST100';
const LAUNCH = new Date('2026-08-03T00:00:00');
const TOTAL  = 100;

function useCountdown(target) {
  const [t, setT] = useState({ days: 0, hours: 0, mins: 0, secs: 0 });
  useEffect(() => {
    const tick = () => {
      const d = target.getTime() - Date.now();
      if (d <= 0) { setT({ days: 0, hours: 0, mins: 0, secs: 0 }); return; }
      setT({
        days:  Math.floor(d / 86400000),
        hours: Math.floor(d / 3600000) % 24,
        mins:  Math.floor(d / 60000) % 60,
        secs:  Math.floor(d / 1000) % 60,
      });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  return t;
}

export default function PreOrderSection() {
  const sectionRef = useRef(null);
  const { days, hours, mins, secs } = useCountdown(LAUNCH);
  const [email,    setEmail]    = useState('');
  const [status,   setStatus]   = useState('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [taken,    setTaken]    = useState(0);

  useEffect(() => {
    fetch('/api/preorder').then(r => r.json()).then(d => {
      if (d.taken !== undefined) setTaken(d.taken);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const ctx = gsap.context(() => {
      gsap.fromTo('.po-rise',
        { opacity: 0, y: 24 },
        { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out', stagger: 0.07,
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
      const res  = await fetch('/api/preorder', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email }) });
      const data = await res.json();
      if (!res.ok) { setErrorMsg(data?.error || 'Something went wrong.'); setStatus('error'); return; }
      if (data.taken !== undefined) setTaken(data.taken);
      setStatus(data.alreadyOnList ? 'already' : 'success');
    } catch {
      setErrorMsg('Connection failed.');
      setStatus('error');
    }
  }

  const spots = Math.max(0, TOTAL - taken);
  const pct   = Math.min(100, (taken / TOTAL) * 100);

  return (
    <section ref={sectionRef} id="preorder"
      className="py-16 md:py-24 px-6 md:px-16 bg-white border-t border-[#f0f0f0]">
      <div className="max-w-[760px] mx-auto">

        {/* Label */}
        <div className="po-rise opacity-0 flex items-center justify-center gap-3 mb-8">
          <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#E8445A' }} />
          <span className="font-body text-[11px] tracking-[0.3em] uppercase font-600 text-[#E8445A]">
            Pre-order opens August 2026
          </span>
        </div>

        {/* Headline */}
        <div className="po-rise opacity-0 text-center mb-8">
          <h2 className="font-sans font-700 text-[#0a0a0a] leading-none tracking-tight mb-4"
            style={{ fontSize: 'clamp(2.4rem, 5vw, 4.5rem)' }}>
            The product drops soon.
          </h2>

          {/* Timer */}
          <div className="flex items-center justify-center gap-4 sm:gap-8">
            {[{ v: days, l: 'Days' }, { v: hours, l: 'Hours' }, { v: mins, l: 'Min' }, { v: secs, l: 'Sec' }].map(({ v, l }, i) => (
              <div key={l} className="flex items-center gap-4 sm:gap-8">
                <div className="text-center">
                  <div className="font-sans font-700 tabular-nums bg-clip-text text-transparent"
                    style={{ fontSize: 'clamp(2.8rem, 6vw, 5rem)', backgroundImage: BOX_G }}>
                    {String(v).padStart(2, '0')}
                  </div>
                  <div className="font-body text-[10px] tracking-[0.2em] uppercase text-[#bbb] mt-1">{l}</div>
                </div>
                {i < 3 && <span className="font-sans font-700 text-[#ddd] text-3xl mb-6">:</span>}
              </div>
            ))}
          </div>
        </div>

        {/* Divider */}
        <div className="po-rise opacity-0 h-px mb-8" style={{ background: 'linear-gradient(90deg, transparent, #e8e8e8, transparent)' }} />

        {/* What you get — 3 benefits */}
        <div className="po-rise opacity-0 grid grid-cols-3 gap-3 mb-8">
          {[
            { icon: '30%', text: 'Founder discount', sub: 'First 100 only' },
            { icon: '→',   text: 'Priority shipping', sub: 'Before public launch' },
            { icon: '$0',  text: 'No payment now', sub: 'Just your email' },
          ].map(b => (
            <div key={b.text} className="text-center rounded-xl border border-[#f0f0f0] py-4 px-2 bg-[#fafafa]">
              <div className="font-sans font-700 text-[18px] sm:text-[22px] bg-clip-text text-transparent mb-1"
                style={{ backgroundImage: HEAT_G }}>{b.icon}</div>
              <div className="font-body font-600 text-[#111] text-[12px] sm:text-[13px]">{b.text}</div>
              <div className="font-body text-[10px] text-[#aaa] mt-0.5 hidden sm:block">{b.sub}</div>
            </div>
          ))}
        </div>

        {/* Form or Success */}
        <div className="po-rise opacity-0">
          {status === 'success' || status === 'already' ? (
            <div className="rounded-2xl border border-[#d1fae5] bg-[#f0fdf4] px-6 py-8 text-center">
              <div className="w-12 h-12 rounded-full mx-auto flex items-center justify-center mb-4"
                style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                  <path d="M5 12.5l4.5 4.5L19 7.5" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <p className="font-sans font-700 text-[#0a0a0a] text-xl mb-2">
                {status === 'already' ? 'Your spot is saved.' : 'You are on the list.'}
              </p>
              <p className="font-body text-[#666] text-[14px] mb-5">
                Confirmation sent to <strong className="text-[#0a0a0a]">{email}</strong>
              </p>
              <div className="inline-block rounded-xl border-2 px-8 py-3" style={{ borderColor: '#E8445A' }}>
                <p className="font-body text-[10px] tracking-[0.25em] uppercase text-[#aaa] mb-1">Your promo code</p>
                <p className="font-sans font-700 text-[28px] tracking-[0.2em] bg-clip-text text-transparent"
                  style={{ backgroundImage: BOX_G }}>{PROMO}</p>
                <p className="font-body text-[11px] text-[#aaa] mt-1">30% off · Apply at checkout</p>
              </div>
            </div>
          ) : (
            <form onSubmit={onSubmit} className="space-y-3">
              <input
                type="email" required inputMode="email" autoComplete="email"
                disabled={status === 'loading'}
                placeholder="Enter your email address"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full px-5 py-4 rounded-xl border-2 border-[#e8e8e8] font-body text-[15px] text-[#0a0a0a] placeholder:text-[#bbb] outline-none focus:border-[#E8445A] transition-colors duration-200 bg-white"
              />
              <button type="submit" disabled={status === 'loading'}
                className="w-full py-4 rounded-xl text-white font-sans font-700 text-[14px] tracking-[0.15em] uppercase transition-opacity duration-200 hover:opacity-90 disabled:opacity-60"
                style={{ background: BOX_G }}>
                {status === 'loading' ? 'Joining...' : 'Pre-Order Now — Free'}
              </button>
              {status === 'error' && (
                <p className="text-center font-body text-[13px] text-[#E8445A]">{errorMsg}</p>
              )}
              <p className="text-center font-body text-[11px] text-[#bbb]">
                No payment. No commitment. Unsubscribe anytime.{' '}
                <a href="/privacy" className="underline hover:text-[#666] transition-colors">Privacy Policy</a>
              </p>
            </form>
          )}
        </div>


      </div>
    </section>
  );
}
