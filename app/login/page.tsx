'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { gsap } from 'gsap';

const BOX_G = 'linear-gradient(135deg, #FF8A00 0%, #C62828 40%, #7C3AED 70%, #1D4ED8 100%)';

export default function LoginPage() {
  const router  = useRouter();
  const headRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  useEffect(() => {
    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
    tl.fromTo(headRef.current,
      { opacity: 0, y: 25 },
      { opacity: 1, y: 0, duration: 0.7, delay: 0.15 }
    ).fromTo(formRef.current,
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.6 }, '-=0.3'
    );
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) return;
    setLoading(true);
    setError('');

    const res  = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    const data = await res.json();

    if (!res.ok) {
      setError(data.error || 'Login failed.');
      setLoading(false);
      return;
    }

    router.push('/dashboard');
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-white font-body flex flex-col">

      {/* Nav */}
      <nav className="flex items-center justify-between px-6 md:px-16 py-5 border-b border-[#f0f0f0]">
        <Link href="/"
          className="font-sans font-700 text-sm tracking-[0.3em] uppercase select-none bg-clip-text text-transparent"
          style={{ backgroundImage: BOX_G }}
        >
          LIFECODE
        </Link>
        <Link href="/ecosystem"
          className="font-body text-[10px] tracking-widest text-[#888] hover:text-[#333] transition-colors duration-300 uppercase"
        >
          Create Account
        </Link>
      </nav>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 pb-16">

        <div ref={headRef} className="text-center mb-14 max-w-sm" style={{ opacity: 0 }}>
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="w-5 h-[1.5px]" style={{ background: BOX_G }} />
            <span className="font-body text-[9px] tracking-widest3 text-[#aaa] uppercase">Athlete Portal</span>
            <div className="w-5 h-[1.5px]" style={{ background: BOX_G }} />
          </div>
          <h1
            className="font-sans font-700 leading-[0.9] tracking-tight bg-clip-text text-transparent"
            style={{ fontSize: 'clamp(2.4rem, 5vw, 4rem)', backgroundImage: BOX_G }}
          >
            Welcome back.
          </h1>
          <p className="font-body font-300 text-[#aaa] text-sm leading-loose mt-4">
            Enter your credentials to access your dashboard.
          </p>
        </div>

        <form
          ref={formRef}
          onSubmit={handleLogin}
          className="w-full max-w-sm space-y-10"
          style={{ opacity: 0 }}
        >
          <div className="flex flex-col gap-2">
            <label className="font-body text-[9px] tracking-widest2 text-[#bbb] uppercase">Username</label>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="Your username"
              autoComplete="username"
              className="w-full bg-transparent border-0 border-b border-[#e8e8e8] pb-3 pt-1 font-sans font-300 text-[#111] text-xl tracking-tight placeholder:text-[#ddd] placeholder:font-body placeholder:text-sm focus:outline-none focus:border-[#bbb] transition-colors duration-300"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="font-body text-[9px] tracking-widest2 text-[#bbb] uppercase">Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
              className="w-full bg-transparent border-0 border-b border-[#e8e8e8] pb-3 pt-1 font-sans font-300 text-[#111] text-xl tracking-tight placeholder:text-[#ddd] placeholder:font-body placeholder:text-sm focus:outline-none focus:border-[#bbb] transition-colors duration-300"
            />
          </div>

          {error && <p className="font-body text-[11px] text-red-400 tracking-wide">{error}</p>}

          <button
            type="submit"
            disabled={loading || !username.trim() || !password}
            className="group inline-flex items-center justify-center w-full gap-4 px-10 py-4 rounded-full text-white font-sans font-600 text-sm tracking-widest uppercase hover:opacity-88 transition-opacity duration-300 disabled:opacity-40"
            style={{ background: BOX_G }}
          >
            <span>{loading ? 'Signing in...' : 'Enter'}</span>
            <span className="flex items-center justify-center w-5 h-5 rounded-full bg-white/20 group-hover:translate-x-1 transition-transform duration-300">
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                <path d="M2 5h6M5.5 2.5L8 5l-2.5 2.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </span>
          </button>

          <p className="text-center font-body text-[10px] tracking-widest text-[#ccc] uppercase">
            No account?{' '}
            <Link href="/ecosystem" className="text-[#999] hover:text-[#444] transition-colors duration-300">
              Create your ecosystem
            </Link>
          </p>
        </form>

      </div>
    </div>
  );
}
