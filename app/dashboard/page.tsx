'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { gsap } from 'gsap';
import { Send, Activity, ChevronDown, LogOut } from 'lucide-react';
import WorkoutTimeline from '@/components/WorkoutTimeline';
import GelAlert        from '@/components/GelAlert';
import { useGelAlert }        from '@/hooks/useGelAlert';

/* ─── Types ─────────────────────────────────────────────────────── */
interface Profile {
  user_id: string; name: string; gender: string;
  age: string; height: string; weight: string;
  sport: string; result: string;
  calories_target: number; protein_target: number;
  carbs_target: number; fats_target: number;
}
interface Totals  { calories: number; protein: number; carbs: number; fats: number; }
interface Msg     { role: 'user' | 'ai'; text: string; }

/* ─── Micros (static) ────────────────────────────────────────────── */
const MICROS = [
  { label: 'Vitamin D3',   unit: 'IU',  current: 0, target: 5000 },
  { label: 'Vitamin K2',   unit: 'mcg', current: 0, target: 200  },
  { label: 'Zinc',         unit: 'mg',  current: 0, target: 25   },
  { label: 'Magnesium',    unit: 'mg',  current: 0, target: 300  },
  { label: 'B-Complex',    unit: '%',   current: 0, target: 100  },
  { label: 'L-Carnitine',  unit: 'g',   current: 0, target: 2    },
  { label: 'Beta-Alanine', unit: 'g',   current: 0, target: 3.2  },
  { label: 'Creatine',     unit: 'g',   current: 0, target: 5    },
];

/* ─── Clock ──────────────────────────────────────────────────────── */
function useClock() {
  const [time, setTime] = useState('');
  useEffect(() => {
    const tick = () => setTime(new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  return time;
}

/* ─── Progress Bar ───────────────────────────────────────────────── */
function Bar({ label, unit, current, target, delay, dim = false }: {
  label: string; unit: string; current: number; target: number; delay: number; dim?: boolean;
}) {
  const barRef  = useRef<HTMLDivElement>(null);
  const prevPct = useRef(0);
  const pct     = Math.min(target > 0 ? (current / target) * 100 : 0, 100);
  const fmt     = (n: number) => n % 1 !== 0 ? n.toFixed(1) : Math.round(n);

  useEffect(() => {
    if (!barRef.current) return;
    gsap.fromTo(barRef.current,
      { width: `${prevPct.current}%` },
      { width: `${pct}%`, duration: 0.9, ease: 'power3.out', delay: prevPct.current === 0 && pct > 0 ? delay : 0 }
    );
    prevPct.current = pct;
  }, [pct, delay]);

  return (
    <div className="space-y-[6px]">
      <div className="flex items-baseline justify-between gap-3">
        <span className="font-body text-[10px] tracking-widest uppercase text-lc-silver/70 truncate">{label}</span>
        <span className="font-sans text-[11px] tabular-nums text-white/70 flex-shrink-0">
          {fmt(current)}<span className="text-lc-dim mx-0.5">/</span>{fmt(target)}
          <span className="text-lc-dim/50 ml-0.5 text-[9px]">{unit}</span>
        </span>
      </div>
      <div className="h-px bg-lc-line">
        <div ref={barRef} className="h-px" style={{ width: '0%', background: dim ? '#555555' : 'linear-gradient(to right, #888888, #E5E5E5)' }} />
      </div>
    </div>
  );
}

/* ─── Dashboard ──────────────────────────────────────────────────── */
export default function Dashboard() {
  const time   = useClock();
  const router = useRouter();

  const [profile,    setProfile]    = useState<Profile | null>(null);
  const [userId,     setUserId]     = useState<string | null>(null);
  const [totals,     setTotals]     = useState<Totals>({ calories: 0, protein: 0, carbs: 0, fats: 0 });
  const [msgs,       setMsgs]       = useState<Msg[]>([{ role: 'ai', text: 'Protocol loaded. Long-term memory active. Log a meal or ask anything.' }]);
  const [input,      setInput]      = useState('');
  const [loading,    setLoading]    = useState(false);
  const [dataReady,  setDataReady]  = useState(false);
  const [microsOpen, setMicrosOpen] = useState(false);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const pageRef    = useRef<HTMLDivElement>(null);
  const microsRef  = useRef<HTMLDivElement>(null);

  const { gel, dismiss: dismissGel } = useGelAlert(userId);

  const handleGelTaken = async (workoutId: string) => {
    dismissGel(workoutId);
    if (!userId || !gel) return;
    // Silently tell the AI via memory
    await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [{ role: 'user', text: `I just took my energy gel before my ${gel.workoutType} session at ${gel.workoutTime}.` }],
        profile,
        macros: [],
        micros: [],
        user_id: userId,
        silent: true,
      }),
    });
  };

  /* ── Fetch today's totals ─────────────────────────────────────── */
  const fetchTotals = useCallback(async (uid: string) => {
    const today = new Date().toISOString().split('T')[0];
    const res   = await fetch(`/api/food-log?user_id=${uid}&date=${today}`);
    const { data } = await res.json();
    if (!data) return;
    const t = (data as { calories: number; protein: number; carbs: number; fats: number }[]).reduce(
      (acc, l) => ({ calories: acc.calories + (l.calories || 0), protein: acc.protein + (l.protein || 0), carbs: acc.carbs + (l.carbs || 0), fats: acc.fats + (l.fats || 0) }),
      { calories: 0, protein: 0, carbs: 0, fats: 0 }
    );
    setTotals(t);
  }, []);

  /* ── Auth + load profile ──────────────────────────────────────── */
  useEffect(() => {
    const init = async () => {
      const meRes = await fetch('/api/auth/me');
      if (!meRes.ok) { router.push('/login'); return; }
      const { user } = await meRes.json();
      if (!user) { router.push('/login'); return; }
      setUserId(user.userId);

      const res = await fetch(`/api/analyze-profile?user_id=${user.userId}`);
      const { data } = await res.json();
      if (data) setProfile(data);

      await fetchTotals(user.userId);
      setDataReady(true);
    };
    init();
  }, [router, fetchTotals]);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [msgs]);

  useEffect(() => {
    if (!pageRef.current) return;
    gsap.fromTo(pageRef.current.querySelectorAll('.ci'),
      { opacity: 0, y: 18 },
      { opacity: 1, y: 0, duration: 0.85, ease: 'power3.out', stagger: 0.1, delay: 0.15 }
    );
  }, []);

  useEffect(() => {
    if (!microsRef.current) return;
    gsap.to(microsRef.current, { height: microsOpen ? 'auto' : 0, duration: 0.5, ease: 'power3.inOut' });
  }, [microsOpen]);

  /* ── Sign out ─────────────────────────────────────────────────── */
  const handleSignOut = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  };

  /* ── Send message ─────────────────────────────────────────────── */
  const sendMsg = async () => {
    const t = input.trim();
    if (!t || loading || !profile || !userId) return;
    const updated: Msg[] = [...msgs, { role: 'user', text: t }];
    setMsgs(updated);
    setInput('');
    setLoading(true);

    const macrosForAI = [
      { label: 'Protein',       unit: 'g',    current: totals.protein,  target: profile.protein_target  },
      { label: 'Carbohydrates', unit: 'g',    current: totals.carbs,    target: profile.carbs_target    },
      { label: 'Fats',          unit: 'g',    current: totals.fats,     target: profile.fats_target     },
      { label: 'Kilocalories',  unit: 'kcal', current: totals.calories, target: profile.calories_target },
    ];

    try {
      const res  = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: updated, profile, macros: macrosForAI, micros: MICROS, user_id: userId }),
      });
      const data = await res.json();
      setMsgs(p => [...p, { role: 'ai', text: data.text }]);
      await fetchTotals(userId);
    } catch {
      setMsgs(p => [...p, { role: 'ai', text: 'Connection error — retrying protocol.' }]);
    } finally {
      setLoading(false);
    }
  };

  const displayName = (profile?.name || '').toUpperCase();

  return (
    <div ref={pageRef} className="h-screen bg-lc-black text-lc-silver flex flex-col overflow-hidden" style={{ fontFamily: 'var(--font-space), system-ui, sans-serif' }}>

      {/* ── Header ────────────────────────────────────────────────── */}
      <header className="ci flex-shrink-0 flex items-center justify-between px-8 py-4 border-b border-lc-line" style={{ opacity: 0 }}>
        <Link href="/" className="font-sans font-700 text-xs tracking-widest2 text-white uppercase select-none hover:text-lc-silver transition-colors duration-300">LIFECODE</Link>
        <div className="flex items-center gap-3">
          <span className="w-1 h-1 rounded-full bg-lc-silver/40" />
          <span className="font-body text-[9px] tracking-widest text-lc-dim uppercase">{displayName}</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="font-sans text-[10px] tabular-nums text-lc-dim tracking-widest">{time}</span>
          <button onClick={handleSignOut} className="text-lc-dim hover:text-lc-silver transition-colors duration-300" title="Sign out">
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* ── Proactive Alerts ──────────────────────────────────────── */}

      {/* ── Body ────────────────────────────────────────────────────── */}
      <div className="flex flex-1 min-h-0">

        {/* ══ CENTER — Chat ══════════════════════════════════════════ */}
        <main className="ci flex-1 flex flex-col min-h-0 min-w-0" style={{ opacity: 0 }}>
          <div className="flex-shrink-0 px-10 pt-8 pb-5 border-b border-lc-line">
            <p className="font-body text-[9px] tracking-widest2 text-lc-dim uppercase mb-2">AI Nutrition Architect · Long-Term Memory Active</p>
            <h2 className="font-sans font-600 text-white leading-snug tracking-tight" style={{ fontSize: 'clamp(1rem, 1.8vw, 1.3rem)' }}>
              Log meals or ask about your <span className="text-lc-dim">performance protocol.</span>
            </h2>
          </div>

          <div className="flex-1 overflow-y-auto px-10 py-7 space-y-5 custom-scrollbar">
            {msgs.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'ai' ? (
                  <div className="flex items-start gap-3 max-w-[82%]">
                    <div className="mt-0.5 flex-shrink-0 w-[18px] h-[18px] rounded-full border border-lc-line flex items-center justify-center">
                      <Activity className="w-2.5 h-2.5 text-lc-dim" />
                    </div>
                    <p className="font-body text-sm text-lc-dim leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                  </div>
                ) : (
                  <div className="max-w-[78%] border border-lc-line rounded-2xl rounded-br-sm px-4 py-2.5">
                    <p className="font-body text-sm text-lc-silver leading-relaxed">{msg.text}</p>
                  </div>
                )}
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex-shrink-0 w-[18px] h-[18px] rounded-full border border-lc-line flex items-center justify-center">
                    <Activity className="w-2.5 h-2.5 text-lc-dim animate-pulse" />
                  </div>
                  <p className="font-body text-sm text-lc-dim/50">Analyzing...</p>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          <div className="flex-shrink-0 px-10 pb-8 pt-4 border-t border-lc-line flex justify-center">
            <div className="w-full max-w-md flex items-center gap-3 rounded-full border border-lc-line px-5 py-2.5 focus-within:border-lc-silver/30 transition-colors duration-300 bg-lc-black">
              <input type="text" value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMsg(); } }}
                placeholder="Log a meal, share how you feel, ask anything..."
                className="flex-1 bg-transparent text-sm text-lc-silver placeholder:text-lc-dim/40 focus:outline-none font-body"
              />
              <button onClick={sendMsg} disabled={!input.trim() || loading}
                className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center border border-lc-line hover:border-lc-silver/40 hover:text-white disabled:opacity-20 transition-all duration-300 text-lc-dim">
                <Send className="w-3 h-3" />
              </button>
            </div>
          </div>
        </main>

        {/* ══ RIGHT — Nutrients + Timeline ══════════════════════════ */}
        <aside className="ci flex-shrink-0 w-[320px] border-l border-white/[0.08] bg-white/[0.03] flex flex-col overflow-y-auto custom-scrollbar" style={{ opacity: 0 }}>

          {/* Operator */}
          <div className="px-7 pt-7 pb-6 border-b border-white/[0.07]">
            <p className="font-sans text-[10px] tracking-widest2 text-lc-dim uppercase mb-3">Operator</p>
            <p className="font-sans font-700 text-white text-2xl tracking-tight leading-none">{displayName}</p>
            {profile?.sport && <p className="font-sans text-[12px] text-lc-silver/50 tracking-wide mt-2">{profile.sport}</p>}
            {profile && (
              <p className="font-sans text-[11px] text-lc-dim/60 mt-1.5 tabular-nums">
                {profile.age}y · {profile.weight}kg · {profile.height}cm
              </p>
            )}
          </div>

          {/* Workout Timeline */}
          {userId && <WorkoutTimeline userId={userId} />}

          {/* Macro nutrients */}
          <div className="px-7 pt-6 pb-6 border-b border-white/[0.07] space-y-5">
            <p className="font-sans text-[10px] tracking-widest2 text-lc-dim uppercase">Macro Nutrients</p>
            {dataReady && profile && [
              { label: 'Protein',       unit: 'g',    current: totals.protein,  target: profile.protein_target  },
              { label: 'Carbohydrates', unit: 'g',    current: totals.carbs,    target: profile.carbs_target    },
              { label: 'Fats',          unit: 'g',    current: totals.fats,     target: profile.fats_target     },
              { label: 'Kilocalories',  unit: 'kcal', current: totals.calories, target: profile.calories_target },
            ].map((m, i) => <Bar key={m.label} {...m} delay={0.3 + i * 0.07} />)}
          </div>

          {/* Micro + Supplements */}
          <div className="border-b border-white/[0.07]">
            <button onClick={() => setMicrosOpen(v => !v)}
              className="w-full flex items-center justify-between px-7 py-4 hover:bg-white/[0.03] transition-colors duration-300 group">
              <p className="font-sans text-[10px] tracking-widest2 text-lc-dim uppercase group-hover:text-lc-silver transition-colors duration-300">Micro · Supplements</p>
              <ChevronDown className="w-3.5 h-3.5 text-lc-dim group-hover:text-lc-silver transition-all duration-400"
                style={{ transform: microsOpen ? 'rotate(180deg)' : 'rotate(0deg)' }} />
            </button>
            <div ref={microsRef} className="overflow-hidden" style={{ height: 0 }}>
              <div className="px-7 pb-6 space-y-4">
                <div className="flex items-center gap-3">
                  <span className="font-body text-[9px] tracking-widest2 text-lc-dim/50 uppercase">Vitamins · Minerals</span>
                  <div className="flex-1 h-px bg-lc-line" />
                </div>
                {MICROS.slice(0, 5).map((m, i) => <Bar key={m.label} {...m} delay={0.05 * i} dim />)}
                <div className="flex items-center gap-3 pt-1">
                  <span className="font-body text-[9px] tracking-widest2 text-lc-dim/50 uppercase">Supplements</span>
                  <div className="flex-1 h-px bg-lc-line" />
                </div>
                {MICROS.slice(5).map((m, i) => <Bar key={m.label} {...m} delay={0.05 * i} dim />)}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex-1 px-7 py-5">
            <p className="font-sans text-[11px] tabular-nums text-lc-dim/50">
              {totals.calories > 0 ? `${Math.round(totals.calories)} kcal logged today` : 'No meals logged yet'}
            </p>
          </div>
        </aside>
      </div>

      {/* ── Gel Alert ─────────────────────────────────────────────── */}
      {gel && (
        <GelAlert
          minutesUntil={gel.minutesUntil}
          workoutType={gel.workoutType}
          workoutTime={gel.workoutTime}
          onDismiss={() => handleGelTaken(gel.workoutId)}
        />
      )}
    </div>
  );
}
