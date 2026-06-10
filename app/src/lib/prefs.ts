import AsyncStorage from '@react-native-async-storage/async-storage';

// Local app preferences — persisted on-device. These are UI/device settings
// (units, notification times, privacy toggles), not profile data, so
// AsyncStorage is the right home: instant reads, no network, survives restarts.

export type Prefs = {
  weightUnit: 'kg' | 'lb';
  heightUnit: 'cm' | 'ft';
  pushEnabled: boolean;
  shareEnabled: boolean;
  leaderboardVisible: boolean;
  morningTime: string;   // HH:MM
  recoveryTime: string;  // HH:MM
  summaryTime: string;   // HH:MM
};

export const DEFAULT_PREFS: Prefs = {
  weightUnit: 'kg',
  heightUnit: 'cm',
  pushEnabled: true,
  shareEnabled: true,
  leaderboardVisible: true,
  morningTime: '07:00',
  recoveryTime: '19:00',
  summaryTime: '21:00',
};

const KEY = 'lifecode.prefs';

export async function loadPrefs(): Promise<Prefs> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return { ...DEFAULT_PREFS };
    return { ...DEFAULT_PREFS, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_PREFS };
  }
}

export async function savePrefs(patch: Partial<Prefs>): Promise<Prefs> {
  const current = await loadPrefs();
  const next = { ...current, ...patch };
  try { await AsyncStorage.setItem(KEY, JSON.stringify(next)); } catch {}
  return next;
}
