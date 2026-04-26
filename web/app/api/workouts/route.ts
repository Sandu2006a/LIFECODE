import { supabase } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const user_id = req.nextUrl.searchParams.get('user_id');
  const date    = req.nextUrl.searchParams.get('date') || new Date().toISOString().split('T')[0];
  const { data } = await supabase
    .from('workout_events')
    .select('*')
    .eq('user_id', user_id)
    .eq('event_date', date)
    .order('event_time', { ascending: true });
  return NextResponse.json({ data: data || [] });
}

export async function POST(req: NextRequest) {
  const { user_id, event_time, workout_type, duration_min, event_date } = await req.json();
  const { data, error } = await supabase
    .from('workout_events')
    .insert({
      user_id,
      event_date: event_date || new Date().toISOString().split('T')[0],
      event_time,
      workout_type,
      duration_min: duration_min || 60,
    })
    .select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id');
  await supabase.from('workout_events').delete().eq('id', id);
  return NextResponse.json({ ok: true });
}
