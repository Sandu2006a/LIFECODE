'use client';

import React, { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { gsap } from 'gsap';

const BOX_G = 'linear-gradient(135deg, #FF8A00 0%, #C62828 40%, #7C3AED 70%, #1D4ED8 100%)';

const FIELDS = [
  { id: 'name',   label: 'Name',                      placeholder: 'e.g. Alex',                      type: 'text',   col: 'full' },
  { id: 'age',    label: 'Age',                        placeholder: 'e.g. 26',                        type: 'number', col: 'half' },
  { id: 'height', label: 'Height (cm)',                placeholder: 'e.g. 182',                       type: 'number', col: 'half' },
  { id: 'weight', label: 'Weight (kg)',                placeholder: 'e.g. 78',                        type: 'number', col: 'half' },
  { id: 'sport',  label: 'Sport',                      placeholder: 'e.g. Triathlon',                 type: 'text',   col: 'half' },
  { id: 'result', label: 'Best Result in This Sport',  placeholder: 'e.g. Sub 4h 30min Ironman 70.3', type: 'text',   col: 'full' },
] as const;

const APP_FEATURES = [
  { label: 'AI Nutrition Coach',    desc: 'Tell it what you ate — it calculates every micro and macro instantly.' },
  { label: 'Live Micronutrient Tracking', desc: 'Real-time progress bars for all 20+ compounds in your protocol.' },
  { label: 'Long-Term Memory',      desc: 'The AI remembers your preferences, feelings, and performance patterns.' },
  { label: 'Biomarker Dashboard',   desc: 'Upload bloodwork and track key athlete biomarkers over time.' },
  { label: 'Workout Sync',          desc: 'Schedule workouts and get nutrition timing advice automatically.' },
];

type FieldId = (typeof FIELDS)[number]['id'];
type FormState = Record<FieldId, string> & { gender: 'male' | 'female'; password: string };

export default function EcosystemPage() {
  const router  = useRouter();
  const headRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const appRef  = useRef<HTMLDivElement>(null);

  const [form, setForm]             = useState<FormState>({ name: '', age: '', height: '', weight: '', sport: '', result: '', gender: 'male', password: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]           = useState('');

  const handleChange = (id: FieldId, val: string) => setForm(prev => ({ ...prev, [id]: val }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.password || submitting) return;
    if (form.password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    setSubmitting(true);
    setError('');

    const signupRes  = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: form.name.trim(), password: form.password }),
    });
    const signupData = await signupRes.json();

    if (!signupRes.ok) {
      setError(signupData.error || 'Signup failed.');
      setSubmitting(false);
      return;
    }

    const userId = signupData.userId;
    try {
      await fetch('/api/analyze-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, user_id: userId }),
      });
    } catch { /* uses defaults */ }

    router.push('/dashboard');
    router.refresh();
  };

  useEffect(() => {
    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
    tl.fromTo(headRef.current!.querySelectorAll('.hl'),
      { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.7, stagger: 0.08 }
    ).fromTo(appRef.current!.querySelectorAll('.ap'),
      { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.6, stagger: 0.07 }, '-=0.2'
    ).fromTo(formRef.current!.querySelectorAll('.fi'),
      { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.5, stagger: 0.05 }, '-=0.3'
    ).fromTo(formRef.current!.querySelector('.sb'),
      { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.45 }, '-=0.2'
    );
  }, []);

  return (
    <div className="min-h-screen bg-white font-body">

      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 md:px-16 py-5 border-b border-[#f0f0f0] bg-white/95 backdrop-blur-md">
        <Link href="/" className="flex items-center gap-3 text-[#888] hover:text-[#333] transition-colors duration-300">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5"/><path d="M12 19l-7-7 7-7"/>
          </svg>
          <span className="font-body text-xs tracking-widest uppercase">Back</span>
        </Link>
        <span className="font-sans font-700 text-sm tracking-[0.3em] uppercase select-none bg-clip-text text-transparent" style={{ backgroundImage: BOX_G }}>
          LIFECODE
        </span>
        <Link href="/login" className="font-body text-[10px] tracking-widest text-[#888] hover:text-[#333] transition-colors duration-300 uppercase">
          Log In
        </Link>
      </nav>

      <div className="pt-28 md:pt-36 pb-20 md:pb-28">

        {/* ── App section ─────────────────────────────────────────── */}
        <div ref={appRef} className="px-6 md:px-16 max-w-[1440px] mx-auto mb-20 md:mb-28">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">

            {/* Phone image */}
            <div className="ap order-2 lg:order-1 flex items-center justify-center" style={{ opacity: 0 }}>
              <div className="relative w-full max-w-[340px] mx-auto">
                {/* Glow behind phone */}
                <div className="absolute inset-[-10%] blur-3xl opacity-15 pointer-events-none rounded-full"
                  style={{ background: BOX_G }} />
                <div style={{ padding: '2px', borderRadius: '36px', background: BOX_G }}>
                  <div className="bg-white overflow-hidden" style={{ borderRadius: '34px' }}>
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

            {/* App description */}
            <div className="order-1 lg:order-2 flex flex-col gap-7">
              <div className="ap" style={{ opacity: 0 }}>
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-5 h-[1.5px]" style={{ background: BOX_G }} />
                  <span className="font-body text-[9px] tracking-widest3 text-[#aaa] uppercase">Your AI Dashboard</span>
                </div>
                <h2
                  className="font-sans font-700 leading-[0.9] tracking-tight bg-clip-text text-transparent"
                  style={{ fontSize: 'clamp(2rem, 4vw, 3.8rem)', backgroundImage: BOX_G }}
                >
                  The app that<br />knows your body.
                </h2>
              </div>

              <p className="ap font-body font-300 text-[#888] text-sm md:text-base leading-loose max-w-md" style={{ opacity: 0 }}>
                Your personal AI nutrition architect. Log meals by talking naturally, track every micronutrient in real time, and get protocol advice built around your actual biology — not generic recommendations.
              </p>

              <div className="ap space-y-4" style={{ opacity: 0 }}>
                {APP_FEATURES.map((f) => (
                  <div key={f.label} className="flex items-start gap-4">
                    <div className="flex-shrink-0 mt-1 w-1 h-1 rounded-full" style={{ background: BOX_G, minWidth: 6, minHeight: 6, marginTop: 7 }} />
                    <div>
                      <p className="font-sans font-600 text-[12px] text-[#222] tracking-tight">{f.label}</p>
                      <p className="font-body text-[11px] text-[#aaa] leading-snug mt-0.5">{f.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="ap flex items-center gap-3 pt-2" style={{ opacity: 0 }}>
                <div className="w-1.5 h-1.5 rounded-full bg-[#22c55e]" />
                <span className="font-body text-[10px] tracking-widest text-[#aaa] uppercase">Available immediately after signup</span>
              </div>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="px-6 md:px-16 max-w-[1440px] mx-auto mb-16">
          <div className="h-px" style={{ background: 'linear-gradient(90deg, transparent, #f0f0f0 20%, #f0f0f0 80%, transparent)' }} />
        </div>

        {/* ── Form section ────────────────────────────────────────── */}
        <div className="px-6 md:px-16 max-w-2xl mx-auto">

          {/* Heading */}
          <div ref={headRef} className="mb-12 md:mb-16">
            <div className="hl flex items-center gap-3 mb-6" style={{ opacity: 0 }}>
              <div className="w-5 h-[1.5px]" style={{ background: BOX_G }} />
              <span className="font-body text-[9px] tracking-widest3 text-[#999] uppercase">Create Your Ecosystem</span>
            </div>
            <h1
              className="hl font-sans font-700 leading-[0.9] tracking-tight bg-clip-text text-transparent mb-5"
              style={{ fontSize: 'clamp(2.2rem, 5vw, 4.5rem)', backgroundImage: BOX_G, opacity: 0 }}
            >
              Tell us about<br />yourself.
            </h1>
            <p className="hl font-body font-300 text-[#888] text-sm md:text-base leading-relaxed max-w-sm" style={{ opacity: 0 }}>
              Your biology is unique. Your protocol should be too.
            </p>
          </div>

          <form ref={formRef} onSubmit={handleSubmit} noValidate>
            <div className="grid grid-cols-2 gap-x-8 gap-y-9">

              {/* Gender */}
              <div className="fi col-span-2 flex flex-col gap-3" style={{ opacity: 0 }}>
                <label className="font-body text-[9px] tracking-widest2 text-[#aaa] uppercase">Gender</label>
                <div className="flex gap-5 pt-1">
                  {(['male', 'female'] as const).map(g => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => setForm(p => ({ ...p, gender: g }))}
                      className="font-sans font-300 text-xl tracking-tight pb-3 border-b-2 transition-all duration-300"
                      style={{
                        color: form.gender === g ? '#111' : '#ccc',
                        borderBottomColor: form.gender === g ? 'transparent' : 'transparent',
                        borderImage: form.gender === g ? BOX_G + ' 1' : 'none',
                        borderBottomStyle: 'solid',
                      }}
                    >
                      {g.charAt(0).toUpperCase() + g.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Password */}
              <div className="fi col-span-2 flex flex-col gap-2" style={{ opacity: 0 }}>
                <label className="font-body text-[9px] tracking-widest2 text-[#aaa] uppercase">Create Password</label>
                <input
                  type="password"
                  value={form.password}
                  onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                  placeholder="Min. 6 characters"
                  autoComplete="new-password"
                  className="w-full bg-transparent border-0 border-b border-[#e8e8e8] pb-3 pt-1 font-sans font-300 text-[#111] text-lg md:text-xl tracking-tight placeholder:text-[#ddd] placeholder:font-body placeholder:text-sm focus:outline-none transition-colors duration-300 focus:border-[#ccc]"
                />
              </div>

              {/* Profile fields */}
              {FIELDS.map((field) => (
                <div
                  key={field.id}
                  className={`fi flex flex-col gap-2 ${field.col === 'full' ? 'col-span-2' : 'col-span-2 md:col-span-1'}`}
                  style={{ opacity: 0 }}
                >
                  <label htmlFor={field.id} className="font-body text-[9px] tracking-widest2 text-[#aaa] uppercase">
                    {field.label}
                  </label>
                  <input
                    id={field.id}
                    type={field.type}
                    value={form[field.id]}
                    onChange={e => handleChange(field.id, e.target.value)}
                    placeholder={field.placeholder}
                    required={field.id === 'name'}
                    min={field.type === 'number' ? 0 : undefined}
                    className="w-full bg-transparent border-0 border-b border-[#e8e8e8] pb-3 pt-1 font-sans font-300 text-[#111] text-lg md:text-xl tracking-tight placeholder:text-[#ddd] placeholder:font-body placeholder:text-sm focus:outline-none transition-colors duration-300 focus:border-[#ccc] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                </div>
              ))}
            </div>

            {error && <p className="mt-8 font-body text-[11px] text-red-400 tracking-wide">{error}</p>}

            <div className="mt-12 md:mt-16 flex flex-col sm:flex-row items-start sm:items-center gap-6">
              <button
                type="submit"
                disabled={submitting || !form.password || !form.name.trim()}
                className="sb group inline-flex items-center gap-4 px-10 py-4 rounded-full text-white font-sans font-600 text-sm tracking-widest uppercase hover:opacity-88 transition-opacity duration-300 disabled:opacity-40"
                style={{ opacity: 0, background: BOX_G }}
              >
                <span>{submitting ? 'Creating profile...' : 'Send Profile'}</span>
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-white/20 group-hover:translate-x-1 transition-transform duration-300">
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                    <path d="M2 5h6M5.5 2.5L8 5l-2.5 2.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </span>
              </button>
              <p className="font-body text-[10px] tracking-widest text-[#ccc] uppercase">
                Free · No credit card required
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
