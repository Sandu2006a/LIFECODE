'use client';

import { useState } from 'react';
import Link from 'next/link';

const BOX_G  = 'linear-gradient(135deg, #FF8A00 0%, #E8445A 55%, #7C3AED 100%)';
const HEAT_G = 'linear-gradient(90deg, #FF8A00, #E8445A, #7C3AED)';

const TOPICS = ['Product question', 'Ingredients & Science', 'Shipping / Orders', 'Partnerships / PR', 'Press', 'Other'];

export default function ContactPage() {
  const [topic,   setTopic]   = useState('');
  const [name,    setName]    = useState('');
  const [email,   setEmail]   = useState('');
  const [message, setMessage] = useState('');
  const [status,  setStatus]  = useState<'idle'|'loading'|'success'|'error'>('idle');
  const [open,    setOpen]    = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (status === 'loading') return;
    setStatus('loading');
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ topic, name, email, message }),
      });
      setStatus(res.ok ? 'success' : 'error');
    } catch {
      setStatus('error');
    }
  }

  const inputClass = "w-full px-5 py-4 rounded-xl border border-[#ece8f5] bg-white font-body text-[15px] text-[#0a0a0a] placeholder:text-[#ccc] outline-none focus:border-[#E8445A] transition-colors duration-200";

  return (
    <div className="min-h-screen bg-white">
      <div className="pt-36 pb-20 px-6 md:px-16 max-w-[1100px] mx-auto">

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">

          {/* Left */}
          <div>
            <div className="inline-flex items-center gap-3 mb-6">
              <div className="w-5 h-px" style={{ background: HEAT_G }} />
              <span className="font-body text-[10px] tracking-[0.32em] uppercase font-600" style={{ color: '#E8445A' }}>
                Get in touch
              </span>
            </div>
            <h1 className="font-sans font-700 text-[#0a0a0a] leading-[0.92] tracking-tight"
              style={{ fontSize: 'clamp(2.4rem, 5vw, 4rem)' }}>
              We'd love to<br/>
              <span className="bg-clip-text text-transparent" style={{ backgroundImage: HEAT_G }}>
                hear from you.
              </span>
            </h1>
            <p className="mt-6 font-body font-300 text-[#666] text-[15px] md:text-[16px] leading-relaxed max-w-[400px]">
              Questions about ingredients, partnerships, press, or anything else — we read every message.
            </p>

            <div className="mt-10 space-y-5">
              <a href="mailto:lifecodenutrition@gmail.com"
                className="flex items-center gap-4 group">
                <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: 'linear-gradient(135deg, #FFF3EC, #FAF0FF)' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" stroke="#E8445A" strokeWidth="1.5"/>
                    <path d="M22 6l-10 7L2 6" stroke="#E8445A" strokeWidth="1.5"/>
                  </svg>
                </div>
                <div>
                  <p className="font-body text-[11px] tracking-[0.2em] uppercase text-[#aaa] mb-0.5">Email</p>
                  <p className="font-sans font-600 text-[#0a0a0a] text-[14px] group-hover:text-[#E8445A] transition-colors">
                    lifecodenutrition@gmail.com
                  </p>
                </div>
              </a>

              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: 'linear-gradient(135deg, #FFF3EC, #FAF0FF)' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" stroke="#7C3AED" strokeWidth="1.5"/>
                    <circle cx="12" cy="9" r="2.5" stroke="#7C3AED" strokeWidth="1.5"/>
                  </svg>
                </div>
                <div>
                  <p className="font-body text-[11px] tracking-[0.2em] uppercase text-[#aaa] mb-0.5">Response time</p>
                  <p className="font-sans font-600 text-[#0a0a0a] text-[14px]">Within 24–48 hours</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right — Form */}
          <div>
            {status === 'success' ? (
              <div className="rounded-2xl border border-[#d1fae5] bg-[#f0fdf4] px-8 py-10 text-center">
                <div className="mx-auto w-14 h-14 rounded-full flex items-center justify-center mb-4"
                  style={{ background: 'linear-gradient(135deg,#10b981,#059669)' }}>
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
                    <path d="M5 12.5l4.5 4.5L19 7.5" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <h3 className="font-sans font-700 text-[#0a0a0a] text-2xl mb-2">Message sent!</h3>
                <p className="font-body text-[#666] text-[14px]">We'll get back to you within 24–48 hours.</p>
                <button onClick={() => { setStatus('idle'); setTopic(''); setName(''); setEmail(''); setMessage(''); }}
                  className="mt-6 font-body text-[12px] tracking-widest uppercase text-[#888] hover:text-[#444] transition-colors">
                  Send another →
                </button>
              </div>
            ) : (
              <form onSubmit={onSubmit} className="space-y-3">

                {/* Topic dropdown */}
                <div className="relative">
                  <button type="button" onClick={() => setOpen(v => !v)}
                    className="w-full px-5 py-4 rounded-xl border border-[#ece8f5] bg-white font-body text-[15px] text-left flex items-center justify-between transition-colors duration-200"
                    style={{ color: topic ? '#0a0a0a' : '#ccc', borderColor: open ? '#E8445A' : undefined }}>
                    {topic || 'Select a topic'}
                    <svg width="12" height="8" viewBox="0 0 12 8" fill="none"
                      className={`transition-transform duration-200 ${open ? 'rotate-180' : ''}`}>
                      <path d="M1 1l5 5 5-5" stroke="#aaa" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                  </button>
                  {open && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-[#ece8f5] rounded-xl shadow-lg z-10 overflow-hidden">
                      {TOPICS.map(t => (
                        <button key={t} type="button"
                          onClick={() => { setTopic(t); setOpen(false); }}
                          className="w-full text-left px-5 py-3.5 font-body text-[14px] text-[#333] hover:bg-[#FFF8F5] transition-colors">
                          {t}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <input type="text" required placeholder="NAME" value={name}
                  onChange={e => setName(e.target.value)}
                  className={inputClass} />

                <input type="email" required placeholder="EMAIL ADDRESS" value={email}
                  onChange={e => setEmail(e.target.value)}
                  className={inputClass} />

                <textarea required placeholder="YOUR MESSAGE" value={message}
                  onChange={e => setMessage(e.target.value)} rows={5}
                  className={`${inputClass} resize-none`} />

                {status === 'error' && (
                  <p className="font-body text-[13px]" style={{ color: '#E8445A' }}>
                    Something went wrong. Try again or email us directly.
                  </p>
                )}

                <button type="submit" disabled={status === 'loading' || !topic}
                  className="w-full py-4 rounded-xl text-white font-sans font-700 text-[12px] tracking-[0.18em] uppercase transition-opacity duration-200 hover:opacity-90 disabled:opacity-50"
                  style={{ background: BOX_G }}>
                  {status === 'loading' ? 'Sending…' : 'Submit →'}
                </button>

                <p className="font-body text-[11px] text-[#aaa] text-center">
                  By submitting, you agree to our{' '}
                  <Link href="/privacy" className="underline hover:text-[#666]">Privacy Policy</Link>.
                </p>
              </form>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
