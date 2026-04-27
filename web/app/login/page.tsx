'use client';

import { useEffect, useRef, useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { gsap } from 'gsap';
import { createSupabaseBrowser } from '@/lib/supabase';

const BOX_G = 'linear-gradient(135deg, #FF8A00 0%, #C62828 40%, #7C3AED 70%, #1D4ED8 100%)';

function LoginForm() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const plan         = searchParams.get('plan') || 'protocol';
  const cardRef      = useRef<HTMLDivElement>(null);
  const supabase     = createSupabaseBrowser();

  const [mode, setMode]         = useState<'signin' | 'signup'>('signin');
  const [name, setName]         = useState('');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm]   = useState('');
  const [error, setError]       = useState('');
  const [success, setSuccess]   = useState('');
  const [loading, setLoading]   = useState(false);

  useEffect(() => {
    gsap.fromTo(cardRef.current,
      { opacity: 0, y: 30 },
      { opacity: 1, y: 0, duration: 0.7, ease: 'power3.out', delay: 0.1 }
    );
  }, []);

  const switchMode = (m: 'signin' | 'signup') => {
    setMode(m); setError(''); setSuccess('');
    setName(''); setEmail(''); setPassword(''); setConfirm('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setSuccess('');

    if (mode === 'signup') {
      if (!name.trim())          { setError('Please enter your name.'); return; }
      if (password !== confirm)  { setError('Passwords do not match.'); return; }
      if (password.length < 6)   { setError('Password must be at least 6 characters.'); return; }
    }

    setLoading(true);

    if (mode === 'signin') {
      const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (error) { setError(error.message); setLoading(false); return; }
      router.push('/');
      router.refresh();
      return;
    }

    // Sign Up
    const { data, error: signUpErr } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: { full_name: name.trim(), display_name: name.trim() },
        emailRedirectTo: `${window.location.origin}/`,
      },
    });

    if (signUpErr) { setError(signUpErr.message); setLoading(false); return; }

    // Send activation code email
    try {
      await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), name: name.trim(), plan }),
      });
    } catch (_) {}

    setLoading(false);
    setSuccess(`Cont creat! Verifică emailul ${email.trim()} — ți-am trimis codul de activare.`);
  };

  return (
    <div className="min-h-screen bg-[#fafafa] flex flex-col">

      {/* Nav */}
      <nav className="flex items-center justify-between px-6 md:px-16 py-5 bg-white border-b border-[#f0f0f0]">
        <Link href="/"
          className="font-sans font-700 text-sm tracking-[0.3em] uppercase select-none bg-clip-text text-transparent"
          style={{ backgroundImage: BOX_G }}
        >
          LIFECODE
        </Link>
        <Link href="/pricing"
          className="font-body text-[13px] tracking-widest text-[#888] hover:text-[#333] transition-colors duration-300 uppercase"
        >
          Plans
        </Link>
      </nav>

      <div className="flex-1 flex items-center justify-center px-6 py-16">
        <div ref={cardRef} className="w-full max-w-md bg-white rounded-3xl border border-[#f0f0f0] shadow-[0_8px_60px_rgba(0,0,0,0.07)] p-10" style={{ opacity: 0 }}>

          {/* Heading */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-5">
              <div className="w-5 h-[1.5px]" style={{ background: BOX_G }} />
              <span className="font-body text-[13px] tracking-widest text-[#aaa] uppercase">Athlete Portal</span>
              <div className="w-5 h-[1.5px]" style={{ background: BOX_G }} />
            </div>
            <h1 className="font-sans font-700 text-[#111] tracking-tight leading-none mb-3"
              style={{ fontSize: 'clamp(2rem, 4vw, 2.6rem)' }}>
              {mode === 'signin' ? 'Welcome back.' : 'Create account.'}
            </h1>
            <p className="font-body text-[15px] text-[#aaa] leading-relaxed">
              {mode === 'signin'
                ? 'Sign in to access your protocol.'
                : 'Free during launch — no credit card.'}
            </p>
          </div>

          {/* Tabs */}
          <div className="flex bg-[#f5f5f5] rounded-full p-1 mb-8">
            {(['signin', 'signup'] as const).map(m => (
              <button key={m} onClick={() => switchMode(m)}
                className={`flex-1 py-2.5 rounded-full font-sans font-600 text-[13px] tracking-wide uppercase transition-all duration-300 ${
                  mode === m ? 'bg-white text-[#111] shadow-sm' : 'text-[#aaa]'
                }`}>
                {m === 'signin' ? 'Sign In' : 'Sign Up'}
              </button>
            ))}
          </div>

          {/* Success */}
          {success && (
            <div className="bg-green-50 border border-green-200 rounded-2xl px-5 py-4 mb-6">
              <p className="font-body text-[14px] text-green-700 leading-relaxed">{success}</p>
            </div>
          )}

          {/* Form */}
          {!success && (
            <form onSubmit={handleSubmit} className="flex flex-col gap-5">

              {mode === 'signup' && (
                <div className="flex flex-col gap-2">
                  <label className="font-body text-[13px] tracking-widest text-[#bbb] uppercase">Full Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Alex Railean"
                    autoComplete="name"
                    required
                    className="w-full bg-[#fafafa] border border-[#e8e8e8] rounded-2xl px-5 py-3.5 font-sans text-[16px] text-[#111] placeholder:text-[#ccc] focus:outline-none focus:border-[#bbb] transition-colors duration-200"
                  />
                </div>
              )}

              <div className="flex flex-col gap-2">
                <label className="font-body text-[13px] tracking-widest text-[#bbb] uppercase">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  autoComplete="email"
                  required
                  className="w-full bg-[#fafafa] border border-[#e8e8e8] rounded-2xl px-5 py-3.5 font-sans text-[16px] text-[#111] placeholder:text-[#ccc] focus:outline-none focus:border-[#bbb] transition-colors duration-200"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="font-body text-[13px] tracking-widest text-[#bbb] uppercase">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                  required
                  className="w-full bg-[#fafafa] border border-[#e8e8e8] rounded-2xl px-5 py-3.5 font-sans text-[16px] text-[#111] placeholder:text-[#ccc] focus:outline-none focus:border-[#bbb] transition-colors duration-200"
                />
              </div>

              {mode === 'signup' && (
                <div className="flex flex-col gap-2">
                  <label className="font-body text-[13px] tracking-widest text-[#bbb] uppercase">Confirm Password</label>
                  <input
                    type="password"
                    value={confirm}
                    onChange={e => setConfirm(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="new-password"
                    required
                    className="w-full bg-[#fafafa] border border-[#e8e8e8] rounded-2xl px-5 py-3.5 font-sans text-[16px] text-[#111] placeholder:text-[#ccc] focus:outline-none focus:border-[#bbb] transition-colors duration-200"
                  />
                </div>
              )}

              {error && (
                <p className="font-body text-[14px] text-red-500">{error}</p>
              )}

              <button
                type="submit"
                disabled={loading || !email.trim() || !password || (mode === 'signup' && (!name.trim() || !confirm))}
                className="w-full py-4 rounded-full text-white font-sans font-700 text-[15px] tracking-widest uppercase hover:opacity-88 transition-opacity duration-300 disabled:opacity-40 mt-2"
                style={{ background: BOX_G }}
              >
                {loading
                  ? (mode === 'signin' ? 'Signing in...' : 'Creating account...')
                  : (mode === 'signin' ? 'Sign In →' : 'Create Account →')}
              </button>

              <p className="text-center font-body text-[14px] text-[#ccc] mt-2">
                {mode === 'signin' ? "Don't have an account? " : 'Already have an account? '}
                <button type="button"
                  onClick={() => switchMode(mode === 'signin' ? 'signup' : 'signin')}
                  className="text-[#999] hover:text-[#444] transition-colors duration-200 underline underline-offset-2">
                  {mode === 'signin' ? 'Sign up free' : 'Sign in'}
                </button>
              </p>

            </form>
          )}

          {success && (
            <button
              onClick={() => switchMode('signin')}
              className="w-full py-4 rounded-full text-white font-sans font-700 text-[15px] tracking-widest uppercase mt-4"
              style={{ background: BOX_G }}
            >
              Sign In →
            </button>
          )}

        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#fafafa]" />}>
      <LoginForm />
    </Suspense>
  );
}
