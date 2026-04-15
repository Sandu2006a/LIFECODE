import { useState, useEffect, useCallback } from 'react';

export interface Alert {
  id: string;
  type: 'carb_deficit' | 'protein_deficit' | 'calorie_deficit' | 'pre_workout';
  title: string;
  message: string;
  action: string;
  workout: { event_time: string; workout_type: string; duration_min: number };
  severity: 'critical' | 'warning';
}

interface WorkoutEvent {
  id: string;
  event_time: string;
  workout_type: string;
  duration_min: number;
}

interface Totals {
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
}

interface Targets {
  calories_target: number;
  protein_target: number;
  carbs_target: number;
  fats_target: number;
}

// Required macros per workout type (per hour of training)
const WORKOUT_REQUIREMENTS: Record<string, { carbs_per_hour: number; protein_pre: number; lead_time_min: number }> = {
  Endurance: { carbs_per_hour: 60, protein_pre: 20, lead_time_min: 120 },
  Sprint:    { carbs_per_hour: 50, protein_pre: 15, lead_time_min: 90  },
  Strength:  { carbs_per_hour: 35, protein_pre: 30, lead_time_min: 90  },
  Recovery:  { carbs_per_hour: 20, protein_pre: 20, lead_time_min: 60  },
};

export function useProactiveAlerts(userId: string | null, totals: Totals, targets: Targets) {
  const [alerts, setAlerts]           = useState<Alert[]>([]);
  const [dismissed, setDismissed]     = useState<Set<string>>(new Set());

  const checkAlerts = useCallback(async () => {
    if (!userId) return;

    const today = new Date().toISOString().split('T')[0];
    const res   = await fetch(`/api/workouts?user_id=${userId}&date=${today}`);
    const { data: workouts } = await res.json();
    if (!workouts?.length) return;

    const now     = new Date();
    const nowMins = now.getHours() * 60 + now.getMinutes();
    const newAlerts: Alert[] = [];

    for (const w of workouts as WorkoutEvent[]) {
      const [wH, wM] = w.event_time.split(':').map(Number);
      const workoutMins  = wH * 60 + wM;
      const req          = WORKOUT_REQUIREMENTS[w.workout_type] || WORKOUT_REQUIREMENTS.Strength;
      const leadTime     = req.lead_time_min;
      const minutesUntil = workoutMins - nowMins;

      // Only alert if workout is within lead_time window and hasn't started
      if (minutesUntil > 0 && minutesUntil <= leadTime) {
        const durationHours  = (w.duration_min || 60) / 60;
        const carbsNeeded    = Math.round(req.carbs_per_hour * durationHours);
        const proteinNeeded  = req.protein_pre;
        const carbsRemaining = targets.carbs_target - totals.carbs;
        const carbDeficit    = carbsNeeded - totals.carbs;

        // Carb deficit for endurance/sprint
        if (['Endurance', 'Sprint'].includes(w.workout_type) && totals.carbs < carbsNeeded * 0.7) {
          const alertId = `carb_${w.id}_${today}`;
          if (!dismissed.has(alertId)) {
            newAlerts.push({
              id: alertId,
              type: 'carb_deficit',
              severity: carbDeficit > 40 ? 'critical' : 'warning',
              title: 'CARBOHYDRATE DEFICIT DETECTED',
              message: `Your ${w.workout_type.toLowerCase()} session at ${w.event_time} requires ~${carbsNeeded}g carbs. Current intake: ${Math.round(totals.carbs)}g. Deficit: ${Math.round(carbDeficit)}g.`,
              action: `Consume ${Math.round(carbDeficit)}g of fast carbs now — banana, rice cakes, or sports drink.`,
              workout: w,
            });
          }
        }

        // Protein deficit for strength
        if (w.workout_type === 'Strength' && totals.protein < proteinNeeded) {
          const alertId = `protein_${w.id}_${today}`;
          if (!dismissed.has(alertId)) {
            newAlerts.push({
              id: alertId,
              type: 'protein_deficit',
              severity: 'warning',
              title: 'PRE-WORKOUT PROTEIN LOW',
              message: `Strength session at ${w.event_time}. Pre-workout protein target: ${proteinNeeded}g. Current intake: ${Math.round(totals.protein)}g.`,
              action: `Have ${proteinNeeded - Math.round(totals.protein)}g protein now — whey shake or Greek yogurt.`,
              workout: w,
            });
          }
        }

        // General pre-workout reminder (30 min before)
        if (minutesUntil <= 30 && minutesUntil > 0) {
          const alertId = `preworkout_${w.id}_${today}`;
          if (!dismissed.has(alertId)) {
            newAlerts.push({
              id: alertId,
              type: 'pre_workout',
              severity: 'warning',
              title: `${w.workout_type.toUpperCase()} IN ${minutesUntil} MIN`,
              message: `${w.workout_type} session starting at ${w.event_time}. Macros today: ${Math.round(totals.calories)}kcal | P:${Math.round(totals.protein)}g C:${Math.round(totals.carbs)}g F:${Math.round(totals.fats)}g`,
              action: 'Ensure you are hydrated. Light warm-up recommended.',
              workout: w,
            });
          }
        }
      }
    }

    setAlerts(newAlerts);
  }, [userId, totals, targets, dismissed]);

  useEffect(() => {
    checkAlerts();
    const id = setInterval(checkAlerts, 5 * 60 * 1000); // every 5 min
    return () => clearInterval(id);
  }, [checkAlerts]);

  const dismiss = (id: string) => {
    setDismissed(prev => new Set([...prev, id]));
    setAlerts(prev => prev.filter(a => a.id !== id));
  };

  return { alerts, dismiss };
}
