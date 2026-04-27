'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { gsap } from 'gsap';
import { createSupabaseBrowser } from '@/lib/supabase';

const BOX_G = 'linear-gradient(135deg, #FF8A00 0%, #C62828 40%, #7C3AED 70%, #1D4ED8 100%)';

function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}

export default function LoginPage() {
  const router  = useRouter();
  const cardRef = useRef<HTMLDivElement>(null);

  const [mode, setMode]           = useState<'signin' | 'signup'>('signin');
  const [email, setEmail]         = useState('');
  const [password, setPassword]   = useState('');
  const [confirm, setConfirm]     = useState('');
  const [error, setError]         = useState('');
  const [loading, setLoading]     = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const supabase = createSupabaseBrowser();

  useEffect(() => {
    gsap.fromTo(cardRef.current,
      { opacity: 0, y: 30 },
      { opacity: 1, y: 0, duration: 0.7, ease: 'power3.out', delay: 0.1 }
    );
  }, []);

  const handleGoogle = async () => {
    setGoogleLoading(true);
    setError('');
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/dashboard` },
    });
    if (error) { setError(error.message); setGoogleLoading(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !password) return;

    if (mode === 'signup') {
      if (password !== confirm) { setError('Passwords do not match.'); return; }
      if (password.length < 6)  { setError('Password must be at least 6 characters.'); return; }
    }

    setLoading(true);

    if (mode === 'signin') {
      const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (error) { setError(error.message); setLoading(false); return; }
      router.push('/dashboard');
      router.refresh();
    } else {
      const { error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: { emailRedirectTo: `${window.location.origin}/dashboard` },
      });
      if (error) { setError(error.message); setLoading(false); return; }
      setError('');
      setLoading(false);
      // Show success state
      setMode('signin');
      setEmail('');
      setPassword('');
      setConfirm('');
      alert('Account created! Check your email to confirm, then sign in.');
    }
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
          Get Access
        </Link>
      </nav>

      {/* Card */}
      <div className="flex-1 flex items-center justify-center px-6 py-16">
        <div ref={cardRef} className="w-full max-w-md bg-white rounded-3xl border border-[#f0f0f0] shadow-[0_8px_60px_rgba(0,0,0,0.07)] p-10" style={{ opacity: 0 }}>

          {/* Logo + heading */}
          <div className="text-center mb-10">
            <div className="flex items-center justify-center gap-3 mb-5">
              <div className="w-5 h-[1.5px]" style={{ background: BOX_G }} />
              <span className="font-body text-[13px] tracking-widest text-[#aaa] uppercase">Athlete Portal</span>
              <div className="w-5 h-[1.5px]" style={{ background: BOX_G }} />
            </div>
            <h1 className="font-sans font-700 text-[#111] tracking-tight leading-none mb-3"
              style={{ fontSize: 'clamp(2rem, 4vw, 2.8rem)' }}>
              {mode === 'signin' ? 'Welcome back.' : 'Create account.'}
            </h1>
            <p className="font-body text-[15px] text-[#aaa] leading-relaxed">
              {mode === 'signin'
                ? 'Sign in to access your protocol.'
                : 'Join LIFECODE — free during launch.'}
            </p>
          </div>

          {/* Tabs */}
          <div className="flex bg-[#f5f5f5] rounded-full p-1 mb-8">
            {(['signin', 'signup'] as const).map(m => (
              <button
                key={m}
                onClick={() => { setMode(m); setError(''); }}
                className={`flex-1 py-2.5 rounded-full font-sans font-600 text-[13px] tracking-widest uppercase transition-all duration-300 ${
                  mode === m
                    ? 'bg-white text-[#111] shadow-sm'
                    : 'text-[#aaa]'
                }`}
              >
                {m === 'signin' ? 'Sign In' : 'Sign Up'}
              </button>
            ))}
          </div>

          {/* Google button */}
          <button
            onClick={handleGoogle}
            disabled={googleLoading}
            className="w-full flex items-center justify-center gap-3 border border-[#e8e8e8] rounded-full py-3.5 mb-6 hover:border-[#ccc] hover:bg-[#fafafa] transition-all duration-200 disabled:opacity-50"
          >
            <GoogleIcon />
            <span className="font-sans font-600 text-[14px] text-[#333]">
              {googleLoading ? 'Connecting...' : 'Continue with Google'}
            </span>
          </button>

          {/* Divider */}
          <div className="flex items-center gap-4 mb-6">
            <div className="flex-1 h-px bg-[#f0f0f0]" />
            <span className="font-body text-[13px] text-[#ccc] uppercase tracking-widest">or</span>
            <div className="flex-1 h-px bg-[#f0f0f0]" />
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">

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
              <p className="font-body text-[14px] text-red-500 tracking-wide">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading || !email.trim() || !password || (mode === 'signup' && !confirm)}
              className="w-full py-4 rounded-full text-white font-sans font-700 text-[14px] tracking-widest uppercase hover:opacity-88 transition-opacity duration-300 disabled:opacity-40 mt-2"
              style={{ background: BOX_G }}
            >
              {loading
                ? (mode === 'signin' ? 'Signing in...' : 'Creating account...')
                : (mode === 'signin' ? 'Sign In →' : 'Create Account →')}
            </button>

          </form>

          <p className="text-center font-body text-[14px] text-[#ccc] mt-8">
            {mode === 'signin' ? "Don't have an account? " : 'Already have an account? '}
            <button
              onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setError(''); }}
              className="text-[#999] hover:text-[#444] transition-colors duration-200 underline underline-offset-2"
            >
              {mode === 'signin' ? 'Sign up free' : 'Sign in'}
            </button>
          </p>

        </div>
      </div>
    </div>
  );
}
