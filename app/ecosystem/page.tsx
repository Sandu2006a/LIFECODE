'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { gsap } from 'gsap';

const FIELDS = [
  { id: 'name',   label: 'Name',                       placeholder: 'e.g. Alex',                      type: 'text',   col: 'full' },
  { id: 'age',    label: 'Age',                        placeholder: 'e.g. 26',                        type: 'number', col: 'half' },
  { id: 'height', label: 'Height (cm)',                placeholder: 'e.g. 182',                       type: 'number', col: 'half' },
  { id: 'weight', label: 'Weight (kg)',                placeholder: 'e.g. 78',                        type: 'number', col: 'half' },
  { id: 'sport',  label: 'Sport',                      placeholder: 'e.g. Triathlon',                 type: 'text',   col: 'half' },
  { id: 'result', label: 'Best Result in This Sport',  placeholder: 'e.g. Sub 4h 30min Ironman 70.3', type: 'text',   col: 'full' },
] as const;

type FieldId = (typeof FIELDS)[number]['id'];
type FormState = Record<FieldId, string> & { gender: 'male' | 'female'; password: string };

const ArrowLeftIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 12H5"/><path d="M12 19l-7-7 7-7"/>
  </svg>
);

export default function EcosystemPage() {
  const router  = useRouter();
  const headRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

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

    // Step 1: Create account
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

    // Step 2: Save profile + get AI targets
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
      { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 0.9, stagger: 0.1 }
    ).fromTo(formRef.current!.querySelectorAll('.fi'),
      { opacity: 0, y: 28 }, { opacity: 1, y: 0, duration: 0.7, stagger: 0.07 }, '-=0.4'
    ).fromTo(formRef.current!.querySelector('.sb'),
      { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.5 }, '-=0.2'
    );
  }, []);

  return (
    <div className="min-h-screen bg-black text-lc-silver font-body">
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-5 md:px-16 py-5 md:py-6 border-b border-lc-line bg-black/90 backdrop-blur-md">
        <Link href="/" className="flex items-center gap-3 text-lc-dim hover:text-lc-silver transition-colors duration-300">
          <ArrowLeftIcon />
          <span className="font-body text-xs tracking-widest uppercase">Back</span>
        </Link>
        <span className="font-sans font-700 text-sm tracking-widest2 text-white uppercase select-none">LIFECODE</span>
        <Link href="/login" className="font-body text-xs tracking-widest text-lc-dim hover:text-lc-silver transition-colors duration-300 uppercase">Log In</Link>
      </nav>

      <main className="pt-28 md:pt-36 pb-20 md:pb-28 px-5 md:px-16 max-w-3xl mx-auto">
        <div ref={headRef} className="mb-10 md:mb-16">
          <p className="hl font-body text-[10px] tracking-widest2 text-lc-dim uppercase mb-5 md:mb-6" style={{ opacity: 0 }}>Create Your Ecosystem</p>
          <h1 className="hl font-sans font-700 text-white leading-tight tracking-tight" style={{ fontSize: 'clamp(1.9rem,5vw,4.8rem)', opacity: 0 }}>Tell us about<br />yourself.</h1>
          <p className="hl font-body font-300 text-lc-dim text-sm md:text-base leading-relaxed mt-4 md:mt-5 max-w-md" style={{ opacity: 0 }}>Your biology is unique. Your protocol should be too.</p>
        </div>

        <form ref={formRef} onSubmit={handleSubmit} noValidate>
          <div className="grid grid-cols-2 gap-x-6 md:gap-x-10 gap-y-8 md:gap-y-11">

            {/* Gender */}
            <div className="fi col-span-2 flex flex-col gap-2" style={{ opacity: 0 }}>
              <label className="font-body text-[9px] tracking-widest2 text-lc-dim uppercase">Gender</label>
              <div className="flex gap-6 pt-1">
                {(['male', 'female'] as const).map(g => (
                  <button key={g} type="button" onClick={() => setForm(p => ({ ...p, gender: g }))}
                    className={`font-sans font-300 text-xl tracking-tight pb-3 border-b transition-colors duration-300 ${form.gender === g ? 'text-white border-lc-silver/40' : 'text-white/20 border-transparent hover:text-white/50'}`}>
                    {g.charAt(0).toUpperCase() + g.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Password */}
            <div className="fi col-span-2 flex flex-col gap-2" style={{ opacity: 0 }}>
              <label className="font-body text-[9px] tracking-widest2 text-lc-dim uppercase">Create Password</label>
              <input type="password" value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                placeholder="Min. 6 characters" autoComplete="new-password"
                className="w-full bg-transparent border-0 border-b border-lc-line pb-3 pt-1 font-sans font-300 text-white text-lg md:text-xl tracking-tight placeholder:text-white/15 placeholder:font-body placeholder:text-sm focus:outline-none focus:border-lc-silver/40 transition-colors duration-300"
              />
            </div>

            {/* Profile fields */}
            {FIELDS.map((field) => (
              <div key={field.id} className={`fi flex flex-col gap-2 ${field.col === 'full' ? 'col-span-2' : 'col-span-2 md:col-span-1'}`} style={{ opacity: 0 }}>
                <label htmlFor={field.id} className="font-body text-[9px] tracking-widest2 text-lc-dim uppercase">{field.label}</label>
                <input id={field.id} type={field.type} value={form[field.id]}
                  onChange={e => handleChange(field.id, e.target.value)}
                  placeholder={field.placeholder} required={field.id === 'name'}
                  min={field.type === 'number' ? 0 : undefined}
                  className="w-full bg-transparent border-0 border-b border-lc-line pb-3 pt-1 font-sans font-300 text-white text-lg md:text-xl tracking-tight placeholder:text-white/15 placeholder:font-body placeholder:text-sm focus:outline-none focus:border-lc-silver/40 transition-colors duration-300 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
              </div>
            ))}
          </div>

          {error && <p className="mt-8 font-body text-[11px] text-red-400/80 tracking-wide">{error}</p>}

          <div className="mt-12 md:mt-16">
            <button type="submit" disabled={submitting || !form.password || !form.name.trim()}
              className="sb group relative inline-flex items-center justify-center gap-4 w-full md:w-auto px-10 py-4 rounded-full bg-white text-black font-sans font-600 text-sm tracking-widest uppercase transition-all duration-500 hover:bg-lc-silver overflow-hidden disabled:opacity-40"
              style={{ opacity: 0 }}>
              <span className="btn-shimmer absolute inset-0 rounded-full" />
              <span className="relative z-10">{submitting ? 'Creating profile...' : 'Send Profile'}</span>
              <span className="relative z-10 flex items-center justify-center w-5 h-5 rounded-full bg-black/10 transition-transform duration-500 group-hover:translate-x-1">
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                  <path d="M2 5h6M5.5 2.5L8 5l-2.5 2.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </span>
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
