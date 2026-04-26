'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { gsap } from 'gsap';
import { Send, Activity, LogOut, User, X, ChevronDown, Check } from 'lucide-react';
import WorkoutTimeline from '@/components/WorkoutTimeline';
import { useGelAlert } from '@/hooks/useGelAlert';

const MG = 'linear-gradient(135deg, #FFD54F 0%, #FF8A00 50%, #C62828 100%)';
const RG = 'linear-gradient(135deg, #7C3AED 0%, #5B21B6 50%, #1D4ED8 100%)';
const BOX_G = 'linear-gradient(135deg, #FF8A00 0%, #C62828 40%, #7C3AED 70%, #1D4ED8 100%)';

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
interface ProtocolProduct {
  id: string; phase: string; title: string; subtitle: string;
  gradient: string; accentLight: string; locked: boolean;
  nutrients: Record<string, number>;
}

/* ─── Products (no gels) ─────────────────────────────────────────── */
const MORNING_NUTRIENTS: Record<string, number> = {
  'Vit A': 800, 'Vit C': 200, 'Vit D3': 25, 'Vit E': 12, 'Vit K2': 50,
  'Vit B12': 100, 'B-Complex': 100, 'Magnesium': 350, 'Zinc': 10,
  'Copper': 0.5, 'Selenium': 50, 'Iodine': 75, 'Chromium': 50,
  'Electrolytes': 400, 'Rhodiola': 150, 'L-Theanine': 100, 'Taurine': 500,
};
const RECOVERY_NUTRIENTS: Record<string, number> = {
  'EAA Complex': 7000, 'Creatine': 5000, 'HMB': 1500, 'L-Glutamine': 3000,
  'Tart Cherry': 500, 'Magnesium': 150, 'L-Theanine': 100,
};

const PROTOCOL_PRODUCTS: ProtocolProduct[] = [
  { id: 'morning',  phase: 'AM', title: 'Morning Pack',  subtitle: 'Activate · Circadian Prime', gradient: MG, accentLight: '#FFF8EE', locked: false, nutrients: MORNING_NUTRIENTS },
  { id: 'recovery', phase: 'PM', title: 'Recovery Pack', subtitle: 'Rebuild · Post-Workout',     gradient: RG, accentLight: '#F3EEFF', locked: false, nutrients: RECOVERY_NUTRIENTS },
];

/* ─── Micros ─────────────────────────────────────────────────────── */
const MICROS_VITAMINS: MicroEntry[] = [
  { label: 'Vit A',        unit: 'mcg', current: 0, target: 800  },
  { label: 'Vit C',        unit: 'mg',  current: 0, target: 500  },
  { label: 'Vit D3',       unit: 'mcg', current: 0, target: 25   },
  { label: 'Vit E',        unit: 'mg',  current: 0, target: 12   },
  { label: 'Vit K2',       unit: 'mcg', current: 0, target: 50   },
  { label: 'Vit B12',      unit: 'mcg', current: 0, target: 100  },
  { label: 'B-Complex',    unit: '%',   current: 0, target: 100  },
  { label: 'Magnesium',    unit: 'mg',  current: 0, target: 500  },
  { label: 'Zinc',         unit: 'mg',  current: 0, target: 15   },
  { label: 'Copper',       unit: 'mg',  current: 0, target: 1    },
  { label: 'Selenium',     unit: 'mcg', current: 0, target: 75   },
  { label: 'Iodine',       unit: 'mcg', current: 0, target: 150  },
  { label: 'Chromium',     unit: 'mcg', current: 0, target: 100  },
  { label: 'Electrolytes', unit: 'mg',  current: 0, target: 800  },
];
const MICROS_PERFORMANCE: MicroEntry[] = [
  { label: 'Creatine',    unit: 'mg',  current: 0, target: 5000 },
  { label: 'EAA Complex', unit: 'mg',  current: 0, target: 7000 },
  { label: 'L-Glutamine', unit: 'mg',  current: 0, target: 3000 },
  { label: 'HMB',         unit: 'mg',  current: 0, target: 1500 },
  { label: 'L-Theanine',  unit: 'mg',  current: 0, target: 200  },
  { label: 'Taurine',     unit: 'mg',  current: 0, target: 1000 },
  { label: 'Rhodiola',    unit: 'mg',  current: 0, target: 300  },
  { label: 'Tart Cherry', unit: 'mg',  current: 0, target: 500  },
];
const ALL_MICROS_CONFIG: MicroEntry[] = [...MICROS_VITAMINS, ...MICROS_PERFORMANCE];

/* ─── Biomarkers ─────────────────────────────────────────────────── */
type BioStatus = 'optimal' | 'suboptimal' | 'deficient' | 'unknown';
interface Biomarker { label: string; ref: string; status: BioStatus; }
const BIOMARKERS: { group: string; items: Biomarker[] }[] = [
  { group: 'Oxygen · Energy', items: [
    { label: 'Ferritin',      ref: '50–200 ng/mL',  status: 'unknown' },
    { label: 'Hemoglobin',    ref: '13.5–17 g/dL',  status: 'unknown' },
    { label: 'RBC Magnesium', ref: '4.2–6.8 mg/dL', status: 'unknown' },
  ]},
  { group: 'Recovery · Stress', items: [
    { label: 'Cortisol (AM)',   ref: '6–23 mcg/dL', status: 'unknown' },
    { label: 'Creatine Kinase', ref: '<200 U/L',     status: 'unknown' },
    { label: 'hs-CRP',          ref: '<1.0 mg/L',    status: 'unknown' },
  ]},
  { group: 'Hormones', items: [
    { label: 'Free Testosterone', ref: '9–30 ng/dL',     status: 'unknown' },
    { label: 'DHEA-S',            ref: '200–560 mcg/dL', status: 'unknown' },
  ]},
  { group: 'Vitamins · Minerals', items: [
    { label: 'Vitamin D3 (25-OH)', ref: '50–80 ng/mL',  status: 'unknown' },
    { label: 'Vitamin B12',        ref: '400–900 pg/mL', status: 'unknown' },
    { label: 'Serum Zinc',         ref: '80–120 mcg/dL', status: 'unknown' },
  ]},
];
const STATUS_DOT: Record<BioStatus, { color: string; label: string }> = {
  optimal:    { color: '#22c55e', label: 'Optimal'    },
  suboptimal: { color: '#f59e0b', label: 'Sub-optimal'},
  deficient:  { color: '#ef4444', label: 'Deficient'  },
  unknown:    { color: '#d1d5db', label: 'Not tested' },
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

function useIsDue(productId: string) {
  const [due, setDue] = useState(false);
  useEffect(() => {
    const check = () => {
      const h = new Date().getHours();
      if (productId === 'morning')  setDue(h >= 5  && h < 12);
      if (productId === 'recovery') setDue(h >= 17 && h < 23);
    };
    check();
    const id = setInterval(check, 60000);
    return () => clearInterval(id);
  }, [productId]);
  return due;
}

/* ─── Progress Bar ───────────────────────────────────────────────── */
function Bar({ label, unit, current, target, delay }: {
  label: string; unit: string; current: number; target: number; delay: number;
}) {
  const barRef  = useRef<HTMLDivElement>(null);
  const prevPct = useRef(0);
  const pct     = Math.min(target > 0 ? (current / target) * 100 : 0, 100);
  const fmt     = (n: number) => n % 1 !== 0 ? n.toFixed(1) : Math.round(n);
  const fillG   = pct >= 80 ? 'linear-gradient(90deg,#FF8A00,#C62828)' : pct >= 40 ? 'linear-gradient(90deg,#FFD54F,#FF8A00)' : '#e5e7eb';

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
        <span className="font-body text-[10px] tracking-widest uppercase text-[#999] truncate">{label}</span>
        <span className="font-sans text-[10px] tabular-nums text-[#aaa] flex-shrink-0">
          {fmt(current)}<span className="text-[#ccc] mx-0.5">/</span>{fmt(target)}
          <span className="text-[#ccc] ml-0.5 text-[8px]">{unit}</span>
        </span>
      </div>
      <div className="h-[2px] bg-[#f0f0f0] rounded-full">
        <div ref={barRef} className="h-[2px] rounded-full" style={{ width: '0%', background: fillG }} />
      </div>
    </div>
  );
}

/* ─── Protocol Card ──────────────────────────────────────────────── */
function ProtocolCard({ product, taken, onToggle }: {
  product: ProtocolProduct; taken: boolean; onToggle: () => void;
}) {
  const isDue  = useIsDue(product.id);
  const cardRef = useRef<HTMLDivElement>(null);

  const handleClick = () => {
    if (cardRef.current) {
      gsap.fromTo(cardRef.current, { scale: 0.97 }, { scale: 1, duration: 0.35, ease: 'back.out(2)' });
    }
    onToggle();
  };

  return (
    <div
      ref={cardRef}
      onClick={handleClick}
      className="relative overflow-hidden flex flex-col cursor-pointer transition-opacity duration-400"
      style={{ minHeight: 100, opacity: taken ? 0.5 : 1 }}
    >
      {/* Gradient top accent */}
      <div className="absolute top-0 left-0 right-0 h-[2px]" style={{ background: product.gradient }} />

      {/* Subtle tinted background */}
      <div className="absolute inset-0 opacity-40" style={{ background: product.accentLight }} />

      {/* Content */}
      <div className="relative z-10 p-4 flex flex-col h-full">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div>
            <span
              className="font-body text-[8px] tracking-widest2 uppercase font-600 bg-clip-text text-transparent"
              style={{ backgroundImage: product.gradient }}
            >
              {product.phase}
            </span>
            <p className="font-sans font-600 text-[12px] tracking-tight text-[#111] mt-0.5">
              {product.title}
            </p>
          </div>
          <div className="flex-shrink-0 mt-0.5">
            {taken ? (
              <div className="w-5 h-5 rounded-full flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, #FF8A00, #C62828)' }}>
                <Check className="w-3 h-3 text-white" />
              </div>
            ) : isDue ? (
              <span className="font-body text-[7px] tracking-widest2 uppercase px-1.5 py-0.5 rounded text-[#FF8A00]"
                style={{ background: '#FFF3E0', border: '1px solid #FFD54F' }}>
                DUE NOW
              </span>
            ) : (
              <div className="w-4 h-4 rounded-full border-2 border-[#e0e0e0]" />
            )}
          </div>
        </div>
        <p className="font-body text-[8.5px] tracking-widest uppercase leading-snug text-[#aaa]">
          {taken ? 'Taken · Nutrients tracked' : product.subtitle}
        </p>
      </div>
    </div>
  );
}

/* ─── Profile Modal ──────────────────────────────────────────────── */
function ProfileModal({ profile, onClose }: { profile: Profile; onClose: () => void }) {
  const modalRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    gsap.fromTo(modalRef.current, { opacity: 0, scale: 0.95, y: 10 }, { opacity: 1, scale: 1, y: 0, duration: 0.3, ease: 'power3.out' });
  }, []);
  const close = () => {
    gsap.to(modalRef.current, { opacity: 0, scale: 0.95, y: 8, duration: 0.2, ease: 'power3.in', onComplete: onClose });
  };
  const rows = [
    { label: 'Name',        value: profile.name   },
    { label: 'Gender',      value: profile.gender },
    { label: 'Age',         value: `${profile.age} years`   },
    { label: 'Height',      value: `${profile.height} cm`   },
    { label: 'Weight',      value: `${profile.weight} kg`   },
    { label: 'Sport',       value: profile.sport  },
    { label: 'Best result', value: profile.result },
  ];
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm" onClick={close}>
      <div ref={modalRef} onClick={e => e.stopPropagation()}
        className="relative w-[360px] bg-white border border-[#f0f0f0] rounded-2xl overflow-hidden shadow-xl"
        style={{ opacity: 0 }}>
        <div className="h-[2px]" style={{ background: BOX_G }} />
        <div className="flex items-center justify-between px-6 pt-5 pb-5 border-b border-[#f5f5f5]">
          <div>
            <p className="font-body text-[9px] tracking-widest2 text-[#aaa] uppercase mb-1">Athlete Profile</p>
            <p className="font-sans font-700 text-[#111] text-lg tracking-tight">{profile.name.toUpperCase()}</p>
          </div>
          <button onClick={close} className="text-[#bbb] hover:text-[#666] transition-colors duration-200">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="px-6 py-5 space-y-3">
          {rows.map(r => (
            <div key={r.label} className="flex items-baseline justify-between gap-4">
              <span className="font-body text-[9px] tracking-widest uppercase text-[#ccc]">{r.label}</span>
              <span className="font-sans text-[12px] text-[#333] tracking-wide text-right">{r.value || '—'}</span>
            </div>
          ))}
        </div>
        <div className="px-6 pb-6 pt-2 border-t border-[#f5f5f5] mt-2">
          <p className="font-body text-[9px] tracking-widest2 text-[#aaa] uppercase mb-3">Daily Targets (AI-calculated)</p>
          <div className="grid grid-cols-2 gap-x-4 gap-y-2">
            {[
              { label: 'Calories', value: profile.calories_target, unit: 'kcal' },
              { label: 'Protein',  value: profile.protein_target,  unit: 'g'    },
              { label: 'Carbs',    value: profile.carbs_target,    unit: 'g'    },
              { label: 'Fats',     value: profile.fats_target,     unit: 'g'    },
            ].map(t => (
              <div key={t.label}>
                <p className="font-body text-[9px] text-[#ccc] uppercase tracking-widest">{t.label}</p>
                <p className="font-sans text-[13px] text-[#222] tabular-nums">{t.value}<span className="text-[#bbb] text-[10px] ml-0.5">{t.unit}</span></p>
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

  const [profile,        setProfile]        = useState<Profile | null>(null);
  const [userId,         setUserId]         = useState<string | null>(null);
  const [msgs,           setMsgs]           = useState<Msg[]>([{ role: 'ai', text: 'Protocol loaded. Long-term memory active. Log a meal or ask anything.' }]);
  const [input,          setInput]          = useState('');
  const [loading,        setLoading]        = useState(false);
  const [dataReady,      setDataReady]      = useState(false);
  const [micros,         setMicros]         = useState<MicroEntry[]>(ALL_MICROS_CONFIG);
  const [profileOpen,    setProfileOpen]    = useState(false);
  const [analysisOpen,   setAnalysisOpen]   = useState(false);
  const [takenProducts,  setTakenProducts]  = useState<Set<string>>(new Set());
  const [microsNotif,    setMicrosNotif]    = useState<string | null>(null);

  const chatEndRef  = useRef<HTMLDivElement>(null);
  const pageRef     = useRef<HTMLDivElement>(null);
  const analysisRef = useRef<HTMLDivElement>(null);

  const { gel, dismiss: dismissGel } = useGelAlert(userId);

  const handleProductToggle = useCallback((product: ProtocolProduct) => {
    const isTaking = !takenProducts.has(product.id);
    setTakenProducts(prev => {
      const next = new Set(prev);
      if (isTaking) next.add(product.id); else next.delete(product.id);
      return next;
    });
    setMicros(prev => prev.map(m => {
      const amount = product.nutrients[m.label];
      if (typeof amount !== 'number') return m;
      const newCurrent = isTaking
        ? Math.min(m.current + amount, m.target)
        : Math.max(m.current - amount, 0);
      return { ...m, current: newCurrent };
    }));
  }, [takenProducts]);

  const handleWorkoutsChange = useCallback((_workouts: { workout_type: string }[]) => {}, []);

  const handleGelTaken = async (workoutId: string) => {
    dismissGel(workoutId);
  };

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
      { opacity: 0, y: 14 },
      { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out', stagger: 0.08, delay: 0.1 }
    );
  }, []);

  useEffect(() => {
    if (!analysisRef.current) return;
    gsap.to(analysisRef.current, { height: analysisOpen ? 'auto' : 0, duration: 0.4, ease: 'power3.inOut' });
  }, [analysisOpen]);

  const handleSignOut = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  };

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
      if (data.microsUpdate) {
        setMicros(prev => prev.map(m => {
          const update = data.microsUpdate[m.label];
          if (typeof update === 'number' && update > 0) return { ...m, current: Math.min(m.current + update, m.target) };
          return m;
        }));
        const updated = Object.entries(data.microsUpdate as Record<string, number>)
          .filter(([, v]) => v > 0).map(([k]) => k);
        if (updated.length > 0) {
          const preview = updated.slice(0, 3).join(' · ') + (updated.length > 3 ? ` +${updated.length - 3}` : '');
          setMicrosNotif(preview);
          setTimeout(() => setMicrosNotif(null), 4000);
        }
      }
    } catch {
      setMsgs(p => [...p, { role: 'ai', text: 'Connection error — retrying protocol.' }]);
    } finally {
      setLoading(false);
    }
  };

  const displayName = (profile?.name || '').toUpperCase();
  const takenCount  = takenProducts.size;

  return (
    <div ref={pageRef} className="h-screen bg-white text-[#222] flex flex-col overflow-hidden" style={{ fontFamily: 'var(--font-space), system-ui, sans-serif' }}>

      {/* ── Header ────────────────────────────────────────────────── */}
      <header className="ci flex-shrink-0 flex items-center justify-between px-6 py-4 border-b border-[#f0f0f0]" style={{ opacity: 0 }}>
        <div className="flex items-center gap-4">
          <Link href="/"
            className="font-sans font-700 text-xs tracking-[0.3em] uppercase select-none bg-clip-text text-transparent"
            style={{ backgroundImage: BOX_G }}
          >
            LIFECODE
          </Link>
          <span className="hidden md:block font-body text-[9px] tracking-widest text-[#ccc] italic">
            "We are what we eat"
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="w-1 h-1 rounded-full bg-[#ddd]" />
          <button onClick={() => profile && setProfileOpen(true)} className="flex items-center gap-1.5 group">
            <span className="font-body text-[9px] tracking-widest text-[#aaa] uppercase group-hover:text-[#444] transition-colors duration-200">{displayName}</span>
            <User className="w-3 h-3 text-[#ccc] group-hover:text-[#666] transition-colors duration-200" />
          </button>
        </div>
        <div className="flex items-center gap-4">
          <span className="font-sans text-[10px] tabular-nums text-[#bbb] tracking-widest">{time}</span>
          <button onClick={handleSignOut} className="text-[#ccc] hover:text-[#666] transition-colors duration-300" title="Sign out">
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* ── Body ──────────────────────────────────────────────────── */}
      <div className="flex flex-1 min-h-0">

        {/* ══ LEFT — Protocol Checklist ══════════════════════════════ */}
        <aside className="ci hidden lg:flex flex-shrink-0 w-[220px] border-r border-[#f0f0f0] flex-col overflow-hidden" style={{ opacity: 0 }}>
          <div className="px-4 pt-5 pb-4 border-b border-[#f5f5f5]">
            <p className="font-body text-[8px] tracking-widest3 text-[#bbb] uppercase mb-1">Daily Protocol</p>
            <div className="flex items-baseline justify-between">
              <p className="font-sans font-700 text-[#111] text-[13px] tracking-tight">LIFECODE</p>
              <span
                className="font-body text-[8px] tracking-widest uppercase bg-clip-text text-transparent"
                style={{ backgroundImage: takenCount > 0 ? BOX_G : 'none', color: takenCount > 0 ? undefined : '#ccc' }}
              >
                {takenCount}/2 taken
              </span>
            </div>
          </div>

          <div className="flex-1 flex flex-col divide-y divide-[#f5f5f5] overflow-hidden">
            {PROTOCOL_PRODUCTS.map(p => (
              <ProtocolCard
                key={p.id}
                product={p}
                taken={takenProducts.has(p.id)}
                onToggle={() => handleProductToggle(p)}
              />
            ))}
          </div>

          <div className="px-4 py-3 border-t border-[#f5f5f5]">
            <button
              onClick={() => {
                setTakenProducts(new Set());
                setMicros(ALL_MICROS_CONFIG.map(m => ({ ...m, current: 0 })));
              }}
              className="font-body text-[7.5px] tracking-widest2 uppercase text-[#ddd] hover:text-[#999] transition-colors duration-200"
            >
              reset today
            </button>
          </div>
        </aside>

        {/* ══ CENTER — Chat ══════════════════════════════════════════ */}
        <main className="ci flex-1 flex flex-col min-h-0 min-w-0" style={{ opacity: 0 }}>
          <div className="flex-shrink-0 px-8 pt-7 pb-5 border-b border-[#f0f0f0]">
            <p className="font-body text-[9px] tracking-widest2 text-[#bbb] uppercase mb-2">
              AI Nutrition Architect · Long-Term Memory Active
            </p>
            <h2 className="font-sans font-600 text-[#111] leading-snug tracking-tight" style={{ fontSize: 'clamp(1rem, 1.8vw, 1.3rem)' }}>
              Log meals or ask about your{' '}
              <span className="bg-clip-text text-transparent" style={{ backgroundImage: BOX_G }}>
                performance protocol.
              </span>
            </h2>
          </div>

          <div className="flex-1 overflow-y-auto px-8 py-7 space-y-5" style={{ scrollbarWidth: 'thin', scrollbarColor: '#f0f0f0 transparent' }}>
            {msgs.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'ai' ? (
                  <div className="flex items-start gap-3 max-w-[82%]">
                    <div className="mt-0.5 flex-shrink-0 w-[18px] h-[18px] rounded-full border border-[#f0f0f0] flex items-center justify-center">
                      <Activity className="w-2.5 h-2.5 text-[#ccc]" />
                    </div>
                    <p className="font-body text-sm text-[#666] leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                  </div>
                ) : (
                  <div className="max-w-[78%] border border-[#f0f0f0] rounded-2xl rounded-br-sm px-4 py-2.5 bg-[#fafafa]">
                    <p className="font-body text-sm text-[#333] leading-relaxed">{msg.text}</p>
                  </div>
                )}
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex-shrink-0 w-[18px] h-[18px] rounded-full border border-[#f0f0f0] flex items-center justify-center">
                    <Activity className="w-2.5 h-2.5 text-[#ccc] animate-pulse" />
                  </div>
                  <p className="font-body text-sm text-[#bbb]">Analyzing...</p>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          <div className="flex-shrink-0 px-8 pb-7 pt-4 border-t border-[#f0f0f0] flex justify-center">
            <div className="w-full max-w-md flex items-center gap-3 rounded-full border border-[#eeeeee] px-5 py-2.5 focus-within:border-[#ccc] transition-colors duration-300 bg-white shadow-sm">
              <input
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMsg(); } }}
                placeholder="Log a meal, share how you feel, ask anything..."
                className="flex-1 bg-transparent text-sm text-[#333] placeholder:text-[#ccc] focus:outline-none font-body"
              />
              <button
                onClick={sendMsg}
                disabled={!input.trim() || loading}
                className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center disabled:opacity-20 transition-all duration-300 text-white"
                style={{ background: input.trim() ? BOX_G : '#e0e0e0' }}
              >
                <Send className="w-3 h-3" />
              </button>
            </div>
          </div>
        </main>

        {/* ══ RIGHT SIDEBAR ═════════════════════════════════════════ */}
        <aside
          className="ci flex-shrink-0 w-[300px] border-l border-[#f0f0f0] bg-[#fafafa] flex flex-col overflow-y-auto"
          style={{ opacity: 0, scrollbarWidth: 'thin', scrollbarColor: '#eeeeee transparent' }}
        >
          {/* Operator */}
          <div className="px-6 pt-6 pb-5 border-b border-[#f0f0f0]">
            <p className="font-sans text-[10px] tracking-widest2 text-[#bbb] uppercase mb-3">Operator</p>
            <button onClick={() => profile && setProfileOpen(true)} className="group flex items-center gap-2 w-full text-left">
              <p
                className="font-sans font-700 text-2xl tracking-tight leading-none bg-clip-text text-transparent"
                style={{ backgroundImage: BOX_G }}
              >
                {displayName}
              </p>
              <User className="w-3.5 h-3.5 text-[#ccc] group-hover:text-[#888] transition-colors duration-200 mt-0.5" />
            </button>
            {profile?.sport && <p className="font-sans text-[12px] text-[#888] tracking-wide mt-2">{profile.sport}</p>}
            {profile && (
              <p className="font-sans text-[11px] text-[#bbb] mt-1.5 tabular-nums">
                {profile.age}y · {profile.weight}kg · {profile.height}cm
              </p>
            )}
          </div>

          {/* Workout Timeline */}
          {userId && <WorkoutTimeline userId={userId} onWorkoutsChange={handleWorkoutsChange} />}

          {/* VITAMINS */}
          <div className="px-6 pt-5 pb-5 border-b border-[#f0f0f0]">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="font-body text-[8.5px] tracking-widest2 text-[#bbb] uppercase">Vitamins · Minerals</span>
                {microsNotif && (
                  <span
                    className="font-body text-[7px] tracking-widest uppercase px-1.5 py-0.5 rounded-full transition-opacity duration-500"
                    style={{ background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0' }}
                  >
                    +{microsNotif}
                  </span>
                )}
              </div>
              <button
                onClick={() => {
                  setTakenProducts(new Set());
                  setMicros(ALL_MICROS_CONFIG.map(m => ({ ...m, current: 0 })));
                }}
                className="font-body text-[7.5px] tracking-widest uppercase text-[#ddd] hover:text-[#999] transition-colors duration-200"
              >
                reset
              </button>
            </div>
            {dataReady && (
              <div className="space-y-3.5">
                {micros.slice(0, MICROS_VITAMINS.length).map((m, i) => (
                  <Bar key={m.label} {...m} delay={0.03 * i} />
                ))}
              </div>
            )}
          </div>

          {/* PERFORMANCE */}
          <div className="px-6 pt-5 pb-5 border-b border-[#f0f0f0]">
            <div className="flex items-center gap-2 mb-4">
              <span className="font-body text-[8.5px] tracking-widest2 text-[#bbb] uppercase">Performance · Aminos</span>
            </div>
            {dataReady && (
              <div className="space-y-3.5">
                {micros.slice(MICROS_VITAMINS.length).map((m, i) => (
                  <Bar key={m.label} {...m} delay={0.03 * i} />
                ))}
              </div>
            )}
          </div>

          {/* BIOMARKERS */}
          <div className="border-b border-[#f0f0f0]">
            <button
              onClick={() => setAnalysisOpen(v => !v)}
              className="w-full flex items-center justify-between px-6 py-4 hover:bg-white transition-colors duration-300 group"
            >
              <div>
                <p className="font-sans text-[10px] tracking-widest2 text-[#aaa] uppercase group-hover:text-[#555] transition-colors duration-200">My Analysis</p>
                <p className="font-body text-[8px] text-[#ccc] tracking-widest uppercase mt-0.5">Bloodwork · Biomarkers</p>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-[#ccc] transition-transform duration-300"
                style={{ transform: analysisOpen ? 'rotate(180deg)' : 'rotate(0deg)' }} />
            </button>
            <div ref={analysisRef} className="overflow-hidden" style={{ height: 0 }}>
              <div className="px-6 pb-6 space-y-5">
                <div className="flex items-center gap-4 pb-1">
                  {(['optimal', 'suboptimal', 'deficient'] as BioStatus[]).map(s => (
                    <div key={s} className="flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full" style={{ background: STATUS_DOT[s].color }} />
                      <span className="font-body text-[8px] tracking-widest uppercase text-[#bbb]">{STATUS_DOT[s].label}</span>
                    </div>
                  ))}
                </div>
                {BIOMARKERS.map(group => (
                  <div key={group.group}>
                    <div className="flex items-center gap-2 mb-3">
                      <span className="font-body text-[8.5px] tracking-widest2 text-[#bbb] uppercase">{group.group}</span>
                      <div className="flex-1 h-px bg-[#f0f0f0]" />
                    </div>
                    <div className="space-y-2.5">
                      {group.items.map(b => (
                        <div key={b.label} className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: STATUS_DOT[b.status].color }} />
                            <span className="font-sans text-[11px] text-[#444] truncate">{b.label}</span>
                          </div>
                          <span className="font-body text-[9px] text-[#bbb] tabular-nums flex-shrink-0">{b.ref}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
                <p className="font-body text-[8.5px] text-[#ccc] leading-relaxed pt-1">
                  Upload bloodwork results to enable AI biomarker analysis and personalized protocol adjustments.
                </p>
              </div>
            </div>
          </div>

          <div className="flex-1 px-6 py-5">
            <p className="font-sans text-[10px] text-[#ccc]">
              {micros.some(m => m.current > 0) ? 'Micronutrients updating in real-time' : 'Mark products taken or log a meal'}
            </p>
          </div>
        </aside>
      </div>

      {profileOpen && profile && (
        <ProfileModal profile={profile} onClose={() => setProfileOpen(false)} />
      )}
    </div>
  );
}
