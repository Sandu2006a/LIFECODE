// Minimal AI proxy — deploy as Vercel Edge Function, Cloudflare Worker, or
// Supabase Edge Function. Holds your Anthropic API key server-side.
//
// Vercel: place at api/ai.ts in your Next.js project.
// Cloudflare Worker: export default { fetch }.

export const config = { runtime: 'edge' };

export default async function handler(req: Request) {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });
  const { messages } = (await req.json()) as { messages: { role: 'user' | 'assistant'; content: string }[] };

  const r = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY!,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5',
      max_tokens: 512,
      system: 'You are LIFECODE, a concise nutrition assistant for athletes.',
      messages: messages.filter((m) => m.role !== 'assistant' || messages.indexOf(m) !== 0),
    }),
  });
  const json = await r.json();
  const text = json?.content?.[0]?.text ?? '';
  return new Response(JSON.stringify({ text }), { headers: { 'content-type': 'application/json' } });
}
