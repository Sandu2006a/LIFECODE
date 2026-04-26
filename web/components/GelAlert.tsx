'use client';

import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import Image from 'next/image';

interface GelAlertProps {
  minutesUntil: number;
  workoutType: string;
  workoutTime: string;
  onDismiss: () => void;
}

export default function GelAlert({ minutesUntil, workoutType, workoutTime, onDismiss }: GelAlertProps) {
  const [phase, setPhase] = useState<'gel' | 'ready' | 'gone'>('gel');
  const gelRef      = useRef<HTMLDivElement>(null);
  const readyRef    = useRef<HTMLDivElement>(null);
  const dismissRef  = useRef(onDismiss);
  const timerFired  = useRef(false);
  dismissRef.current = onDismiss;

  // Entrance
  useEffect(() => {
    if (!gelRef.current) return;
    gsap.fromTo(gelRef.current,
      { opacity: 0, y: 40, scale: 0.9 },
      { opacity: 1, y: 0,  scale: 1, duration: 0.7, ease: 'power3.out', delay: 0.3 }
    );
  }, []);

  // Phase: ready → animate in once, then auto-dismiss after 5s
  useEffect(() => {
    if (phase !== 'ready' || timerFired.current) return;
    const el = readyRef.current;
    if (!el) return;

    timerFired.current = true;

    gsap.fromTo(el,
      { opacity: 0, scale: 0.88, y: 14 },
      { opacity: 1, scale: 1,    y: 0,  duration: 0.45, ease: 'back.out(1.5)' }
    );

    const out = setTimeout(() => {
      gsap.to(el, {
        opacity: 0, y: 10, scale: 0.92,
        duration: 0.45, ease: 'power3.in',
        onComplete: () => { setPhase('gone'); dismissRef.current(); },
      });
    }, 5000);

    return () => clearTimeout(out);
  }, [phase]);

  const handleClick = () => {
    if (phase !== 'gel' || !gelRef.current) return;
    gsap.to(gelRef.current, {
      opacity: 0, scale: 0.85, y: 20,
      duration: 0.3, ease: 'power3.in',
      onComplete: () => setPhase('ready'),
    });
  };

  if (phase === 'gone') return null;

  const mins = Math.round(minutesUntil);
  const timeLabel = mins >= 60
    ? `${Math.floor(mins / 60)}h${mins % 60 > 0 ? ` ${mins % 60}min` : ''}`
    : `${mins} min`;

  // Format workoutTime as HH:MM fixed width
  const [wH, wM] = workoutTime.split(':');
  const timeFormatted = `${wH.padStart(2,'0')}:${(wM||'00').padStart(2,'0')}`;

  return (
    <div className="fixed bottom-6 left-6 z-50">

      {/* ── GEL card ─────────────────────────────────────────────── */}
      {phase === 'gel' && (
        <div
          ref={gelRef}
          onClick={handleClick}
          style={{ opacity: 0 }}
          className="cursor-pointer w-[175px] rounded-2xl border border-white/10 bg-black/95 backdrop-blur-xl overflow-hidden shadow-[0_16px_60px_rgba(0,0,0,0.95)] hover:border-white/25 transition-colors duration-300"
        >
          {/* Full-bleed gel image */}
          <div className="relative w-full h-[200px]">
            <Image
              src="/gel.png"
              alt="Energy Gel"
              fill
              className="object-contain p-4 drop-shadow-[0_8px_32px_rgba(255,255,255,0.25)]"
            />
          </div>

          {/* Text strip */}
          <div className="px-4 pt-2.5 pb-3.5 border-t border-white/[0.06]">
            <p className="font-sans font-600 text-white text-[13px] leading-snug">
              Take your energy gel
            </p>
            <p className="font-sans text-[10px] text-lc-dim/70 mt-0.5 tabular-nums">
              <span className="font-sans text-[11px] text-white tabular-nums">{timeFormatted}</span>
              {' · '}{workoutType}{' · '}{timeLabel}
            </p>
            <p className="font-sans text-[9px] text-lc-dim/35 mt-2 tracking-widest uppercase">
              Tap to confirm →
            </p>
          </div>
        </div>
      )}

      {/* ── READY message (5s) ───────────────────────────────────── */}
      {phase === 'ready' && (
        <div
          ref={readyRef}
          style={{ opacity: 0 }}
          className="w-[200px] rounded-2xl border border-white/15 bg-black/95 backdrop-blur-xl px-5 py-5 shadow-[0_16px_60px_rgba(0,0,0,0.95)]"
        >
          <div className="w-1.5 h-1.5 rounded-full bg-white mb-3 animate-pulse" />
          <p className="font-sans font-700 text-white text-[18px] leading-tight tracking-tight">
            Destroy<br />this training.
          </p>
          <div className="mt-3 h-px bg-white/10" />
          <p className="font-sans text-[9px] tracking-widest uppercase text-lc-dim/40 mt-2.5 tabular-nums">
            {workoutType} · {timeFormatted}
          </p>
        </div>
      )}
    </div>
  );
}
