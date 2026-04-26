import { useState, useEffect, useCallback } from 'react';

export interface GelTrigger {
  workoutId: string;
  workoutType: string;
  workoutTime: string;
  minutesUntil: number;
}

const STORAGE_KEY = 'lc_gel_taken';

function getTaken(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch { return new Set(); }
}

function markTaken(key: string) {
  try {
    const taken = getTaken();
    taken.add(key);
    // Keep only today's entries
    const today = new Date().toISOString().split('T')[0];
    const filtered = [...taken].filter(k => k.includes(today));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  } catch { /* silent */ }
}

export function useGelAlert(userId: string | null) {
  const [gel, setGel] = useState<GelTrigger | null>(null);

  const check = useCallback(async () => {
    if (!userId) return;
    const today = new Date().toISOString().split('T')[0];
    const res = await fetch(`/api/workouts?user_id=${userId}&date=${today}`);
    const { data: workouts } = await res.json();
    if (!workouts?.length) return;

    const now     = new Date();
    const nowMins = now.getHours() * 60 + now.getMinutes();
    const taken   = getTaken();

    for (const w of workouts) {
      if (w.workout_type === 'Recovery') continue;

      const [wH, wM]     = w.event_time.split(':').map(Number);
      const workoutMins  = wH * 60 + wM;
      const minutesUntil = workoutMins - nowMins;

      if (minutesUntil >= 45 && minutesUntil <= 65) {
        const key = `gel_${w.id}_${today}`;
        if (!taken.has(key)) {
          setGel({ workoutId: key, workoutType: w.workout_type, workoutTime: w.event_time, minutesUntil });
          return;
        }
      }
    }

    // No valid alert — clear if showing
    setGel(null);
  }, [userId]);

  useEffect(() => {
    check();
    const id = setInterval(check, 60 * 1000);
    return () => clearInterval(id);
  }, [check]);

  const dismiss = (workoutId: string) => {
    markTaken(workoutId);   // persist to localStorage
    setGel(null);
  };

  return { gel, dismiss };
}
