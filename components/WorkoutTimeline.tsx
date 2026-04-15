'use client';

import { useState, useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { X, Zap, Activity, Dumbbell, Wind } from 'lucide-react';

interface WorkoutEvent {
  id: string;
  event_time: string;
  workout_type: string;
  duration_min: number;
}

const WORKOUT_TYPES = [
  { key: 'Endurance', icon: <Activity className="w-3.5 h-3.5" /> },
  { key: 'Strength',  icon: <Dumbbell className="w-3.5 h-3.5" /> },
  { key: 'Sprint',    icon: <Zap className="w-3.5 h-3.5" /> },
  { key: 'Recovery',  icon: <Wind className="w-3.5 h-3.5" /> },
];

const WORKOUT_ICONS: Record<string, React.ReactNode> = {
  Endurance: <Activity className="w-3 h-3" />,
  Strength:  <Dumbbell className="w-3 h-3" />,
  Sprint:    <Zap className="w-3 h-3" />,
  Recovery:  <Wind className="w-3 h-3" />,
};

const START_HOUR  = 5;
const END_HOUR    = 23;
const TOTAL_HOURS = END_HOUR - START_HOUR;

function getNowPct(): number {
  const now = new Date();
  const pct = ((now.getHours() + now.getMinutes() / 60 + now.getSeconds() / 3600 - START_HOUR) / TOTAL_HOURS) * 100;
  return Math.max(0, Math.min(100, pct));
}

function timeToPercent(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return ((h + m / 60 - START_HOUR) / TOTAL_HOURS) * 100;
}

// Parse typed time like "14", "1430", "14:30" → "14:30"
function parseTimeInput(raw: string): string | null {
  const clean = raw.replace(/[^0-9:]/g, '');
  // Already HH:MM
  if (/^\d{1,2}:\d{2}$/.test(clean)) {
    const [h, m] = clean.split(':').map(Number);
    if (h >= 0 && h <= 23 && m >= 0 && m <= 59) return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`;
  }
  // 4 digits: 1430
  if (/^\d{4}$/.test(clean)) {
    const h = parseInt(clean.slice(0, 2));
    const m = parseInt(clean.slice(2, 4));
    if (h >= 0 && h <= 23 && m >= 0 && m <= 59) return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`;
  }
  // 1-2 digits: just hour
  if (/^\d{1,2}$/.test(clean)) {
    const h = parseInt(clean);
    if (h >= 0 && h <= 23) return `${String(h).padStart(2,'0')}:00`;
  }
  return null;
}

export default function WorkoutTimeline({ userId }: { userId: string }) {
  const [workouts,  setWorkouts]  = useState<WorkoutEvent[]>([]);
  const [adding,    setAdding]    = useState(false);
  const [timeInput, setTimeInput] = useState('');
  const [timeError, setTimeError] = useState(false);
  const [newType,   setNewType]   = useState('Endurance');
  const [newDur,    setNewDur]    = useState('60');
  const [saving,    setSaving]    = useState(false);
  const [nowPct,    setNowPct]    = useState(getNowPct);

  const progressRef = useRef<HTMLDivElement>(null);
  const markerRef   = useRef<HTMLDivElement>(null);
  const formRef     = useRef<HTMLDivElement>(null);

  /* ── Real-time marker + progress bar ─────────────────────────── */
  useEffect(() => {
    // Initial render
    const pct = getNowPct();
    setNowPct(pct);
    if (progressRef.current) gsap.set(progressRef.current, { width: `${pct}%` });
    if (markerRef.current)   gsap.set(markerRef.current,   { left:  `${pct}%` });

    const id = setInterval(() => {
      const p = getNowPct();
      setNowPct(p);
      if (progressRef.current) gsap.to(progressRef.current, { width: `${p}%`, duration: 1, ease: 'linear' });
      if (markerRef.current)   gsap.to(markerRef.current,   { left:  `${p}%`, duration: 1, ease: 'linear' });
    }, 1000);
    return () => clearInterval(id);
  }, []);

  /* ── Animate form open ────────────────────────────────────────── */
  useEffect(() => {
    if (adding && formRef.current) {
      gsap.fromTo(formRef.current,
        { opacity: 0, y: -10 },
        { opacity: 1, y: 0, duration: 0.3, ease: 'power3.out' }
      );
    }
  }, [adding]);

  const load = async () => {
    const today = new Date().toISOString().split('T')[0];
    const res = await fetch(`/api/workouts?user_id=${userId}&date=${today}`);
    const { data } = await res.json();
    setWorkouts(data || []);
  };

  useEffect(() => { if (userId) load(); }, [userId]);

  const openAdd = () => {
    const now = new Date();
    setTimeInput(`${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`);
    setTimeError(false);
    setNewType('Endurance');
    setNewDur('60');
    setAdding(true);
  };

  const addWorkout = async () => {
    const parsed = parseTimeInput(timeInput);
    if (!parsed || saving) { setTimeError(true); return; }
    setTimeError(false);
    setSaving(true);
    const res = await fetch('/api/workouts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: userId,
        event_time: parsed,
        workout_type: newType,
        duration_min: parseInt(newDur) || 60,
      }),
    });
    if (!res.ok) console.error('Add workout failed');
    setSaving(false);
    setAdding(false);
    load();
  };

  const remove = async (id: string) => {
    await fetch(`/api/workouts?id=${id}`, { method: 'DELETE' });
    load();
  };

  // Current time label
  const nowDate  = new Date();
  const nowLabel = `${String(nowDate.getHours()).padStart(2,'0')}:${String(nowDate.getMinutes()).padStart(2,'0')}`;

  return (
    <div className="border-b border-white/[0.07] px-7 pt-5 pb-6">

      {/* ── Header ─────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-4">
        <p className="font-sans text-[11px] tracking-widest text-lc-dim uppercase">Schedule</p>
        <button onClick={openAdd}
          className="font-sans text-[10px] tracking-widest uppercase text-lc-dim hover:text-white border border-lc-line hover:border-lc-silver/40 px-3 py-1 rounded-full transition-all duration-300">
          + Add
        </button>
      </div>

      {/* ── Add form ───────────────────────────────────────────────── */}
      {adding && (
        <div ref={formRef} className="mb-5 rounded-xl border border-lc-silver/20 bg-white/[0.03] overflow-hidden">
          {/* Time + Duration */}
          <div className="flex border-b border-lc-line">
            <div className="flex-1 flex flex-col px-4 pt-3 pb-3 border-r border-lc-line">
              <span className="font-sans text-[9px] tracking-widest2 text-lc-dim/50 uppercase mb-2">Ora (ex: 14:30)</span>
              <input
                type="text"
                value={timeInput}
                onChange={e => { setTimeInput(e.target.value); setTimeError(false); }}
                onKeyDown={e => e.key === 'Enter' && addWorkout()}
                placeholder="14:30"
                className={`bg-transparent font-sans text-[16px] text-white focus:outline-none w-full placeholder:text-lc-dim/30 ${timeError ? 'text-red-400' : ''}`}
                autoFocus
              />
              {timeError && <span className="font-sans text-[9px] text-red-400/80 mt-1">Format invalid</span>}
            </div>
            <div className="w-24 flex flex-col px-4 pt-3 pb-3">
              <span className="font-sans text-[9px] tracking-widest2 text-lc-dim/50 uppercase mb-2">Minute</span>
              <input
                type="text"
                value={newDur}
                onChange={e => setNewDur(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addWorkout()}
                placeholder="60"
                className="bg-transparent font-sans text-[16px] text-white focus:outline-none w-full placeholder:text-lc-dim/30"
              />
            </div>
          </div>

          {/* Type selector */}
          <div className="grid grid-cols-4 border-b border-lc-line">
            {WORKOUT_TYPES.map(t => (
              <button key={t.key} onClick={() => setNewType(t.key)}
                className={`flex flex-col items-center gap-1.5 py-3 transition-all duration-200 border-r border-lc-line last:border-r-0 ${
                  newType === t.key
                    ? 'bg-white/[0.07] text-white'
                    : 'text-lc-dim hover:text-lc-silver hover:bg-white/[0.02]'
                }`}>
                {t.icon}
                <span className="font-sans text-[8px] tracking-widest uppercase">{t.key}</span>
              </button>
            ))}
          </div>

          {/* Actions */}
          <div className="flex">
            <button onClick={() => setAdding(false)}
              className="flex-1 py-3 font-sans text-[10px] tracking-widest uppercase text-lc-dim hover:text-lc-silver border-r border-lc-line transition-colors duration-200">
              Cancel
            </button>
            <button onClick={addWorkout} disabled={saving}
              className="flex-1 py-3 font-sans text-[10px] tracking-widest uppercase text-white hover:bg-white/[0.05] disabled:opacity-30 transition-colors duration-200">
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      )}

      {/* ── Timeline bar ───────────────────────────────────────────── */}
      <div className="relative">
        {/* Hour labels row */}
        <div className="flex justify-between mb-2">
          {[5, 9, 13, 17, 21, 23].map(h => (
            <span key={h} className="font-sans text-[9px] tabular-nums text-lc-dim/40">
              {String(h).padStart(2,'0')}
            </span>
          ))}
        </div>

        {/* Track */}
        <div className="relative h-2 rounded-full bg-lc-line overflow-visible">
          {/* Progress fill */}
          <div ref={progressRef} className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-lc-dim/40 to-lc-silver/60" style={{ width: '0%' }} />

          {/* Current time marker */}
          <div ref={markerRef} className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 z-10" style={{ left: '0%' }}>
            <div className="w-3 h-3 rounded-full bg-white shadow-[0_0_10px_rgba(255,255,255,0.9)] border-2 border-black" />
          </div>

          {/* Workout dots on bar */}
          {workouts.map(w => {
            const pct = timeToPercent(w.event_time);
            if (pct < 0 || pct > 100) return null;
            return (
              <button key={w.id}
                onClick={() => remove(w.id)}
                title={`${w.event_time} · ${w.workout_type} · click to remove`}
                className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 z-20 group"
                style={{ left: `${pct}%` }}>
                <div className="w-5 h-5 rounded-full border border-lc-silver/50 bg-lc-black flex items-center justify-center text-lc-dim group-hover:border-white group-hover:text-white group-hover:scale-125 transition-all duration-200">
                  {WORKOUT_ICONS[w.workout_type] || <Activity className="w-2.5 h-2.5" />}
                </div>
              </button>
            );
          })}
        </div>

        {/* Current time label */}
        <div className="mt-2 flex justify-end">
          <span className="font-sans text-[10px] tabular-nums text-lc-silver/50">{nowLabel}</span>
        </div>
      </div>

      {/* ── Workout list ───────────────────────────────────────────── */}
      {workouts.length > 0 && (
        <div className="space-y-2.5 mt-4">
          {workouts.map(w => (
            <div key={w.id} className="flex items-center justify-between group">
              <div className="flex items-center gap-3">
                <span className="font-sans text-[13px] tabular-nums text-white/80 tracking-wider">{w.event_time}</span>
                <span className="font-sans text-[10px] tracking-widest uppercase text-lc-dim">{w.workout_type}</span>
                <span className="font-sans text-[10px] text-lc-dim/40">{w.duration_min}min</span>
              </div>
              <button onClick={() => remove(w.id)}
                className="opacity-0 group-hover:opacity-100 text-lc-dim hover:text-white transition-all duration-200">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {workouts.length === 0 && !adding && (
        <p className="font-sans text-[10px] text-lc-dim/30 uppercase tracking-widest mt-3">No workouts scheduled</p>
      )}
    </div>
  );
}
