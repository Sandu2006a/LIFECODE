import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const TOTAL_SPOTS = 157;

function admin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

async function countTaken(): Promise<number> {
  try {
    const { count, error } = await admin()
      .from('preorders')
      .select('id', { count: 'exact', head: true });
    if (error) return 0;
    return count ?? 0;
  } catch {
    return 0;
  }
}

export async function GET() {
  const taken = await countTaken();
  const remaining = Math.max(0, TOTAL_SPOTS - taken);
  return NextResponse.json({ remaining, total: TOTAL_SPOTS, taken });
}

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json() as { email?: string };
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Adresă de email invalidă.' }, { status: 400 });
    }
    const normal = email.toLowerCase().trim();

    const taken = await countTaken();
    if (taken >= TOTAL_SPOTS) {
      return NextResponse.json(
        { error: 'Toate locurile au fost rezervate.', remaining: 0, total: TOTAL_SPOTS },
        { status: 410 }
      );
    }

    const { error } = await admin()
      .from('preorders')
      .insert({ email: normal, source: 'home' });

    if (error) {
      // Already on the list — treat as success but don't double-count.
      if ((error as any).code === '23505') {
        const remaining = Math.max(0, TOTAL_SPOTS - taken);
        return NextResponse.json({
          success: true,
          alreadyOnList: true,
          remaining,
          total: TOTAL_SPOTS,
        });
      }
      console.error('preorder insert error:', error);
      return NextResponse.json({ error: 'Nu am putut salva acum. Încearcă din nou.' }, { status: 500 });
    }

    const remaining = Math.max(0, TOTAL_SPOTS - (taken + 1));
    return NextResponse.json({
      success: true,
      remaining,
      total: TOTAL_SPOTS,
    });
  } catch (err: any) {
    console.error('preorder route error:', err);
    return NextResponse.json({ error: err?.message || 'Eroare server.' }, { status: 500 });
  }
}
