'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

const BOX_G  = 'linear-gradient(135deg, #FF8A00 0%, #C62828 40%, #7C3AED 70%, #1D4ED8 100%)';
const HEAT_G = 'linear-gradient(90deg, #FF8A00, #C62828, #7C3AED)';
const TOTAL_SPOTS = 157;

export default function PreOrderSection() {
  const sectionRef = useRef(null);
  const numberRef  = useRef(null);

  const [remaining, setRemaining] = useState(TOTAL_SPOTS);
  const [email, setEmail]         = useState('');
  const [status, setStatus]       = useState('idle'); // idle | loading | success | error | already
  const [errorMsg, setErrorMsg]   = useState('');

  // Fetch live counter on mount
  useEffect(() => {
    let cancelled = false;
    fetch('/api/preorder', { cache: 'no-store' })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (cancelled || !data) return;
        if (typeof data.remaining === 'number') animateNumber(remaining, data.remaining);
      })
      .catch(() => {});
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Reveal animations
  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const ctx = gsap.context(() => {
      gsap.fromTo('.po-rise',
        { opacity: 0, y: 28 },
        { opacity: 1, y: 0, duration: 0.7, ease: 'power3.out', stagger: 0.07,
          scrollTrigger: { trigger: sectionRef.current, start: 'top 85%' } }
      );
      gsap.fromTo('.po-img',
        { opacity: 0, scale: 0.94, y: 24 },
        { opacity: 1, scale: 1, y: 0, duration: 1.1, ease: 'power4.out',
          scrollTrigger: { trigger: sectionRef.current, start: 'top 80%' } }
      );
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  // Animated countdown — decrement smoothly when value changes
  function animateNumber(from, to) {
    const obj = { v: from };
    gsap.to(obj, {
      v: to,
      duration: 1.1,
      ease: 'power2.out',
      onUpdate: () => setRemaining(Math.round(obj.v)),
    });
  }

  async function onSubmit(e) {
    e.preventDefault();
    if (status === 'loading') return;
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
        setErrorMsg(data?.error || 'Eroare. Încearcă din nou.');
        setStatus('error');
        return;
      }
      if (typeof data.remaining === 'number') animateNumber(remaining, data.remaining);
      setStatus(data.alreadyOnList ? 'already' : 'success');
      // Pulse the number box
      if (numberRef.current) {
        gsap.fromTo(numberRef.current,
          { scale: 1 },
          { scale: 1.06, duration: 0.18, yoyo: true, repeat: 1, ease: 'power2.out' }
        );
      }
    } catch (err) {
      setErrorMsg('Conexiune eșuată.');
      setStatus('error');
    }
  }

  const reservedCount = TOTAL_SPOTS - remaining;
  const fillPct = Math.min(100, (reservedCount / TOTAL_SPOTS) * 100);
  const isSoldOut = remaining <= 0;

  return (
    <section
      ref={sectionRef}
      id="preorder"
      className="py-16 md:py-24 px-6 md:px-16"
      style={{ background: 'linear-gradient(180deg, #FFF9F5 0%, #ffffff 55%, #F8F5FF 100%)' }}
    >
      <div className="max-w-[1280px] mx-auto">

        {/* Eyebrow */}
        <div className="po-rise flex items-center gap-3 mb-6 opacity-0">
          <div className="w-5 h-px" style={{ background: HEAT_G }} />
          <span className="font-body text-[10px] tracking-[0.32em] uppercase font-600" style={{ color: '#C62828' }}>
            Limited drop · Founders batch
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1.05fr_1fr] gap-10 lg:gap-16 items-center">

          {/* LEFT — copy + form */}
          <div className="flex flex-col">

            <h2
              className="po-rise font-sans font-700 text-[#0a0a0a] leading-[0.92] tracking-tight opacity-0"
              style={{ fontSize: 'clamp(2.6rem, 5.6vw, 5.4rem)' }}
            >
              Be one of the<br/>
              <span className="bg-clip-text text-transparent" style={{ backgroundImage: HEAT_G }}>
                first 157
              </span><br/>
              <span className="text-[#0a0a0a]">to live the protocol.</span>
            </h2>

            <p className="po-rise font-body font-300 text-[#666] text-base md:text-[17px] leading-relaxed max-w-[520px] mt-7 opacity-0">
              Drop-ul nostru de lansare e limitat la <strong className="font-600 text-[#111]">157 de protocoale</strong>.
              Lasă-ți emailul, blochezi <span style={{ color: '#C62828' }} className="font-600">prețul de fondator</span> și
              ești primul care primește produsul când iese — fără card, fără plată acum.
            </p>

            {/* Counter card */}
            <div
              ref={numberRef}
              className="po-rise mt-9 p-[1.5px] rounded-2xl opacity-0 inline-block self-start"
              style={{ background: BOX_G, maxWidth: 520, width: '100%' }}
            >
              <div className="bg-white rounded-[14.5px] px-6 py-5 md:px-8 md:py-6">
                <div className="flex items-end justify-between gap-6 mb-4">
                  <div>
                    <p className="font-body text-[10px] tracking-[0.28em] uppercase text-[#999] font-600 mb-1">
                      {isSoldOut ? 'Toate locurile rezervate' : 'Locuri rămase'}
                    </p>
                    <div className="flex items-baseline gap-2">
                      <span
                        className="font-sans font-700 leading-none tabular-nums bg-clip-text text-transparent"
                        style={{ fontSize: 'clamp(3rem, 6vw, 4.5rem)', backgroundImage: HEAT_G }}
                      >
                        {remaining}
                      </span>
                      <span className="font-body text-[#bbb] text-sm font-400">/ {TOTAL_SPOTS}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-body text-[10px] tracking-[0.28em] uppercase text-[#999] font-600 mb-1">
                      Rezervate
                    </p>
                    <p className="font-sans font-700 text-[#0a0a0a] text-2xl tabular-nums leading-none">
                      {reservedCount}
                    </p>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="h-[6px] w-full bg-[#f1eef5] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-[width] duration-700 ease-out"
                    style={{ width: `${fillPct}%`, background: HEAT_G }}
                  />
                </div>
                <p className="font-body text-[11px] text-[#aaa] mt-3 tracking-wide">
                  Contorul scade automat la fiecare rezervare confirmată.
                </p>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={onSubmit} className="po-rise mt-7 opacity-0 w-full max-w-[520px]">
              <div
                className="flex flex-col sm:flex-row gap-2 p-[1.5px] rounded-full"
                style={{ background: status === 'success' || status === 'already' ? 'linear-gradient(135deg,#10b981,#059669)' : BOX_G }}
              >
                <input
                  type="email"
                  required
                  inputMode="email"
                  autoComplete="email"
                  disabled={status === 'loading' || status === 'success' || isSoldOut}
                  placeholder={isSoldOut ? 'Sold out — alertă pentru runda 2' : 'adresa ta de email'}
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="flex-1 bg-white rounded-full px-6 py-4 font-body text-[15px] text-[#0a0a0a] placeholder:text-[#bbb] outline-none disabled:opacity-70"
                />
                <button
                  type="submit"
                  disabled={status === 'loading' || status === 'success' || isSoldOut}
                  className="rounded-full px-7 py-4 text-white font-sans font-700 text-[12px] tracking-[0.18em] uppercase hover:opacity-90 transition disabled:opacity-70 whitespace-nowrap"
                  style={{ background: BOX_G }}
                >
                  {status === 'loading' ? 'Se rezervă…'
                    : status === 'success' ? 'Locul tău e blocat ✓'
                    : status === 'already' ? 'Ești deja pe listă ✓'
                    : 'Rezervă locul →'}
                </button>
              </div>

              {status === 'error' && (
                <p className="mt-3 font-body text-[13px]" style={{ color: '#C62828' }}>{errorMsg}</p>
              )}
              {status === 'success' && (
                <p className="mt-3 font-body text-[13px] text-[#059669] font-600">
                  Confirmat. Te anunțăm pe email când deschidem precomanda.
                </p>
              )}
              {status === 'already' && (
                <p className="mt-3 font-body text-[13px] text-[#059669]">
                  Emailul există deja pe listă — locul rămâne al tău.
                </p>
              )}

              <p className="mt-3 font-body text-[11px] text-[#aaa] tracking-wide">
                Fără spam. Un singur email când lansăm.
              </p>
            </form>

            {/* Marketing perks */}
            <div className="po-rise grid grid-cols-1 sm:grid-cols-3 gap-3 mt-9 opacity-0 w-full max-w-[640px]">
              {[
                { tag: '−25%', label: 'Preț de fondator', sub: 'blocat pe viață' },
                { tag: '1st',  label: 'Livrare prioritară', sub: 'înaintea tuturor' },
                { tag: '0€',   label: 'Fără plată acum',    sub: 'doar emailul tău' },
              ].map((p, i) => (
                <div key={i} className="rounded-xl border border-[#efe9f5] bg-white px-4 py-3.5">
                  <span
                    className="font-sans font-800 text-lg tabular-nums bg-clip-text text-transparent"
                    style={{ backgroundImage: HEAT_G }}
                  >
                    {p.tag}
                  </span>
                  <p className="font-sans font-700 text-[#111] text-[13px] mt-0.5">{p.label}</p>
                  <p className="font-body font-300 text-[#999] text-[11px] tracking-wide mt-0.5">{p.sub}</p>
                </div>
              ))}
            </div>

            <p className="po-rise mt-6 font-body text-[12px] text-[#888] tracking-wide opacity-0">
              <span className="font-700" style={{ color: '#C62828' }}>+1.200</span> sportivi pe lista de așteptare ·
              <span className="font-700 text-[#0a0a0a]"> 0 stocuri</span> după ce se umplu locurile.
            </p>
          </div>

          {/* RIGHT — product image */}
          <div className="po-img relative opacity-0">
            <div
              className="absolute inset-0 -z-10 blur-[80px] opacity-50 rounded-[40%]"
              style={{ background: BOX_G }}
            />
            <div className="relative aspect-square w-full max-w-[520px] mx-auto">
              <Image
                src="/Cutie_deschisa.png"
                alt="LIFECODE Protocol — pre-order"
                fill
                priority
                sizes="(min-width: 1024px) 480px, 90vw"
                className="object-contain drop-shadow-[0_30px_60px_rgba(124,58,237,0.18)]"
              />
            </div>
            <div className="mt-4 flex items-center justify-center gap-3">
              <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-[#f0e8f5]">
                <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#C62828' }} />
                <span className="font-body text-[10px] tracking-[0.28em] uppercase text-[#666] font-600">
                  Live · {reservedCount} rezervate astăzi
                </span>
              </span>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
