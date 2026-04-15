'use client';

import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { X, AlertTriangle, Zap } from 'lucide-react';
import { Alert } from '@/hooks/useProactiveAlerts';

export default function AlertBanner({ alerts, onDismiss }: { alerts: Alert[]; onDismiss: (id: string) => void }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const items = containerRef.current.querySelectorAll('.alert-item');
    if (items.length > 0) {
      gsap.fromTo(items,
        { opacity: 0, y: -12, scaleY: 0.95 },
        { opacity: 1, y: 0, scaleY: 1, duration: 0.4, ease: 'power3.out', stagger: 0.08 }
      );
    }
  }, [alerts.length]);

  if (alerts.length === 0) return null;

  return (
    <div ref={containerRef} className="flex-shrink-0 space-y-px">
      {alerts.map(alert => (
        <div key={alert.id}
          className={`alert-item flex items-start gap-4 px-8 py-3 border-b border-lc-line ${alert.severity === 'critical' ? 'bg-white/[0.03]' : 'bg-transparent'}`}>

          {/* Icon */}
          <div className="flex-shrink-0 mt-0.5">
            {alert.severity === 'critical'
              ? <AlertTriangle className="w-3.5 h-3.5 text-white" />
              : <Zap className="w-3.5 h-3.5 text-lc-dim" />
            }
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline gap-3 mb-0.5">
              <span className={`font-sans text-[9px] tracking-widest2 uppercase font-600 ${alert.severity === 'critical' ? 'text-white' : 'text-lc-silver'}`}>
                SYSTEM ALERT — {alert.title}
              </span>
              <span className="font-body text-[9px] text-lc-dim tracking-widest uppercase">
                {alert.workout.event_time} · {alert.workout.workout_type}
              </span>
            </div>
            <p className="font-body text-[11px] text-lc-dim leading-relaxed">{alert.message}</p>
            <p className="font-sans text-[10px] text-lc-silver/80 mt-1 tracking-wide">
              → {alert.action}
            </p>
          </div>

          {/* Dismiss */}
          <button onClick={() => onDismiss(alert.id)}
            className="flex-shrink-0 mt-0.5 text-lc-dim hover:text-lc-silver transition-colors duration-300">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}
