'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { gsap } from 'gsap';
import { Send, Activity, LogOut, User, X, ChevronDown } from 'lucide-react';
import WorkoutTimeline from '@/components/WorkoutTimeline';
import GelAlert        from '@/components/GelAlert';
import { useGelAlert } from '@/hooks/useGelAlert';

/* ─── Types ─────────────────────────────────────────────────────── */
interface Profile {
  user_id: string; name: string; gender: string;
  age: string; height: string; weight: string;
  sport: string; result: string;
  calories_target: number; protein_target: number;
  carbs_target: number; fats_target: number;
}
interface Msg { role: 'user' | 'ai'; text: string; }
interface MicroEntry { label: string; unit: string; current: number; target: number; }

/* ─── Micros config ──────────────────────────────────────────────── */
const MICROS_CONFIG: MicroEntry[] = [
  { label: 'Vitamin D3',  unit: 'IU',  current: 0, target: 5000 },
  { label: 'Vitamin K2',  unit: 'mcg', current: 0, target: 200  },
  { label: 'Zinc',        unit: 'mg',  current: 0, target: 25   },
  { label: 'Magnesium',   unit: 'mg',  current: 0, target: 300  },
  { label: 'B-Complex',   unit: '%',   current: 0, target: 100  },
  { label: 'Omega-3',     unit: 'mg',  current: 0, target: 2000 },
  { label: 'Vitamin C',   unit: 'mg',  current: 0, target: 500  },
  { label: 'Iron',        unit: 'mg',  current: 0, target: 18   },
];

/* ─── Biomarkers ─────────────────────────────────────────────────── */
type BioStatus = 'optimal' | 'suboptimal' | 'deficient' | 'unknown';
interface Biomarker { label: string; ref: string; status: BioStatus; }

const BIOMARKERS: { group: string; items: Biomarker[] }[] = [
  {
    group: 'Oxygen · Energy',
    items: [
      { label: 'Ferritin',      ref: '50–200 ng/mL',  status: 'unknown' },
      { label: 'Hemoglobin',    ref: '13.5–17 g/dL',  status: 'unknown' },
      { label: 'RBC Magnesium', ref: '4.2–6.8 mg/dL', status: 'unknown' },
    ],
  },
  {
    group: 'Recovery · Stress',
    items: [
      { label: 'Cortisol (AM)',  ref: '6–23 mcg/dL',   status: 'unknown' },
      { label: 'Creatine Kinase',ref: '<200 U/L',       status: 'unknown' },
      { label: 'hs-CRP',         ref: '<1.0 mg/L',      status: 'unknown' },
    ],
  },
  {
    group: 'Hormones',
    items: [
      { label: 'Free Testosterone', ref: '9–30 ng/dL',   status: 'unknown' },
      { label: 'DHEA-S',            ref: '200–560 mcg/dL',status: 'unknown' },
    ],
  },
  {
    group: 'Vitamins · Minerals',
    items: [
      { label: 'Vitamin D3 (25-OH)', ref: '50–80 ng/mL', status: 'unknown' },
      { label: 'Vitamin B12',        ref: '400–900 pg/mL',status: 'unknown' },
      { label: 'Serum Zinc',         ref: '80–120 mcg/dL',status: 'unknown' },
    ],
  },
];

const STATUS_DOT: Record<BioStatus, { color: string; label: string }> = {
  optimal:    { color: '#4ade80', label: 'Optimal'    },
  suboptimal: { color: '#facc15', label: 'Sub-optimal'},
  deficient:  { color: '#f87171', label: 'Deficient'  },
  unknown:    { color: '#444444', label: 'Not tested' },
};

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
function Bar({ label, unit, current, target, delay }: {
  label: string; unit: string; current: number; target: number; delay: number;
}) {
  const barRef  = useRef<HTMLDivElement>(null);
  const prevPct = useRef(0);
  const pct     = Math.min(target > 0 ? (current / target) * 100 : 0, 100);
  const fmt     = (n: number) => n % 1 !== 0 ? n.toFixed(1) : Math.round(n);
  const color   = pct >= 80 ? '#4ade80' : pct >= 40 ? '#E5E5E5' : '#666666';

  useEffect(() => {
    if (!barRef.current) return;
    gsap.fromTo(barRef.current,
      { width: `${prevPct.current}%` },
      { width: `${pct}%`, duration: 0.9, ease: 'power3.out', delay: prevPct.current === 0 && pct > 0 ? delay : 0 }
    );
    prevPct.current = pct;
  }, [pct, delay]);

  return (
    <div className="space-y-[5px]">
      <div className="flex items-baseline justify-between gap-2">
        <span className="font-body text-[10px] tracking-widest uppercase text-lc-silver/60 truncate">{label}</span>
        <span className="font-sans text-[10px] tabular-nums text-white/60 flex-shrink-0">
          {fmt(current)}<span className="text-lc-dim/60 mx-0.5">/</span>{fmt(target)}
          <span className="text-lc-dim/40 ml-0.5 text-[8px]">{unit}</span>
        </span>
      </div>
      <div className="h-px bg-white/[0.06]">
        <div ref={barRef} className="h-px transition-colors duration-700" style={{ width: '0%', background: color }} />
      </div>
    </div>
  );
}

/* ─── Profile Modal ──────────────────────────────────────────────── */
function ProfileModal({ profile, onClose }: { profile: Profile; onClose: () => void }) {
  const modalRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    gsap.fromTo(modalRef.current,
      { opacity: 0, scale: 0.95, y: 10 },
      { opacity: 1, scale: 1, y: 0, duration: 0.3, ease: 'power3.out' }
    );
  }, []);
  const close = () => {
    gsap.to(modalRef.current, {
      opacity: 0, scale: 0.95, y: 8, duration: 0.2, ease: 'power3.in',
      onComplete: onClose,
    });
  };
  const rows = [
    { label: 'Name',    value: profile.name   },
    { label: 'Gender',  value: profile.gender },
    { label: 'Age',     value: `${profile.age} years`   },
    { label: 'Height',  value: `${profile.height} cm`   },
    { label: 'Weight',  value: `${profile.weight} kg`   },
    { label: 'Sport',   value: profile.sport  },
    { label: 'Best result', value: profile.result },
  ];
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={close}>
      <div ref={modalRef} onClick={e => e.stopPropagation()}
        className="relative w-[360px] bg-lc-black border border-white/[0.10] rounded-2xl overflow-hidden shadow-[0_32px_80px_rgba(0,0,0,0.95)]"
        style={{ opacity: 0 }}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-5 border-b border-white/[0.07]">
          <div>
            <p className="font-body text-[9px] tracking-widest2 text-lc-dim uppercase mb-1">Athlete Profile</p>
            <p className="font-sans font-700 text-white text-lg tracking-tight">{profile.name.toUpperCase()}</p>
          </div>
          <button onClick={close} className="text-lc-dim hover:text-white transition-colors duration-200">
            <X className="w-4 h-4" />
          </button>
        </div>
        {/* Fields */}
        <div className="px-6 py-5 space-y-3">
          {rows.map(r => (
            <div key={r.label} className="flex items-baseline justify-between gap-4">
              <span className="font-body text-[9px] tracking-widest uppercase text-lc-dim/50">{r.label}</span>
              <span className="font-sans text-[12px] text-white/80 tracking-wide text-right">{r.value || '—'}</span>
            </div>
          ))}
        </div>
        {/* Targets */}
        <div className="px-6 pb-6 pt-2 border-t border-white/[0.07] mt-2">
          <p className="font-body text-[9px] tracking-widest2 text-lc-dim uppercase mb-3">Daily Targets (AI-calculated)</p>
          <div className="grid grid-cols-2 gap-x-4 gap-y-2">
            {[
              { label: 'Calories', value: profile.calories_target, unit: 'kcal' },
              { label: 'Protein',  value: profile.protein_target,  unit: 'g'    },
              { label: 'Carbs',    value: profile.carbs_target,    unit: 'g'    },
              { label: 'Fats',     value: profile.fats_target,     unit: 'g'    },
            ].map(t => (
              <div key={t.label}>
                <p className="font-body text-[9px] text-lc-dim/40 uppercase tracking-widest">{t.label}</p>
                <p className="font-sans text-[13px] text-white tabular-nums">{t.value}<span className="text-lc-dim/40 text-[10px] ml-0.5">{t.unit}</span></p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Dashboard ──────────────────────────────────────────────────── */
export default function Dashboard() {
  const time   = useClock();
  const router = useRouter();

  const [profile,       setProfile]       = useState<Profile | null>(null);
  const [userId,        setUserId]        = useState<string | null>(null);
  const [msgs,          setMsgs]          = useState<Msg[]>([{ role: 'ai', text: 'Protocol loaded. Long-term memory active. Log a meal or ask anything.' }]);
  const [input,         setInput]         = useState('');
  const [loading,       setLoading]       = useState(false);
  const [dataReady,     setDataReady]     = useState(false);
  const [micros,        setMicros]        = useState<MicroEntry[]>(MICROS_CONFIG);
  const [profileOpen,   setProfileOpen]   = useState(false);
  const [analysisOpen,  setAnalysisOpen]  = useState(false);

  const chatEndRef  = useRef<HTMLDivElement>(null);
  const pageRef     = useRef<HTMLDivElement>(null);
  const analysisRef = useRef<HTMLDivElement>(null);

  const { gel, dismiss: dismissGel } = useGelAlert(userId);

  const handleGelTaken = async (workoutId: string) => {
    dismissGel(workoutId);
    if (!userId || !gel) return;
    await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [{ role: 'user', text: `I just took my energy gel before my ${gel.workoutType} session at ${gel.workoutTime}.` }],
        profile, macros: [], micros, user_id: userId, silent: true,
      }),
    });
  };

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
      setDataReady(true);
    };
    init();
  }, [router]);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [msgs]);

  useEffect(() => {
    if (!pageRef.current) return;
    gsap.fromTo(pageRef.current.querySelectorAll('.ci'),
      { opacity: 0, y: 18 },
      { opacity: 1, y: 0, duration: 0.85, ease: 'power3.out', stagger: 0.1, delay: 0.15 }
    );
  }, []);

  /* Analysis panel expand/collapse */
  useEffect(() => {
    if (!analysisRef.current) return;
    gsap.to(analysisRef.current, { height: analysisOpen ? 'auto' : 0, duration: 0.45, ease: 'power3.inOut' });
  }, [analysisOpen]);

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

    try {
      const res  = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: updated, profile, macros: [], micros, user_id: userId }),
      });
      const data = await res.json();
      setMsgs(p => [...p, { role: 'ai', text: data.text }]);

      // ── Update micros if AI returned micronutrient data ──────────
      if (data.microsUpdate) {
        setMicros(prev => prev.map(m => {
          const update = data.microsUpdate[m.label];
          if (typeof update === 'number') {
            return { ...m, current: Math.min(m.current + update, m.target) };
          }
          return m;
        }));
      }
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
          {/* Clickable profile name */}
          <button onClick={() => profile && setProfileOpen(true)}
            className="flex items-center gap-1.5 group">
            <span className="font-body text-[9px] tracking-widest text-lc-dim uppercase group-hover:text-lc-silver transition-colors duration-200">{displayName}</span>
            <User className="w-3 h-3 text-lc-dim/40 group-hover:text-lc-silver/60 transition-colors duration-200" />
          </button>
        </div>
        <div className="flex items-center gap-4">
          <span className="font-sans text-[10px] tabular-nums text-lc-dim tracking-widest">{time}</span>
          <button onClick={handleSignOut} className="text-lc-dim hover:text-lc-silver transition-colors duration-300" title="Sign out">
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* ── Body ──────────────────────────────────────────────────── */}
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

        {/* ══ RIGHT SIDEBAR ═════════════════════════════════════════ */}
        <aside className="ci flex-shrink-0 w-[320px] border-l border-white/[0.08] bg-white/[0.03] flex flex-col overflow-y-auto custom-scrollbar" style={{ opacity: 0 }}>

          {/* Operator */}
          <div className="px-7 pt-7 pb-6 border-b border-white/[0.07]">
            <p className="font-sans text-[10px] tracking-widest2 text-lc-dim uppercase mb-3">Operator</p>
            <button onClick={() => profile && setProfileOpen(true)}
              className="group flex items-center gap-2 w-full text-left">
              <p className="font-sans font-700 text-white text-2xl tracking-tight leading-none group-hover:text-lc-silver transition-colors duration-200">{displayName}</p>
              <User className="w-3.5 h-3.5 text-lc-dim/30 group-hover:text-lc-silver/50 transition-colors duration-200 mt-0.5" />
            </button>
            {profile?.sport && <p className="font-sans text-[12px] text-lc-silver/50 tracking-wide mt-2">{profile.sport}</p>}
            {profile && (
              <p className="font-sans text-[11px] text-lc-dim/60 mt-1.5 tabular-nums">
                {profile.age}y · {profile.weight}kg · {profile.height}cm
              </p>
            )}
          </div>

          {/* Workout Timeline */}
          {userId && <WorkoutTimeline userId={userId} />}

          {/* ── MICRO · SUPPLEMENTS (primary, always visible) ──────── */}
          <div className="px-7 pt-6 pb-6 border-b border-white/[0.07]">
            <div className="flex items-center justify-between mb-5">
              <p className="font-sans text-[10px] tracking-widest2 text-lc-dim uppercase">Micro · Supplements</p>
              <button onClick={() => setMicros(MICROS_CONFIG.map(m => ({ ...m, current: 0 })))}
                className="font-body text-[8px] tracking-widest uppercase text-lc-dim/30 hover:text-lc-dim transition-colors duration-200">
                reset
              </button>
            </div>

            {dataReady && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-body text-[8.5px] tracking-widest2 text-lc-dim/40 uppercase">Vitamins · Minerals</span>
                  <div className="flex-1 h-px bg-white/[0.05]" />
                </div>
                {micros.slice(0, 5).map((m, i) => <Bar key={m.label} {...m} delay={0.04 * i} />)}
                <div className="flex items-center gap-2 pt-1">
                  <span className="font-body text-[8.5px] tracking-widest2 text-lc-dim/40 uppercase">Other</span>
                  <div className="flex-1 h-px bg-white/[0.05]" />
                </div>
                {micros.slice(5).map((m, i) => <Bar key={m.label} {...m} delay={0.04 * i} />)}
              </div>
            )}
          </div>

          {/* ── MY ANALYSIS (Biomarkers) ───────────────────────────── */}
          <div className="border-b border-white/[0.07]">
            <button onClick={() => setAnalysisOpen(v => !v)}
              className="w-full flex items-center justify-between px-7 py-4 hover:bg-white/[0.02] transition-colors duration-300 group">
              <div>
                <p className="font-sans text-[10px] tracking-widest2 text-lc-dim uppercase group-hover:text-lc-silver transition-colors duration-200">My Analysis</p>
                <p className="font-body text-[8px] text-lc-dim/30 tracking-widest uppercase mt-0.5">Bloodwork · Biomarkers</p>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-lc-dim/50 transition-transform duration-300"
                style={{ transform: analysisOpen ? 'rotate(180deg)' : 'rotate(0deg)' }} />
            </button>

            <div ref={analysisRef} className="overflow-hidden" style={{ height: 0 }}>
              <div className="px-7 pb-6 space-y-5">

                {/* Legend */}
                <div className="flex items-center gap-4 pb-1">
                  {(['optimal', 'suboptimal', 'deficient'] as BioStatus[]).map(s => (
                    <div key={s} className="flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full" style={{ background: STATUS_DOT[s].color }} />
                      <span className="font-body text-[8px] tracking-widest uppercase text-lc-dim/40">{STATUS_DOT[s].label}</span>
                    </div>
                  ))}
                </div>

                {BIOMARKERS.map(group => (
                  <div key={group.group}>
                    <div className="flex items-center gap-2 mb-3">
                      <span className="font-body text-[8.5px] tracking-widest2 text-lc-dim/40 uppercase">{group.group}</span>
                      <div className="flex-1 h-px bg-white/[0.05]" />
                    </div>
                    <div className="space-y-2.5">
                      {group.items.map(b => (
                        <div key={b.label} className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                              style={{ background: STATUS_DOT[b.status].color }} />
                            <span className="font-sans text-[11px] text-white/70 truncate">{b.label}</span>
                          </div>
                          <span className="font-body text-[9px] text-lc-dim/40 tabular-nums flex-shrink-0">{b.ref}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}

                <p className="font-body text-[8.5px] text-lc-dim/25 leading-relaxed pt-1">
                  Upload bloodwork results to enable AI biomarker analysis and personalized protocol adjustments.
                </p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex-1 px-7 py-5">
            <p className="font-sans text-[10px] tabular-nums text-lc-dim/40">
              {micros.some(m => m.current > 0) ? 'Micronutrients updating from meals' : 'Log a meal to track micronutrients'}
            </p>
          </div>
        </aside>
      </div>

      {/* ── Profile Modal ──────────────────────────────────────────── */}
      {profileOpen && profile && (
        <ProfileModal profile={profile} onClose={() => setProfileOpen(false)} />
      )}

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
