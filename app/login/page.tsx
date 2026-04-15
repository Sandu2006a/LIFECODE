'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { gsap } from 'gsap';

export default function LoginPage() {
  const router  = useRouter();
  const headRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  useEffect(() => {
    gsap.fromTo([headRef.current, formRef.current],
      { opacity: 0, y: 30 },
      { opacity: 1, y: 0, duration: 0.9, ease: 'power3.out', stagger: 0.15, delay: 0.2 }
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
    <div className="min-h-screen bg-black text-lc-silver flex flex-col">
      <nav className="flex items-center justify-between px-8 md:px-16 py-6 border-b border-lc-line">
        <Link href="/" className="font-sans font-700 text-sm tracking-widest2 text-white uppercase select-none">LIFECODE</Link>
        <Link href="/ecosystem" className="font-body text-xs tracking-widest text-lc-dim hover:text-lc-silver transition-colors duration-300 uppercase">
          Create Account
        </Link>
      </nav>

      <div className="flex-1 flex flex-col items-center justify-center px-6 pb-20">
        <div ref={headRef} className="text-center mb-14" style={{ opacity: 0 }}>
          <p className="font-body text-[10px] tracking-widest2 text-lc-dim uppercase mb-5">Athlete Portal</p>
          <h1 className="font-sans font-700 text-white leading-tight tracking-tight" style={{ fontSize: 'clamp(2rem, 4vw, 3.5rem)' }}>
            Welcome back.
          </h1>
        </div>

        <form ref={formRef} onSubmit={handleLogin} className="w-full max-w-sm space-y-10" style={{ opacity: 0 }}>
          <div className="flex flex-col gap-2">
            <label className="font-body text-[9px] tracking-widest2 text-lc-dim uppercase">Username</label>
            <input type="text" value={username} onChange={e => setUsername(e.target.value)}
              placeholder="Your username" autoComplete="username"
              className="w-full bg-transparent border-0 border-b border-lc-line pb-3 pt-1 font-sans font-300 text-white text-xl tracking-tight placeholder:text-white/15 placeholder:font-body placeholder:text-sm focus:outline-none focus:border-lc-silver/40 transition-colors duration-300"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="font-body text-[9px] tracking-widest2 text-lc-dim uppercase">Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)}
              placeholder="••••••••" autoComplete="current-password"
              className="w-full bg-transparent border-0 border-b border-lc-line pb-3 pt-1 font-sans font-300 text-white text-xl tracking-tight placeholder:text-white/15 placeholder:font-body placeholder:text-sm focus:outline-none focus:border-lc-silver/40 transition-colors duration-300"
            />
          </div>

          {error && <p className="font-body text-[11px] text-red-400/80 tracking-wide">{error}</p>}

          <button type="submit" disabled={loading || !username.trim() || !password}
            className="group relative inline-flex items-center justify-center w-full px-10 py-4 rounded-full bg-white text-black font-sans font-600 text-sm tracking-widest uppercase transition-all duration-500 hover:bg-lc-silver overflow-hidden disabled:opacity-40">
            <span className="btn-shimmer absolute inset-0 rounded-full" />
            <span className="relative z-10">{loading ? 'Signing in...' : 'Enter'}</span>
          </button>

          <p className="text-center font-body text-[10px] tracking-widest text-lc-dim/40 uppercase">
            No account?{' '}
            <Link href="/ecosystem" className="text-lc-dim hover:text-lc-silver transition-colors duration-300">
              Create your ecosystem
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
