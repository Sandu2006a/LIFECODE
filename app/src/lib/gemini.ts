import { supabase } from './supabase';

export type ChatMessage = { role: 'user' | 'model'; content: string };

export type SuggestionData = {
  vitaminIntake?: Record<string, number>;
  supplementIntake?: Record<string, number>;
  trainingData?: { type: string; duration: number; intensity: string } | null;
  sleep?: number;
  goals?: string[];
  sport?: string;
};

export type Suggestion = {
  category: 'nutrition' | 'supplement' | 'recovery' | 'hydration';
  title: string;
  message: string;
  priority: 'high' | 'medium' | 'low';
};

// Calls Supabase Edge Function that holds the Gemini key server-side
const AI_PROXY = process.env.EXPO_PUBLIC_AI_PROXY_URL!;

async function getAuthHeader() {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function askGemini(messages: ChatMessage[]): Promise<string> {
  try {
    const authHeader = await getAuthHeader();
    const res = await fetch(`${AI_PROXY}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeader },
      body: JSON.stringify({ messages }),
    });
    if (!res.ok) throw new Error(`AI error ${res.status}`);
    const data = await res.json();
    return data.text ?? 'No response.';
  } catch {
    return 'Unable to connect to AI assistant right now.';
  }
}

export async function getDailySuggestions(payload: SuggestionData): Promise<Suggestion[]> {
  try {
    const authHeader = await getAuthHeader();
    const res = await fetch(`${AI_PROXY}/suggestions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeader },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(`Suggestions error ${res.status}`);
    const data = await res.json();
    return data.suggestions ?? [];
  } catch {
    return [];
  }
}
