import { supabase } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const user_id = req.nextUrl.searchParams.get('user_id');
  const { data } = await supabase
    .from('user_memories')
    .select('*')
    .eq('user_id', user_id)
    .order('created_at', { ascending: false })
    .limit(30);
  return NextResponse.json({ data: data || [] });
}

export async function POST(req: NextRequest) {
  const { user_id, memory, category } = await req.json();
  const { data, error } = await supabase
    .from('user_memories')
    .insert({ user_id, memory, category: category || 'general' })
    .select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}
