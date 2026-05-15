'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { gsap } from 'gsap';
import Turnstile from '@/components/Turnstile';

const BOX_G  = 'linear-gradient(135deg, #FF8A00 0%, #E8445A 55%, #7C3AED 100%)';
const HEAT_G = 'linear-gradient(90deg, #FF8A00, #E8445A, #7C3AED)';
const FULL_G = 'linear-gradient(135deg, #FF8A00 0%, #C62828 40%, #7C3AED 70%, #1D4ED8 100%)';
const PROMO  = 'FIRST100';
const LAUNCH = new Date('2026-08-03T00:00:00');

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

export default function PreorderPage() {
  const { days, hours, mins, secs } = useCountdown(LAUNCH);
  const [email,    setEmail]    = useState('');
  const [hp,       setHp]       = useState('');
  const [turnstileToken, setTurnstileToken] = useState('');
  const [status,   setStatus]   = useState('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const ref = useRef(null);

  useEffect(() => {
    if (!ref.current) return;
    gsap.fromTo('.pr-anim',
      { opacity: 0, y: 24 },
      { opacity: 1, y: 0, duration: 0.7, ease: 'power3.out', stagger: 0.08 }
    );
  }, []);

  async function onSubmit(e) {
    e.preventDefault();
    if (status === 'loading' || status === 'success' || status === 'already') return;
    setStatus('loading');
    setErrorMsg('');
    try {
      const res  = await fetch('/api/preorder', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email, _hp: hp, turnstileToken }),
      });
      const data = await res.json();
      if (!res.ok) { setErrorMsg(data?.error || 'Something went wrong.'); setStatus('error'); return; }
      setStatus(data.alreadyOnList ? 'already' : 'success');
    } catch {
      setErrorMsg('Connection failed.');
      setStatus('error');
    }
  }

  return (
    <div ref={ref} className="min-h-screen flex flex-col"
      style={{ background: 'linear-gradient(180deg, #ffffff 0%, #FFF8F5 50%, #FAF7FF 100%)' }}>

      {/* Minimal header */}
      <header className="px-6 md:px-12 py-6 flex items-center justify-between border-b border-[#f0f0f0]">
        <Link href="/" className="flex items-center gap-2.5">
          <img src="/logo.png" alt="" style={{ width: 32, height: 32, objectFit: 'contain' }} />
          <span className="font-sans font-700 tracking-[0.3em] uppercase text-[0.95rem] bg-clip-text text-transparent"
            style={{ backgroundImage: FULL_G }}>
            LIFECODE
          </span>
        </Link>
        <span className="hidden sm:flex items-center gap-2 text-[10px] tracking-[0.3em] uppercase font-700"
          style={{ color: '#E8445A' }}>
          <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#FF8A00' }} />
          Pre-order
        </span>
      </header>

      {/* Main content */}
      <main className="flex-1 flex items-center justify-center px-6 md:px-12 py-12">
        <div className="w-full max-w-[640px] mx-auto">

          {/* Status badge */}
          <div className="pr-anim opacity-0 flex justify-center mb-6">
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full border"
              style={{ background: 'linear-gradient(135deg, #FFF9F5, #FAF7FF)', borderColor: 'rgba(232,68,90,0.2)' }}>
              <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#FF8A00' }} />
              <span className="font-sans font-700 text-[10px] tracking-[0.25em] uppercase bg-clip-text text-transparent"
                style={{ backgroundImage: HEAT_G }}>
                Launching August 2026
              </span>
            </span>
          </div>

          {/* Headline */}
          <h1 className="pr-anim opacity-0 text-center font-sans font-700 text-[#0a0a0a] leading-[0.92] tracking-tight mb-5"
            style={{ fontSize: 'clamp(2.6rem, 7vw, 4.5rem)' }}>
            The product<br/>
            <span className="bg-clip-text text-transparent" style={{ backgroundImage: HEAT_G }}>
              drops soon.
            </span>
          </h1>

          {/* Subtitle */}
          <p className="pr-anim opacity-0 text-center font-body text-[15px] sm:text-[17px] text-[#666] leading-relaxed max-w-[480px] mx-auto mb-10">
            Drop your email below. Get <span className="font-700 text-[#0a0a0a]">30% off</span> your first month and be the first to order when we launch.
          </p>

          {/* Timer */}
          <div className="pr-anim opacity-0 flex items-end justify-center gap-3 sm:gap-6 mb-10">
            {[{ v: days, l: 'Days' }, { v: hours, l: 'Hours' }, { v: mins, l: 'Min' }, { v: secs, l: 'Sec' }].map(({ v, l }, i) => (
              <div key={l} className="flex items-end gap-3 sm:gap-6">
                <div className="text-center">
                  <div className="font-sans font-700 tabular-nums bg-clip-text text-transparent"
                    style={{ fontSize: 'clamp(2.4rem, 5.5vw, 4rem)', backgroundImage: BOX_G }}>
                    {String(v).padStart(2, '0')}
                  </div>
                  <div className="font-body text-[9px] sm:text-[10px] tracking-[0.2em] uppercase text-[#bbb] mt-1">{l}</div>
                </div>
                {i < 3 && <span className="font-sans font-700 text-[#ddd] text-2xl sm:text-3xl pb-5">:</span>}
              </div>
            ))}
          </div>

          {/* Form */}
          <div className="pr-anim opacity-0">
            {status === 'success' || status === 'already' ? (
              <div className="rounded-2xl border border-[#d1fae5] bg-[#f0fdf4] px-6 py-8 text-center">
                <div className="w-12 h-12 rounded-full mx-auto flex items-center justify-center mb-4"
                  style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                    <path d="M5 12.5l4.5 4.5L19 7.5" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <p className="font-sans font-700 text-[#0a0a0a] text-xl mb-2">
                  {status === 'already' ? 'You are already on the list.' : 'You are on the list.'}
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
                <input type="text" name="website" value={hp} onChange={e => setHp(e.target.value)}
                  style={{ position: 'absolute', left: '-9999px', opacity: 0 }} tabIndex={-1} autoComplete="off" />
                <input
                  type="email" required inputMode="email" autoComplete="email"
                  disabled={status === 'loading'}
                  placeholder="Enter your email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full px-5 py-4 rounded-xl border-2 border-[#e8e8e8] font-body text-[15px] text-[#0a0a0a] placeholder:text-[#bbb] outline-none focus:border-[#E8445A] transition-colors duration-200 bg-white text-center sm:text-left"
                />
                <div className="my-3">
                  <Turnstile onVerify={setTurnstileToken} />
                </div>
                <button type="submit" disabled={status === 'loading' || !turnstileToken}
                  className="w-full py-4 rounded-xl text-white font-sans font-700 text-[14px] tracking-[0.15em] uppercase transition-opacity duration-200 hover:opacity-90 disabled:opacity-60"
                  style={{ background: BOX_G }}>
                  {status === 'loading' ? 'Joining...' : 'Pre-Order Now — Free'}
                </button>
                {status === 'error' && (
                  <p className="text-center font-body text-[13px] text-[#E8445A]">{errorMsg}</p>
                )}
                <p className="text-center font-body text-[11px] text-[#bbb]">
                  No payment. No commitment. Unsubscribe anytime.
                </p>
              </form>
            )}
          </div>

          {/* Benefits */}
          <div className="pr-anim opacity-0 grid grid-cols-3 gap-3 mt-10">
            {[
              { icon: '30%', text: 'Off first month' },
              { icon: '→',   text: 'Priority shipping' },
              { icon: '$0',  text: 'No payment now' },
            ].map(b => (
              <div key={b.text} className="text-center rounded-xl border border-[#f0f0f0] py-4 px-2 bg-white">
                <div className="font-sans font-700 text-[18px] sm:text-[22px] bg-clip-text text-transparent mb-1"
                  style={{ backgroundImage: HEAT_G }}>{b.icon}</div>
                <div className="font-body font-600 text-[#111] text-[11px] sm:text-[12px]">{b.text}</div>
              </div>
            ))}
          </div>

          {/* Trust */}
          <div className="pr-anim opacity-0 mt-10 pt-6 border-t border-[#f0f0f0] text-center">
            <p className="font-body text-[11px] tracking-[0.2em] uppercase text-[#bbb] mb-3">
              Formula tested on 30+ semi-pro athletes
            </p>
            <div className="flex items-center justify-center gap-1">
              {[1,2,3,4,5].map(i => (
                <svg key={i} width="14" height="14" viewBox="0 0 24 24" fill="#FF8A00">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
              ))}
              <span className="font-sans font-700 text-[13px] ml-2 bg-clip-text text-transparent"
                style={{ backgroundImage: HEAT_G }}>4.8</span>
              <span className="font-body text-[11px] text-[#aaa] ml-1">/ 5 · 15 verified reviews</span>
            </div>
          </div>

        </div>
      </main>

      {/* Minimal footer */}
      <footer className="px-6 md:px-12 py-6 border-t border-[#f0f0f0] flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="font-body text-[11px] text-[#bbb]">
          © {new Date().getFullYear()} LIFECODE Nutrition
        </p>
        <div className="flex items-center gap-3">
          <a href="https://www.instagram.com/lifecodenutrition" target="_blank" rel="noopener noreferrer"
            className="w-8 h-8 rounded-full border border-[#eee] flex items-center justify-center text-[#999] hover:text-white transition-all social-icon">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
              <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
              <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
            </svg>
          </a>
          <a href="https://www.facebook.com/lifecodenutrition" target="_blank" rel="noopener noreferrer"
            className="w-8 h-8 rounded-full border border-[#eee] flex items-center justify-center text-[#999] hover:text-white transition-all social-icon">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.95c5.05-.5 9-4.76 9-9.95z"/>
            </svg>
          </a>
          <a href="https://www.tiktok.com/@lifecode.nutrition" target="_blank" rel="noopener noreferrer"
            className="w-8 h-8 rounded-full border border-[#eee] flex items-center justify-center text-[#999] hover:text-white transition-all social-icon">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5.8 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1.84-0z"/>
            </svg>
          </a>
        </div>
      </footer>

    </div>
  );
}
