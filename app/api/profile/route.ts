import { supabase } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const profile = await req.json();
  const { data, error } = await supabase
    .from('profiles')
    .upsert({ ...profile, updated_at: new Date().toISOString() }, { onConflict: 'name' })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

export async function GET(req: NextRequest) {
  const name = req.nextUrl.searchParams.get('name');
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('name', name)
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 404 });
  return NextResponse.json({ data });
}
