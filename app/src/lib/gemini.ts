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

const GEMINI_KEY = process.env.EXPO_PUBLIC_GEMINI_KEY!;
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_KEY}`;

const SYSTEM_PROMPT = `You are the LIFECODE AI — a precision performance nutrition coach built for serious athletes.
You help users understand their nutrition, supplements, training recovery, and daily micronutrient intake.
Keep answers short, confident, and science-based. No filler. No hype.`;

export async function askGemini(messages: ChatMessage[]): Promise<string> {
  try {
    const contents = messages.map(m => ({
      role: m.role,
      parts: [{ text: m.content }],
    }));

    const res = await fetch(GEMINI_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents,
        generationConfig: { temperature: 0.7, maxOutputTokens: 512 },
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error('Gemini error:', err);
      throw new Error(`Gemini ${res.status}`);
    }

    const data = await res.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text ?? 'No response from AI.';
  } catch (e) {
    console.error('askGemini failed:', e);
    return 'Unable to connect to AI assistant right now. Please try again.';
  }
}

export async function getDailySuggestions(payload: SuggestionData): Promise<Suggestion[]> {
  try {
    const prompt = `Given this athlete data: ${JSON.stringify(payload)}, provide 3 short, actionable suggestions.
Return ONLY a JSON array like:
[{"category":"nutrition","title":"Short title","message":"One sentence advice.","priority":"high"}]
Categories: nutrition, supplement, recovery, hydration. Priorities: high, medium, low.`;

    const res = await fetch(GEMINI_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.4, maxOutputTokens: 512 },
      }),
    });

    if (!res.ok) throw new Error(`Suggestions ${res.status}`);

    const data = await res.json();
    const text: string = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '[]';

    const match = text.match(/\[[\s\S]*\]/);
    if (!match) return [];
    return JSON.parse(match[0]) as Suggestion[];
  } catch (e) {
    console.error('getDailySuggestions failed:', e);
    return [];
  }
}
