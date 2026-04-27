// Tiny client for AI assistant. Server proxy holds the Anthropic key.
// Expected proxy contract: POST { messages: [{role, content}] } -> { text: string }
const URL = process.env.EXPO_PUBLIC_AI_PROXY_URL!;

export type ChatMsg = { role: 'user' | 'assistant'; content: string };

export async function ask(messages: ChatMsg[]): Promise<string> {
  const res = await fetch(URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages }),
  });
  if (!res.ok) throw new Error(`AI ${res.status}`);
  const data = await res.json();
  return data.text ?? '';
}
