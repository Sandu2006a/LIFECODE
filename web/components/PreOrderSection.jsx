'use client';

import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

const BLACK  = '#0a0a0a';
const PROMO  = 'LC70X';
const LAUNCH = new Date('2026-08-03T00:00:00');
const SPOTS  = 100;
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

function TimeUnit({ value, label }) {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div
        className="w-14 h-14 md:w-16 md:h-16 rounded-xl flex items-center justify-center font-sans font-700 text-xl md:text-2xl text-white tabular-nums"
        style={{ background: BLACK }}
      >
        {String(value).padStart(2, '0')}
      </div>
      <span className="font-body text-[8px] md:text-[9px] tracking-[0.25em] uppercase text-[#aaa]">{label}</span>
    </div>
  );
}

function SuccessCard({ email, already }) {
  const cardRef  = useRef(null);
  const checkRef = useRef(null);
  useEffect(() => {
    const tl = gsap.timeline();
    tl.fromTo(cardRef.current,
      { scale: 0.9, opacity: 0, y: 10 },
      { scale: 1, opacity: 1, y: 0, duration: 0.55, ease: 'back.out(1.6)' }
    );
    if (checkRef.current) {
      tl.fromTo(checkRef.current,
        { scale: 0, rotate: -90 },
        { scale: 1, rotate: 0, duration: 0.5, ease: 'back.out(2)' }, '-=0.25'
      );
    }
  }, []);

  return (
    <div ref={cardRef} className="relative rounded-2xl p-[1.5px] overflow-hidden"
      style={{ background: 'linear-gradient(135deg,#10b981,#059669,#047857)' }}>
      <div className="bg-white rounded-[14.5px] px-6 py-7 md:px-8 md:py-8 text-center">
        <div ref={checkRef} className="mx-auto w-14 h-14 rounded-full flex items-center justify-center mb-4"
          style={{ background: 'linear-gradient(135deg,#10b981,#059669)' }}>
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
            <path d="M5 12.5l4.5 4.5L19 7.5" stroke="#fff" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <p className="font-body text-[10px] tracking-[0.32em] uppercase font-700 text-[#059669] mb-2">
          {already ? 'Already on the list' : "You're in"}
        </p>
        <h3 className="font-sans font-700 text-[#0a0a0a] text-2xl md:text-3xl tracking-tight leading-tight">
          {already ? 'Your spot is safe.' : 'Welcome to the founders list.'}
        </h3>
        <p className="font-body font-300 text-[#666] text-[14px] leading-relaxed mt-3 max-w-[440px] mx-auto">
          We just sent a confirmation to <span className="font-700 text-[#0a0a0a]">{email}</span>.
        </p>
        <div className="mt-5 inline-block" style={{ padding: '1.5px', borderRadius: '14px', background: BLACK }}>
          <div className="bg-white px-7 py-4 text-center" style={{ borderRadius: '12.5px' }}>
            <p className="font-body text-[9px] tracking-[0.28em] uppercase text-[#888] mb-1.5">Your exclusive promo code</p>
            <p className="font-sans font-700 text-[26px] tracking-[0.22em]" style={{ color: BLACK }}>
              {PROMO}
            </p>
            <p className="font-body text-[11px] text-[#aaa] mt-1">70% off your first month · Apply at checkout</p>
          </div>
        </div>
        <div className="mt-5 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#f1fdf7] border border-[#d1fae5]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#10b981] animate-pulse" />
          <span className="font-body text-[10px] tracking-[0.28em] uppercase text-[#059669] font-700">
            Founder pricing locked
          </span>
        </div>
      </div>
    </div>
  );
}

export default function PreOrderSection() {
  const sectionRef = useRef(null);
  const { days, hours, mins, secs } = useCountdown(LAUNCH);
  const [email,    setEmail]    = useState('');
  const [status,   setStatus]   = useState('idle');
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
      const res  = await fetch('/api/preorder', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email }) });
      const data = await res.json();
      if (!res.ok) { setErrorMsg(data?.error || 'Something went wrong. Try again.'); setStatus('error'); return; }
      setStatus(data.alreadyOnList ? 'already' : 'success');
    } catch {
      setErrorMsg('Connection failed.');
      setStatus('error');
    }
  }

  const taken = TOTAL - SPOTS;
  const pct   = (taken / TOTAL) * 100;

  return (
    <section ref={sectionRef} id="preorder" className="py-16 md:py-24 px-6 md:px-16"
      style={{ background: 'linear-gradient(180deg, #FFF9F5 0%, #ffffff 55%, #F8F5FF 100%)' }}>
      <div className="max-w-[920px] mx-auto text-center">

        <div className="po-rise inline-flex items-center gap-3 mb-6 opacity-0">
          <div className="w-5 h-px" style={{ background: BLACK }} />
          <span className="font-body text-[10px] tracking-[0.32em] uppercase font-600" style={{ color: BLACK }}>
            Founders list · Pre-order opens soon
          </span>
          <div className="w-5 h-px" style={{ background: BLACK }} />
        </div>

        {/* Countdown timer */}
        <div className="po-rise flex items-end justify-center gap-2 md:gap-4 mb-10 opacity-0">
          <TimeUnit value={days}  label="Days" />
          <span className="font-sans font-700 text-[#ccc] text-2xl pb-6">:</span>
          <TimeUnit value={hours} label="Hours" />
          <span className="font-sans font-700 text-[#ccc] text-2xl pb-6">:</span>
          <TimeUnit value={mins}  label="Min" />
          <span className="font-sans font-700 text-[#ccc] text-2xl pb-6">:</span>
          <TimeUnit value={secs}  label="Sec" />
        </div>

        <h2 className="po-rise font-sans font-700 text-[#0a0a0a] leading-[0.92] tracking-tight opacity-0 mx-auto"
          style={{ fontSize: 'clamp(2.6rem, 6vw, 5.6rem)' }}>
          The protocol drops soon.<br/>
          <span style={{ color: BLACK }}>
            Be the first to get it.
          </span>
        </h2>

        <p className="po-rise font-body font-300 text-[#666] text-base md:text-[17px] leading-relaxed max-w-[620px] mx-auto mt-7 opacity-0">
          Drop your email to join the founders list. You&apos;ll be the
          <span className="font-700 text-[#0a0a0a]"> first to pre-order</span>,
          lock in <span className="font-700" style={{ color: BLACK }}>founder pricing</span>,
          and ship before the public release.
        </p>

        <div className="po-rise mt-10 opacity-0 mx-auto w-full max-w-[560px]">
          {status === 'success' || status === 'already' ? (
            <SuccessCard email={email} already={status === 'already'} />
          ) : (
            <form onSubmit={onSubmit}>
              <div className="flex flex-col sm:flex-row gap-2 p-[1.5px] rounded-full" style={{ background: BLACK }}>
                <input type="email" required inputMode="email" autoComplete="email"
                  disabled={status === 'loading'}
                  placeholder="your@email.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="flex-1 bg-white rounded-full px-6 py-4 font-body text-[15px] text-[#0a0a0a] placeholder:text-[#bbb] outline-none disabled:opacity-70 text-center sm:text-left"
                />
                <button type="submit" disabled={status === 'loading'}
                  className="relative overflow-hidden rounded-full px-7 py-4 text-white font-sans font-700 text-[12px] tracking-[0.18em] uppercase transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_10px_30px_rgba(198,40,40,0.35)] disabled:opacity-80 whitespace-nowrap group"
                  style={{ background: BLACK }}>
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    {status === 'loading' ? (
                      <>
                        <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none">
                          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.3"/>
                          <path d="M22 12a10 10 0 0 1-10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
                        </svg>
                        Joining…
                      </>
                    ) : (
                      <>Subscribe Now <span className="group-hover:translate-x-1 transition-transform duration-300">→</span></>
                    )}
                  </span>
                  <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700"
                    style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.25), transparent)' }} />
                </button>
              </div>
              {status === 'error' && <p className="mt-3 font-body text-[13px]" style={{ color: BLACK }}>{errorMsg}</p>}
              <p className="mt-3 font-body text-[11px] text-[#aaa] tracking-wide">
                Subscribe now to get your promo · No spam · One email when we launch
              </p>
            </form>
          )}
        </div>

        <div className="po-rise grid grid-cols-1 sm:grid-cols-3 gap-3 mt-12 opacity-0 max-w-[720px] mx-auto">
          {[
            { tag: '70%', label: 'Off first month',  sub: 'first 100 founders only', color: BLACK },
            { tag: '1ST', label: 'Priority shipping', sub: 'before everyone else',    color: BLACK },
            { tag: '$0',  label: 'No payment now',    sub: 'just your email',         color: BLACK },
          ].map((p) => (
            <div key={p.label} className="rounded-xl border border-[#efe9f5] bg-white px-4 py-4 text-left">
              <span className="font-sans font-800 text-xl tabular-nums" style={{ color: p.color }}>
                {p.tag}
              </span>
              <p className="font-sans font-700 text-[#111] text-[13px] mt-0.5">{p.label}</p>
              <p className="font-body font-300 text-[#999] text-[11px] tracking-wide mt-0.5">{p.sub}</p>
            </div>
          ))}
        </div>

        {/* Spot counter */}
        <div className="po-rise mt-8 max-w-[480px] mx-auto opacity-0">
          <div className="flex items-center justify-between mb-2">
            <span className="font-body text-[12px] text-[#888]">
              <span className="font-700 text-[#0a0a0a]">{SPOTS}</span> of {TOTAL} founder spots remaining
            </span>
            <span className="font-body text-[12px] font-700" style={{ color: BLACK }}>{taken} taken</span>
          </div>
          <div className="h-1.5 w-full rounded-full overflow-hidden" style={{ background: '#f0f0f0' }}>
            <div className="h-full rounded-full" style={{ width: `${pct}%`, background: BLACK }} />
          </div>
          <p className="mt-2 font-body text-[11px] text-[#bbb] tracking-wide">
            First 100 get <span className="font-700" style={{ color: BLACK }}>70% off</span> for the first month
          </p>
        </div>

      </div>
    </section>
  );
}
